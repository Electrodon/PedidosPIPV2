<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#f97316" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="RapidoYa" />
    <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
    <link rel="manifest" href="/manifest.json" />
    <title>RapidoYa — Tu comida favorita</title>
    <style>
      body { background: #0f172a; margin: 0; padding: 0; }
      #splash {
        position: fixed; inset: 0; background: #0f172a;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        z-index: 9999; transition: opacity 0.4s ease;
      }
      #splash.hidden { opacity: 0; pointer-events: none; }
      #splash-icon { font-size: 72px; animation: bounce 1s ease-in-out infinite; }
      #splash-title { color: #f97316; font-size: 32px; font-weight: 900; margin-top: 12px; font-family: sans-serif; }
      #splash-sub { color: #475569; font-size: 14px; margin-top: 8px; font-family: sans-serif; }
      @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
    </style>
  </head>
  <body>
    <div id="splash">
      <div id="splash-icon">🍽️</div>
      <div id="splash-title">RapidoYa</div>
      <div id="splash-sub">Tu comida favorita, en tu puerta</div>
    </div>
    <div id="root"></div>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('[PWA] SW registrado:', reg.scope))
            .catch(err => console.warn('[PWA] SW error:', err));
        });
      }
      let deferredPrompt;
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        window.dispatchEvent(new CustomEvent('pwa-installable'));
      });
      window.installPWA = async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          await deferredPrompt.userChoice;
          deferredPrompt = null;
        }
      };
      window.hideSplash = () => {
        const splash = document.getElementById('splash');
        if (splash) {
          splash.classList.add('hidden');
          setTimeout(() => splash.remove(), 400);
        }
      };
    </script>
  </body>
</html>
