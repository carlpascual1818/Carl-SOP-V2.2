// sop-page.js
(async function(){
  const u = await AppShell.requireAuth();
  if (!u) return;

  const pageId = AppShell.qs("page_id");
  const roleId = AppShell.qs("role_id");
  const mode = AppShell.qs("mode"); // new
  const page = AppShell.renderShell({ title: "SOP Page" });
  document.getElementById("whoami").textContent = u.email;

  const card = AppShell.el("div",{class:"card"});
  card.innerHTML = `
    <div class="row">
      <div class="grow">
        <div style="font-weight:800;font-size:16px;" id="hdr">SOP</div>
        <div class="small" id="meta"></div>
      </div>
      <a class="btn" href="javascript:history.back()">Back</a>
    </div>
    <div class="hr"></div>

    <div class="kv">
      <div class="small">Title</div>
      <input id="title" class="input" placeholder="SOP title"/>
      <div class="small">Slug</div>
      <input id="slug" class="input" placeholder="auto-generated"/>
    </div>

    <div class="hr"></div>

    <div class="row">
      <span class="pill draft" id="statusPill">Draft</span>
      <label class="pill"><input type="checkbox" id="requiresAck" style="margin-right:8px;"/>Requires acknowledgement</label>
      <div class="grow"></div>
      <button class="btn" id="btnSave">Save draft</button>
      <button class="btn" id="btnSubmit">Submit</button>
      <button class="btn primary" id="btnPublish">Publish</button>
    </div>

    <div class="hr"></div>

    <div class="small">Content</div>
    <textarea id="content" class="input" placeholder="Write SOP content here..."></textarea>

    <div id="msg" style="margin-top:10px;"></div>
  `;
  page.appendChild(card);

  const msg = document.getElementById("msg");

  function setMsg(type, text){
    msg.className = type === "error" ? "error" : "notice";
    msg.textContent = text;
  }

  function setStatus(status){
    const pill = Utils.statusPill(status);
    const el = document.getElementById("statusPill");
    el.className = "pill " + pill.cls;
    el.textContent = pill.label;
  }

  let current = null;

  if (mode === "new"){
    if (!roleId){
      setMsg("error","Missing role_id for new SOP.");
      return;
    }
    document.getElementById("hdr").textContent = "New SOP";
    setStatus("draft");
  } else {
    if (!pageId){
      setMsg("error","Missing page_id.");
      return;
    }
    const res = await window.sb.from("sop_pages").select("*").eq("id", pageId).maybeSingle();
    if (res.error){
      setMsg("error", res.error.message);
      return;
    }
    current = res.data;
    document.getElementById("hdr").textContent = current.title;
    document.getElementById("title").value = current.title;
    document.getElementById("slug").value = current.slug;
    document.getElementById("requiresAck").checked = !!current.requires_ack;
    document.getElementById("content").value = (current.content && current.content.text) ? current.content.text : "";
    setStatus(current.status);
    document.getElementById("meta").textContent = "Last updated: " + (current.updated_at || "");
  }

  document.getElementById("title").addEventListener("input", (e) => {
    if (!document.getElementById("slug").value.trim()){
      document.getElementById("slug").value = Utils.slugify(e.target.value);
    }
  });

  async function saveDraft(){
    const title = document.getElementById("title").value.trim();
    const slug = document.getElementById("slug").value.trim() || Utils.slugify(title);
    const requires_ack = document.getElementById("requiresAck").checked;
    const content = { text: document.getElementById("content").value };

    if (!title) return setMsg("error","Title is required.");
    if (!slug) return setMsg("error","Slug is required.");

    if (mode === "new"){
      const payload = {
        role_id: roleId,
        title: title,
        slug: slug,
        content: content,
        status: "draft",
        requires_ack: requires_ack,
        created_by: u.email,
        updated_by: u.email,
        updated_at: new Date().toISOString()
      };
      const ins = await window.sb.from("sop_pages").insert(payload).select("*").single();
      if (ins.error) return setMsg("error", ins.error.message);
      current = ins.data;
      history.replaceState(null,"","sop-page.html?page_id=" + encodeURIComponent(current.id));
      document.getElementById("hdr").textContent = current.title;
      setStatus(current.status);
      setMsg("ok","Draft created.");
      return;
    }

    const upd = await window.sb.from("sop_pages").update({
      title: title,
      slug: slug,
      content: content,
      requires_ack: requires_ack,
      updated_by: u.email,
      updated_at: new Date().toISOString()
    }).eq("id", current.id).select("*").single();

    if (upd.error) return setMsg("error", upd.error.message);
    current = upd.data;
    setStatus(current.status);
    setMsg("ok","Saved.");
  }

  async function submit(){
    if (!current) return setMsg("error","Save the draft first.");
    await saveDraft();
    const ins = await window.sb.from("sop_review_requests").insert({
      page_id: current.id,
      requested_by: u.email,
      state: "pending",
      note: ""
    });
    if (ins.error) return setMsg("error", ins.error.message);
    const upd = await window.sb.from("sop_pages").update({
      status:"in_review",
      updated_by:u.email,
      updated_at:new Date().toISOString()
    }).eq("id", current.id);
    if (upd.error) return setMsg("error", upd.error.message);
    current.status = "in_review";
    setStatus("in_review");
    setMsg("ok","Submitted for review.");
  }

  async function publish(){
    if (!current) return setMsg("error","Save the draft first.");
    await saveDraft();

    const nextVer = (current.published_version || 0) + 1;
    const verIns = await window.sb.from("sop_page_versions").insert({
      page_id: current.id,
      version_number: nextVer,
      content: current.content,
      created_by: u.email
    });
    if (verIns.error) return setMsg("error", verIns.error.message);

    const upd = await window.sb.from("sop_pages").update({
      status:"published",
      published_version: nextVer,
      updated_by:u.email,
      updated_at:new Date().toISOString()
    }).eq("id", current.id).select("*").single();

    if (upd.error) return setMsg("error", upd.error.message);
    current = upd.data;
    setStatus("published");
    setMsg("ok","Published v" + nextVer + ".");
  }

  document.getElementById("btnSave").onclick = saveDraft;
  document.getElementById("btnSubmit").onclick = submit;
  document.getElementById("btnPublish").onclick = publish;
})();
