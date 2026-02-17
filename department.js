// department.js
(async function(){
  const u = await AppShell.requireAuth();
  if (!u) return;

  const departmentId = AppShell.qs("department_id");
  const page = AppShell.renderShell({ title: "Department" });
  document.getElementById("whoami").textContent = u.email;

  const card = AppShell.el("div",{class:"card"});
  card.innerHTML = `
    <div class="row">
      <div class="grow">
        <div id="deptName" style="font-weight:800;font-size:16px;">Department</div>
        <div class="small">Click a role to open its hub.</div>
      </div>
      <a class="btn" href="departments.html">Back</a>
    </div>
    <div class="hr"></div>
    <div id="roles" class="list"></div>
    <div id="msg" style="margin-top:10px;"></div>
  `;
  page.appendChild(card);

  if (!departmentId){
    const m = document.getElementById("msg");
    m.className = "error";
    m.textContent = "Missing department_id.";
    return;
  }

  const dept = await window.sb.from("departments").select("*").eq("id", departmentId).maybeSingle();
  if (!dept.error && dept.data) document.getElementById("deptName").textContent = dept.data.name;

  const res = await window.sb.from("roles")
    .select("*")
    .eq("department_id", departmentId)
    .eq("is_active", true)
    .order("sort_order",{ascending:true})
    .order("name",{ascending:true});

  if (res.error){
    const m = document.getElementById("msg");
    m.className = "error";
    m.textContent = res.error.message;
    return;
  }

  const roles = document.getElementById("roles");
  (res.data || []).forEach(r => {
    const it = AppShell.el("div",{class:"item"});
    it.innerHTML = `
      <div class="top">
        <div class="title">${Utils.escapeHtml(r.name)}</div>
        <a class="btn" href="role.html?role_id=${encodeURIComponent(r.id)}">Open</a>
      </div>
      <div class="sub">Overview, Responsibilities, SOPs, KPIs, Tools</div>
    `;
    roles.appendChild(it);
  });

  if (!res.data || res.data.length === 0){
    roles.appendChild(AppShell.el("div",{class:"notice"},"No roles yet for this department. Create roles in Admin."));
  }
})();
