window.SHASHA_CONFIG = {
  academyName: "ShaSha Online Academy",
  whatsappNumber: "263719883520",
  whatsappNumbers: [
    { label: "0719 883 520", number: "263719883520" },
    { label: "0782 224 754", number: "263782224754" }
  ],
  callNumbers: [
    { label: "0719 883 520", number: "+263719883520" },
    { label: "0782 224 754", number: "+263782224754" }
  ],
  emailAddress: "",
  country: "Zimbabwe",
  currency: "USD",
  supabaseUrl: "https://wchctuyglpafeokvemzl.supabase.co",
  supabasePublishableKey: "sb_publishable_R-VlWyQNzLLwMKx9VFsk1Q_M0yxvK3I"
};

(() => {
  if (!document.getElementById('enrol-form')) return;
  if (!document.querySelector('script[data-supabase-sdk]')) {
    const sdk = document.createElement('script');
    sdk.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    sdk.dataset.supabaseSdk = 'true';
    sdk.onload = () => {
      window.shashaDb = window.supabase.createClient(
        window.SHASHA_CONFIG.supabaseUrl,
        window.SHASHA_CONFIG.supabasePublishableKey,
        { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
      );
      const backend = document.createElement('script');
      backend.src = 'backend.js';
      document.head.appendChild(backend);
    };
    document.head.appendChild(sdk);
  }
})();
