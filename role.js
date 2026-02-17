// role.js
(async function(){
  const u = await AppShell.requireAuth();
  if (!u) return;

  const roleId = AppShell.qs("role_id");
  const page = AppShell.renderShell({ title: "Role" });
  document.getElementById("whoami").textContent = u.email;

  const root = AppShell.el("div",{class:"card"});
  root.innerHTML = `
    <div class="row">
      <div class="grow">
        <div id="roleName" style="font-weight:800;font-size:16px;">Role</div>
        <div class="small" id="roleMeta"></div>
      </div>
      <a class="btn" href="javascript:history.back()">Back</a>
    </div>
    <div class="tabs" id="tabs"></div>
    <div class="hr"></div>
    <div id="panel"></div>
  `;
  page.appendChild(root);

  if (!roleId){
    document.getElementById("panel").innerHTML = '<div class="error">Missing role_id.</div>';
    return;
  }

  const roleRes = await window.sb.from("roles").select("*, departments(name)").eq("id", roleId).maybeSingle();
  if (roleRes.error){
    document.getElementById("panel").innerHTML = '<div class="error">' + Utils.escapeHtml(roleRes.error.message) + '</div>';
    return;
  }
  const role = roleRes.data;
  document.getElementById("roleName").textContent = role.name;
  document.getElementById("roleMeta").textContent = role.departments && role.departments.name ? ("Department: " + role.departments.name) : "";

  const tabs = [
    { key:"overview", label:"Overview" },
    { key:"responsibilities", label:"Responsibilities" },
    { key:"sops", label:"SOPs" },
    { key:"kpis", label:"KPIs" },
    { key:"tools", label:"Tools" }
  ];

  const tabsEl = document.getElementById("tabs");
  const panel = document.getElementById("panel");

  function renderTextEditor(key, title){
    panel.innerHTML = `
      <div class="row">
        <div class="grow">
          <div style="font-weight:800">${title}</div>
          <div class="small">Saved in role_hubs.content.${key} as plain text.</div>
        </div>
        <button class="btn" id="btnSave">Save</button>
      </div>
      <div class="hr"></div>
      <textarea id="txt" class="input" placeholder="Type here..."></textarea>
      <div id="msg" style="margin-top:10px;"></div>
    `;

    (async () => {
      const hub = await window.sb.from("role_hubs").select("*").eq("role_id", roleId).maybeSingle();
      const val = hub.data && hub.data.content && hub.data.content[key] ? (hub.data.content[key].text || "") : "";
      document.getElementById("txt").value = val;
    })();

    document.getElementById("btnSave").onclick = async () => {
      const txt = document.getElementById("txt").value;
      const hub = await window.sb.from("role_hubs").select("*").eq("role_id", roleId).maybeSingle();
      const content = hub.data && hub.data.content ? hub.data.content : {};
      content[key] = { text: txt };
      const payload = { role_id: roleId, content: content, updated_at: new Date().toISOString(), updated_by: u.email };
      const up = await window.sb.from("role_hubs").upsert(payload, { onConflict:"role_id" });
      const msg = document.getElementById("msg");
      msg.className = up.error ? "error" : "notice";
      msg.textContent = up.error ? up.error.message : "Saved.";
    };
  }

  async function renderSops(){
    panel.innerHTML = `
      <div class="row">
        <div class="grow">
          <div style="font-weight:800">SOPs</div>
          <div class="small">Categories are buckets. SOPs are separate pages.</div>
        </div>
        <a class="btn" href="sop-page.html?role_id=${encodeURIComponent(roleId)}&mode=new">New SOP</a>
      </div>
      <div class="hr"></div>
      <div id="cats" class="list"></div>
      <div id="msg" style="margin-top:10px;"></div>
    `;

    const catsEl = document.getElementById("cats");
    const cats = await window.sb.from("sop_categories").select("*").eq("role_id", roleId).order("sort_order",{ascending:true});
    if (cats.error){
      const m = document.getElementById("msg");
      m.className = "error";
      m.textContent = cats.error.message;
      return;
    }

    if (!cats.data || cats.data.length === 0){
      catsEl.appendChild(AppShell.el("div",{class:"notice"},"No categories yet. Create them in Admin."));
      return;
    }

    for (const c of cats.data){
      const pagesRes = await window.sb.from("sop_pages")
        .select("id,title,slug,status,updated_at")
        .eq("role_id", roleId)
        .eq("category_id", c.id)
        .order("updated_at",{ascending:false});

      const it = AppShell.el("div",{class:"item"});
      const rows = (pagesRes.data || []).map(p => {
        const pill = Utils.statusPill(p.status);
        return '<div class="row" style="justify-content:space-between;margin-top:6px;">' +
          '<div>' +
            '<a href="sop-page.html?page_id=' + encodeURIComponent(p.id) + '" style="font-weight:700;">' + Utils.escapeHtml(p.title) + '</a>' +
            '<div class="small">' + Utils.escapeHtml(p.slug) + '</div>' +
          '</div>' +
          '<span class="pill ' + pill.cls + '">' + pill.label + '</span>' +
        '</div>';
      }).join("");

      it.innerHTML = `
        <div class="top">
          <div class="title">${Utils.escapeHtml(c.name)}</div>
        </div>
        <div class="sub">${rows || '<span class="small">No SOPs yet in this category.</span>'}</div>
      `;
      catsEl.appendChild(it);
    }
  }

  function activate(key){
    tabsEl.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    const active = tabsEl.querySelector('[data-tab="' + key + '"]');
    if (active) active.classList.add("active");

    if (key === "overview") renderTextEditor("overview","Overview");
    if (key === "responsibilities") renderTextEditor("responsibilities","Responsibilities");
    if (key === "kpis") renderTextEditor("kpis","KPIs");
    if (key === "tools") renderTextEditor("tools","Tools and Access");
    if (key === "sops") renderSops();
  }

  tabs.forEach(t => {
    const tab = AppShell.el("div",{class:"tab", "data-tab":t.key}, t.label);
    tab.onclick = () => activate(t.key);
    tabsEl.appendChild(tab);
  });

  activate(AppShell.qs("tab") || "overview");
})();
