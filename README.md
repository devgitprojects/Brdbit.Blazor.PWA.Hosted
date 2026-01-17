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
  
- **Shared library**  
	Contains shared contracts, DTOs, and common code used by both client and server.
	
- **VSIX project**  
  Contains everything required to build a Visual Studio extension (VSIX) that installs this solution as a reusable multi-project template.

```
Solution
 ├─ Bff (ASP.NET Core host)
 │   └─ API, PWA host, BFF responsibilities
 ├─ Web.Client (Blazor WebAssembly)
 │   └─ UI, PWA assets, Service Worker
 ├─ Shared
 │   └─ Common contracts / DTOs
 └─ Vsix
     └─ Visual Studio template packaging
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

### Visual Studio Template (VSIX)

This solution includes a Visual Studio Solution Template packaged as a VSIX extension.

The VSIX allows developers to create the same multi-project Blazor PWA Hosted solution directly from Visual Studio using File → New → Project, without manually copying or configuring projects.

## What the template creates

When a new project is created from this template, Visual Studio generates:

```
<YourSolutionName>
 ├─ <YourSolutionName>.Bff
 ├─ <YourSolutionName>.Web.Client
 └─ <YourSolutionName>.Shared
```

## Install VSIX from source (for contributors)

	1. Open the VSIX project in Visual Studio
	2. Build the solution
	3. Locate the generated .vsix file in the output folder
	4. Double-click it
	5. Follow the Visual Studio Extension Installer
	6. Restart Visual Studio
