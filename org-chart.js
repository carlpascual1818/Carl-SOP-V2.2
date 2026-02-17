// org-chart.js
(async function(){
  const u = await AppShell.requireAuth();
  if (!u) return;

  const page = AppShell.renderShell({ title: "Org Chart" });
  document.getElementById("whoami").textContent = u.email;

  const card = AppShell.el("div",{class:"card"});
  card.innerHTML = `
    <div class="row">
      <div class="grow">
        <div style="font-weight:800;font-size:16px;">Company org chart</div>
        <div class="small">Hierarchy is based on roles.parent_role_id. People are assigned to roles.</div>
      </div>
      <a class="btn" href="admin.html">Manage</a>
    </div>
    <div class="hr"></div>
    <div id="tree"></div>
    <div id="msg" style="margin-top:10px;"></div>
  `;
  page.appendChild(card);

  const msg = document.getElementById("msg");

  const rolesRes = await window.sb.from("roles").select("id,name,parent_role_id,sort_order,is_active").eq("is_active", true).order("sort_order",{ascending:true});
  if (rolesRes.error){
    msg.className = "error"; msg.textContent = rolesRes.error.message; return;
  }
  const roles = rolesRes.data || [];

  const peopleRes = await window.sb.from("people_roles").select("role_id, people(name,title,birthday,photo_path)").order("created_at",{ascending:true});
  if (peopleRes.error){
    msg.className = "error"; msg.textContent = peopleRes.error.message; return;
  }

  const byParent = new Map();
  roles.forEach(r => {
    const p = r.parent_role_id || "__root__";
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p).push(r);
  });

  const peopleByRole = new Map();
  (peopleRes.data || []).forEach(pr => {
    if (!peopleByRole.has(pr.role_id)) peopleByRole.set(pr.role_id, []);
    peopleByRole.get(pr.role_id).push(pr.people);
  });

  function renderNode(role, depth){
    const wrap = AppShell.el("div",{style:"margin-left:"+(depth*18)+"px;margin-top:10px;"});
    const peeps = peopleByRole.get(role.id) || [];
    const peepHtml = peeps.map(p => {
      const b = p.birthday ? (" | Bday: " + p.birthday) : "";
      const t = p.title ? (" | " + p.title) : "";
      return "<div class='small'>• " + Utils.escapeHtml(p.name) + Utils.escapeHtml(t) + Utils.escapeHtml(b) + "</div>";
    }).join("");

    wrap.innerHTML = `
      <div class="item">
        <div class="top">
          <div class="title">${Utils.escapeHtml(role.name)}</div>
          <a class="btn" href="role.html?role_id=${encodeURIComponent(role.id)}">Open</a>
        </div>
        <div class="sub">${peepHtml || "<span class='small'>No one assigned.</span>"}</div>
      </div>
    `;

    const kids = byParent.get(role.id) || [];
    kids.forEach(k => wrap.appendChild(renderNode(k, depth+1)));
    return wrap;
  }

  const tree = document.getElementById("tree");
  const roots = byParent.get("__root__") || [];
  if (roots.length === 0){
    tree.innerHTML = "<div class='notice'>No roles yet. Create roles and set parent_role_id in Admin.</div>";
    return;
  }
  roots.forEach(r => tree.appendChild(renderNode(r, 0)));
})();
