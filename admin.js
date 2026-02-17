// admin.js
(async function(){
  const u = await AppShell.requireAuth();
  if (!u) return;

  const page = AppShell.renderShell({ title: "Admin" });
  document.getElementById("whoami").textContent = u.email;

  const box = AppShell.el("div",{class:"card"});
  box.innerHTML = `
    <div class="row">
      <div class="grow">
        <div style="font-weight:800;font-size:16px;">Quick setup</div>
        <div class="small">Create departments, roles, categories. Branding lives in settings.</div>
      </div>
    </div>

    <div class="hr"></div>

    <div style="font-weight:800;margin-bottom:8px;">Branding</div>
    <div class="kv">
      <div class="small">Company name</div>
      <input id="companyName" class="input" placeholder="Company name"/>
      <div class="small">Logo path (branding bucket)</div>
      <input id="logoPath" class="input" placeholder="company-logo.png"/>
    </div>
    <div class="row" style="margin-top:10px;">
      <button class="btn" id="btnSaveBrand">Save branding</button>
      <div class="grow"></div>
    </div>

    <div class="hr"></div>

    <div style="font-weight:800;margin-bottom:8px;">Create department</div>
    <div class="row">
      <input id="deptName" class="input grow" placeholder="Department name"/>
      <input id="deptSort" class="input" style="width:140px" type="number" value="100" />
      <button class="btn" id="btnDept">Create</button>
    </div>

    <div class="hr"></div>

    <div style="font-weight:800;margin-bottom:8px;">Create role</div>
    <div class="kv">
      <div class="small">Role name</div>
      <input id="roleName" class="input" placeholder="COO"/>
      <div class="small">Department</div>
      <select id="roleDept" class="input"></select>

      <div class="small">Parent role (org chart)</div>
      <select id="roleParent" class="input"></select>

      <div class="small">Sort order</div>
      <input id="roleSort" class="input" type="number" value="100"/>
    </div>
    <div class="row" style="margin-top:10px;">
      <button class="btn" id="btnRole">Create role</button>
      <div class="grow"></div>
    </div>

    <div class="hr"></div>

    <div style="font-weight:800;margin-bottom:8px;">Create SOP category</div>
    <div class="row">
      <select id="catRole" class="input grow"></select>
      <input id="catName" class="input grow" placeholder="Pre purchase"/>
      <input id="catSort" class="input" style="width:140px" type="number" value="100"/>
      <button class="btn" id="btnCat">Create</button>
    </div>

    <div id="msg" style="margin-top:12px;"></div>
    <div class="small" style="margin-top:10px;">
      If you get RLS errors here, add your email to public.users with role COO or CEO.
    </div>
  `;
  page.appendChild(box);

  const msg = document.getElementById("msg");
  function setMsg(type, text){
    msg.className = type === "error" ? "error" : "notice";
    msg.textContent = text;
  }

  const brand = await window.sb.from("settings").select("value").eq("key","branding").maybeSingle();
  if (!brand.error){
    document.getElementById("companyName").value = brand.data && brand.data.value ? (brand.data.value.company_name || "") : "";
    document.getElementById("logoPath").value = brand.data && brand.data.value ? (brand.data.value.logo_path || "") : "";
  }

  document.getElementById("btnSaveBrand").onclick = async () => {
    const company_name = document.getElementById("companyName").value.trim() || "SOP Portal";
    const logo_path = document.getElementById("logoPath").value.trim();
    const up = await window.sb.from("settings").upsert({
      key:"branding",
      value:{ company_name:company_name, logo_path:logo_path },
      updated_at: new Date().toISOString(),
      updated_by: u.email
    }, { onConflict:"key" });
    if (up.error) return setMsg("error", up.error.message);
    setMsg("ok","Branding saved.");
  };

  async function reloadSelects(){
    const deps = await window.sb.from("departments").select("id,name").order("sort_order",{ascending:true}).order("name",{ascending:true});
    const roles = await window.sb.from("roles").select("id,name").order("sort_order",{ascending:true}).order("name",{ascending:true});

    const roleDept = document.getElementById("roleDept");
    const catRole = document.getElementById("catRole");
    roleDept.innerHTML = "";
    catRole.innerHTML = "";

    (deps.data || []).forEach(d => roleDept.appendChild(new Option(d.name, d.id)));

    const roleParent = document.getElementById("roleParent");
    roleParent.innerHTML = "";
    roleParent.appendChild(new Option("(no parent)", ""));
    (roles.data || []).forEach(r => {
      roleParent.appendChild(new Option(r.name, r.id));
      catRole.appendChild(new Option(r.name, r.id));
    });
  }
  await reloadSelects();

  document.getElementById("btnDept").onclick = async () => {
    const name = document.getElementById("deptName").value.trim();
    const sort_order = parseInt(document.getElementById("deptSort").value || "100",10);
    if (!name) return setMsg("error","Department name is required.");
    const ins = await window.sb.from("departments").insert({ name:name, sort_order:sort_order });
    if (ins.error) return setMsg("error", ins.error.message);
    setMsg("ok","Department created.");
    document.getElementById("deptName").value = "";
    await reloadSelects();
  };

  document.getElementById("btnRole").onclick = async () => {
    const name = document.getElementById("roleName").value.trim();
    const department_id = document.getElementById("roleDept").value || null;
    const parent_role_id = document.getElementById("roleParent").value || null;
    const sort_order = parseInt(document.getElementById("roleSort").value || "100",10);
    if (!name) return setMsg("error","Role name is required.");
    const ins = await window.sb.from("roles").insert({ name:name, department_id:department_id, parent_role_id:parent_role_id, sort_order:sort_order, is_active:true });
    if (ins.error) return setMsg("error", ins.error.message);
    setMsg("ok","Role created.");
    document.getElementById("roleName").value = "";
    await reloadSelects();
  };

  document.getElementById("btnCat").onclick = async () => {
    const role_id = document.getElementById("catRole").value;
    const name = document.getElementById("catName").value.trim();
    const sort_order = parseInt(document.getElementById("catSort").value || "100",10);
    if (!role_id) return setMsg("error","Pick a role.");
    if (!name) return setMsg("error","Category name is required.");
    const ins = await window.sb.from("sop_categories").insert({ role_id:role_id, name:name, sort_order:sort_order });
    if (ins.error) return setMsg("error", ins.error.message);
    setMsg("ok","Category created.");
    document.getElementById("catName").value = "";
  };
})();
