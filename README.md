# Blazor PWA Hosted in ASP.NET Core

This solution demonstrates a **classic Blazor WebAssembly PWA** that is **hosted inside an ASP.NET Core application**, with a **custom Service Worker** and a **controlled update-available flow**.

The goal is to keep the familiar *PWA Client + ASP.NET Core Server (BFF)* architecture which was available as VS template prior to .Net 8 release.

---

## Solution Overview

The solution consists of:

- **ASP.NET Core Host (BFF)**  
  Hosts the Blazor WebAssembly client and exposes server-side APIs if needed.

- **Blazor WebAssembly Client (PWA)**  
  Includes a Web App Manifest and a custom Service Worker with update detection.

```
Solution
 ├─ Bff (ASP.NET Core host)
 │   └─ Api, PWA host, can act as a BFF (Backend-for-Frontend)
 ├─ Web.Client (Blazor WebAssembly)
 │   └─ UI, PWA assets, Service Worker
 └─ Shared (optional)
     └─ Common contracts / DTOs
```

## Service Worker

A **custom Service Worker** is used instead of the default template-generated one.

- **Development vs Production**
  - `service-worker.js` – development (no caching)
  - `service-worker.published.js` – production (asset caching)

---

## Update Available Feature

The solution includes a **controlled update mechanism**, similar to native applications.

### How it works

1. The Service Worker periodically checks for updates using `registration.update()`
2. When a new version is installed and waiting:
   - The UI is notified via JavaScript → Blazor interop. New version available message is shown
   - An **“Update available”** notification is shown
3. The user explicitly confirms the update via pressing Update button
4. The Service Worker receives `SKIP_WAITING`
5. The page reloads and activates the new version

---

## UI Version Display

The Service Worker exposes a **human-readable UI version** via the `CACHE_VERSION` constant.

### Important

`CACHE_VERSION` **must be updated manually by the developer**.

This value is used only to:
- Display the application version in the UI
- Show the current and new version in the **“Update available”** notification

### Developer responsibility

Before publishing a new release, update this value in  
`service-worker.published.js`:

```js
const CACHE_VERSION = "1.0.0.2";
```

### Recommended practice

Keep `CACHE_VERSION` aligned with:
- Application version
- Release tag
- Version shown to users
