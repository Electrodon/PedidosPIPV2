# 🍽️ RapidoYa — PWA de Delivery

## ¿Qué incluye esta PWA?

- ✅ `manifest.json` — nombre, íconos, colores, modo standalone
- ✅ `service-worker.js` — cache offline, push notifications, background sync
- ✅ `index.html` — todos los meta tags para iOS y Android
- ✅ Banner de instalación automático (Android) e instrucciones para iOS
- ✅ Splash screen animado mientras carga
- ✅ `vercel.json` — configuración lista para deploy

---

## 🚀 Cómo subir a Vercel (gratis, sin servidor)

### Opción A — Sin código (más fácil)
1. Creá una cuenta en [vercel.com](https://vercel.com)
2. Subí esta carpeta a GitHub (o arrastrá directo en Vercel)
3. Vercel detecta automáticamente que es React y hace el build
4. En ~2 minutos tenés tu URL: `rapidoya.vercel.app`

### Opción B — Con CLI
```bash
npm install -g vercel
cd rapidoya
npm install
vercel
```

---

## 📱 Cómo instalarla en el celular

### Android (Chrome)
- El banner aparece automáticamente al abrir la URL
- O: menú (⋮) → "Agregar a pantalla de inicio"

### iPhone / iPad (Safari)
- Abrí la URL en Safari (no Chrome)
- Tocá el botón Compartir (📤)
- Seleccioná "Agregar a pantalla de inicio"
- Listo — aparece como app nativa

---

## 📁 Estructura del proyecto

```
rapidoya/
├── public/
│   ├── index.html          ← Meta tags PWA, splash, SW registration
│   ├── manifest.json       ← Configuración PWA
│   ├── service-worker.js   ← Cache offline + push notifications
│   └── icons/              ← Íconos en todos los tamaños (agregar manualmente)
├── src/
│   ├── index.js            ← Entry point React
│   └── App.jsx             ← Toda la lógica de la app
├── package.json
└── vercel.json             ← Config de deploy
```

---

## 🔔 Push Notifications

El `service-worker.js` ya tiene soporte para push notifications.
Para activarlas necesitás un backend que envíe notificaciones vía Web Push API.
Con Supabase Edge Functions o Firebase Cloud Messaging se puede implementar fácilmente.

---

## 🎨 Íconos

Necesitás generar íconos en estos tamaños y colocarlos en `/public/icons/`:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

Podés generarlos gratis en: [realfavicongenerator.net](https://realfavicongenerator.net)
