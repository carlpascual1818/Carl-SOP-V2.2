// supabase-client.js
// Creates window.sb (Supabase client) once, using values from config.js
(function () {
  if (!window.APP_CONFIG) throw new Error("Missing window.APP_CONFIG. Did config.js load?");
  if (!window.supabase || !window.supabase.createClient) throw new Error("Supabase JS not loaded.");

  const url = (window.APP_CONFIG.SUPABASE_URL || "").trim();
  const key = (window.APP_CONFIG.SUPABASE_ANON_KEY || "").trim();

  if (!/^https?:\/\//i.test(url)) throw new Error("Bad SUPABASE_URL in config.js. Must start with https://");
  if (!key) throw new Error("Missing SUPABASE_ANON_KEY in config.js.");

  window.sb = window.supabase.createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
})();
