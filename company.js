// company.js
(async function(){
  const u = await AppShell.requireAuth();
  if (!u) return;

  const page = AppShell.renderShell({ title: "Company Overview" });
  document.getElementById("whoami").textContent = u.email;

  const box = AppShell.el("div",{class:"card"});
  box.innerHTML = `
    <div class="row">
      <div class="grow">
        <div style="font-weight:800;font-size:16px;">Overview</div>
        <div class="small">Editable content stored in sop_content.section = company.</div>
      </div>
      <button class="btn" id="btnSave">Save</button>
    </div>
    <div class="hr"></div>
    <textarea id="txt" class="input" placeholder="Write your company overview here..."></textarea>
    <div class="small" style="margin-top:8px;">Saved as plain text in jsonb: { text: "..." }</div>
    <div id="msg" style="margin-top:10px;"></div>
  `;
  page.appendChild(box);

  const res = await window.sb.from("sop_content").select("*").eq("section","company").maybeSingle();
  if (!res.error && res.data && res.data.content && res.data.content.text) {
    document.getElementById("txt").value = res.data.content.text;
  }

  document.getElementById("btnSave").onclick = async () => {
    const text = document.getElementById("txt").value;
    const payload = { section:"company", content:{ text:text }, updated_at:new Date().toISOString(), updated_by:u.email };
    const up = await window.sb.from("sop_content").upsert(payload, { onConflict:"section" });
    const msg = document.getElementById("msg");
    msg.className = up.error ? "error" : "notice";
    msg.textContent = up.error ? up.error.message : "Saved.";
  };
})();
