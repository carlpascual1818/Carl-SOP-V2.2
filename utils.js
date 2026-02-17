// utils.js
(function () {
  function escapeHtml(s){
    return String(s == null ? "" : s)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#39;");
  }

  function slugify(s){
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g,"")
      .replace(/\s+/g,"-")
      .replace(/-+/g,"-")
      .replace(/^-|-$/g,"");
  }

  function statusPill(status){
    const map = {
      draft: {cls:"draft", label:"Draft"},
      in_review: {cls:"warn", label:"In review"},
      published: {cls:"ok", label:"Published"}
    };
    return map[status] || {cls:"draft", label:(status || "Draft")};
  }

  window.Utils = { escapeHtml, slugify, statusPill };
})();
