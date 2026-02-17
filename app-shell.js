// app-shell.js
(function () {
  function el(tag, attrs, ...children) {
    const n = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(([k,v]) => {
        if (k === "class") n.className = v;
        else if (k === "html") n.innerHTML = v;
        else n.setAttribute(k, v);
      });
    }
    children.forEach(c => {
      if (c == null) return;
      if (typeof c === "string") n.appendChild(document.createTextNode(c));
      else n.appendChild(c);
    });
    return n;
  }

  function qs(name){
    const u = new URL(location.href);
    return u.searchParams.get(name) || "";
  }

  function setActiveNav(){
    const here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("[data-nav]").forEach(a => {
      if (a.getAttribute("data-nav") === here) a.classList.add("active");
    });
  }

  async function loadLogo(){
    try{
      const { data, error } = await window.sb.from("settings").select("value").eq("key","branding").maybeSingle();
      if (error) return;
      const logoPath = data && data.value ? (data.value.logo_path || "") : "";
      const companyName = data && data.value ? (data.value.company_name || "SOP Portal") : "SOP Portal";
      const img = document.querySelector("#brandLogo");
      const nm = document.querySelector("#brandName");
      if (nm) nm.textContent = companyName;
      if (img && logoPath){
        const { data:pub } = window.sb.storage.from("branding").getPublicUrl(logoPath);
        if (pub && pub.publicUrl) img.src = pub.publicUrl;
      }
    }catch(e){}
  }

  async function currentUser(){
    const { data } = await window.sb.auth.getUser();
    return data && data.user ? data.user : null;
  }

  async function requireAuth(){
    const u = await currentUser();
    if (!u){
      location.href = "login.html";
      return null;
    }
    return u;
  }

  function renderShell(opts){
    const title = (opts && opts.title) ? opts.title : "";
    const root = document.getElementById("app");
    root.innerHTML = "";

    const sidebar = el("div",{class:"sidebar"},
      el("div",{class:"brand"},
        el("img",{id:"brandLogo", src:"", alt:"Logo", onerror:"this.style.display='none'"}),
        el("div",null,
          el("div",{class:"name", id:"brandName"},"SOP Portal"),
          el("div",{class:"sub"},"Internal knowledge")
        )
      ),
      el("div",{class:"nav"},
        el("a",{href:"company.html", "data-nav":"company.html"}, el("span",{class:"icon"},"🏢"), "Company Overview"),
        el("a",{href:"org-chart.html", "data-nav":"org-chart.html"}, el("span",{class:"icon"},"🧭"), "Org Chart"),
        el("a",{href:"departments.html", "data-nav":"departments.html"}, el("span",{class:"icon"},"🗂️"), "Departments"),
        el("a",{href:"admin.html", "data-nav":"admin.html"}, el("span",{class:"icon"},"⚙️"), "Admin")
      )
    );

    const main = el("div",{class:"main"},
      el("div",{class:"header"},
        el("div",{class:"title"}, title),
        el("div",{class:"meta"},
          el("span",{id:"whoami"},""),
          el("button",{class:"btn ghost", id:"btnSignOut"},"Sign out")
        )
      ),
      el("div",{id:"page"},"")
    );

    const shell = el("div",{class:"shell"}, sidebar, main);
    root.appendChild(shell);

    document.getElementById("btnSignOut").onclick = async () => {
      await window.sb.auth.signOut();
      location.href = "login.html";
    };

    setActiveNav();
    loadLogo();

    return document.getElementById("page");
  }

  window.AppShell = { el, qs, renderShell, requireAuth, currentUser };
})();
