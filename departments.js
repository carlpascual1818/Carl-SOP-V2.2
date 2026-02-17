// departments.js
(async function(){
  const u = await AppShell.requireAuth();
  if (!u) return;

  const page = AppShell.renderShell({ title: "Departments" });
  document.getElementById("whoami").textContent = u.email;

  const wrap = AppShell.el("div",{class:"card"});
  wrap.innerHTML = `
    <div class="row">
      <div class="grow">
        <div style="font-weight:800;font-size:16px;">Browse departments</div>
        <div class="small">Click a department to see roles, then open a role hub.</div>
      </div>
      <a class="btn" href="admin.html">Manage</a>
    </div>
    <div class="hr"></div>
    <div id="list" class="list"></div>
    <div id="msg" style="margin-top:10px;"></div>
  `;
  page.appendChild(wrap);

  const res = await window.sb.from("departments").select("*").order("sort_order",{ascending:true}).order("name",{ascending:true});
  const list = document.getElementById("list");
  if (res.error){
    const m = document.getElementById("msg");
    m.className = "error";
    m.textContent = res.error.message;
    return;
  }

  (res.data || []).forEach(d => {
    const it = AppShell.el("div",{class:"item"});
    it.innerHTML = `
      <div class="top">
        <div class="title">${Utils.escapeHtml(d.name)}</div>
        <a class="btn" href="department.html?department_id=${encodeURIComponent(d.id)}">Open</a>
      </div>
      <div class="sub">Roles and SOPs by role</div>
    `;
    list.appendChild(it);
  });

  if (!res.data || res.data.length === 0){
    list.appendChild(AppShell.el("div",{class:"notice"},"No departments yet. Create one in Admin."));
  }
})();
