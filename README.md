# PILL

> A lightweight Windows dynamic island for media, telemetry, focus sessions, and contextual desktop information.

<p align="center">
  <img src="PILL/archipelago/src-tauri/icons/icon.png" alt="PILL" width="96">
</p>

<p align="center">
  <strong>PILL</strong> brings a compact, always-available information layer to the Windows desktop — designed to stay out of the way until you need it.
</p>

<p align="center">
  <a href="https://github.com/AmoghxAnubis/PILL/releases">Releases</a>
  ·
  <a href="https://github.com/AmoghxAnubis/PILL/issues">Issues</a>
  ·
  <a href="https://amoghxanubis.github.io/PILL/">Website</a>
</p>

---

## ✦ What is PILL?

PILL is a Windows desktop overlay built around the idea of turning the small amount of space you normally ignore at the top of your screen into a useful contextual surface.

Instead of opening another application to check what is happening, PILL is designed to surface information where you are already working.

The project currently consists of two desktop applications:

- **PILL** — the lightweight dynamic-island-style overlay.
- **PILL Control** — the configuration workspace used to manage PILL's widgets, behavior, appearance, and system preferences.

PILL is built with **Tauri 2, React, TypeScript, and Rust**, with a Windows-first desktop experience.

---

## ✨ Highlights

### 🎵 Media
Keep media information and controls close at hand without switching away from the application you're using.

### 📊 System telemetry
Surface contextual system information through the compact overlay.

### 🎯 Focus sessions
Use the island as a lightweight focus surface while working.

### 🧩 Contextual information
PILL is designed as a surface that can adapt to what is happening on your desktop rather than behaving like another traditional application window.

### ⚙️ PILL Control
A dedicated control center provides a larger workspace for configuring PILL.

### 🪟 Native Windows desktop
PILL uses Tauri and native desktop integration rather than running as a browser tab.

---

## 🖥️ Experience

The main PILL window is intentionally tiny and unobtrusive.

Its current Tauri window configuration uses:

- Transparent window
- Always-on-top behavior
- No window decorations
- No taskbar entry
- Fixed compact dimensions
- Non-resizable overlay
- Native Windows application packaging

The goal is simple:

> **Information when you need it. Nothing when you don't.**

---

## 🧠 Architecture

PILL is split into a lightweight overlay application and a dedicated configuration application.

```text
PILL
│
├── PILL/archipelago
│   │
│   ├── React + TypeScript frontend
│   ├── Tauri 2 desktop shell
│   ├── Rust backend
│   └── Windows overlay
│
├── PILL/pill-control
│   │
│   ├── React + TypeScript frontend
│   └── Tauri 2 desktop control center
│
├── PILL/website
│   └── Project website
│
└── .github/workflows
    ├── ci.yml
    ├── release.yml
    └── deploy-site.yml
```

### Main application

The `archipelago` package contains the PILL overlay.

Its current stack includes:

- React 19
- TypeScript
- Vite
- Tauri 2
- Rust
- Framer Motion
- Zustand
- Vitest

### PILL Control

The `pill-control` package contains the configuration workspace.

Its current stack includes:

- React
- TypeScript
- Vite
- Tauri 2
- ESLint

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Desktop framework | Tauri 2 |
| Frontend | React |
| Language | TypeScript |
| Native backend | Rust |
| Bundler | Vite |
| Animation | Framer Motion |
| State management | Zustand |
| Frontend testing | Vitest |
| Windows installer | NSIS |
| CI | GitHub Actions |
| Website | GitHub Pages |

---

## 🚀 Installation

### Windows installer

Download the latest Windows installer from the project's Releases page.

The release currently uses a Windows NSIS installer and packages:

- PILL
- PILL Control
- Windows desktop integration

### WinGet

PILL is also being prepared for distribution through the Windows Package Manager Community Repository.

The package identifier is:

```text
PILL.PILL
```

Once the package is available in the public WinGet catalog, installation will be:

```powershell
winget install PILL.PILL
```

> **Status:** The initial `PILL.PILL` 0.1.0 manifest has been submitted to the Windows Package Manager Community Repository and has passed the automated validation pipeline. Community moderator review is still pending.

---

## 💻 Development

### Prerequisites

You will need:

- Windows
- Node.js
- Rust
- Tauri 2 prerequisites
- Git

### Clone

```powershell
git clone https://github.com/AmoghxAnubis/PILL.git
cd PILL
```

### Run PILL

```powershell
cd PILL/archipelago
npm install
npm run dev
```

### Run PILL Control

In another terminal:

```powershell
cd PILL/pill-control
npm install
npm run dev
```

### Build the PILL frontend

```powershell
cd PILL/archipelago
npm run build
```

### Test PILL

```powershell
cd PILL/archipelago
npm test -- --run
```

### Test the Rust backend

```powershell
cd PILL/archipelago
cargo test --manifest-path src-tauri/Cargo.toml
```

### Lint PILL Control

```powershell
cd PILL/pill-control
npm run lint
```

### Build PILL Control

```powershell
cd PILL/pill-control
npm run build
```

---

## 📦 Release Pipeline

PILL uses GitHub Actions for continuous integration, releases, and website deployment.

### CI

Every push to `main` and pull request targeting `main` runs the validation workflow.

The CI pipeline currently checks:

- PILL dependency installation
- PILL frontend tests
- PILL frontend build
- PILL Control dependency installation
- PILL Control linting
- PILL Control release build
- Rust tests

### Releases

Pushing a version tag matching:

```text
v*
```

triggers the release workflow.

The workflow:

1. Installs frontend dependencies.
2. Installs Rust.
3. Builds PILL Control.
4. Builds the PILL frontend.
5. Verifies that the Git tag matches the application version.
6. Builds the Windows NSIS installer.
7. Creates a GitHub release draft.

For example:

```powershell
git tag v0.1.0
git push origin v0.1.0
```

The release workflow expects the application version in `PILL/archipelago/src-tauri/tauri.conf.json` to match the Git tag.

---

## 🌐 Website

The PILL website lives in:

```text
PILL/website
```

Changes to the website on `main` automatically trigger the GitHub Pages deployment workflow.

The website is deployed through GitHub Pages.

---

## 🗂️ Repository Structure

```text
PILL/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── release.yml
│       └── deploy-site.yml
│
├── PILL/
│   │
│   ├── archipelago/
│   │   ├── src/
│   │   ├── src-tauri/
│   │   ├── scripts/
│   │   ├── package.json
│   │   └── vite.config.*
│   │
│   ├── pill-control/
│   │   ├── src/
│   │   ├── src-tauri/
│   │   ├── package.json
│   │   └── vite.config.*
│   │
│   └── website/
│       ├── index.html
│       ├── script.js
│       └── styles.css
│
├── .gitignore
└── LICENSE
```

---

## 🔐 Privacy & Design Philosophy

PILL is designed around a simple desktop principle:

**The interface should be useful without becoming another thing you have to manage.**

The compact overlay is intended to keep contextual information close to the user while the separate PILL Control application provides a dedicated space for configuration.

The project is also open source, allowing the implementation to be inspected, modified, and extended.

---

## 🧪 Project Status

PILL is under active development.

### Current

- [x] Windows desktop application
- [x] PILL Control application
- [x] Tauri-based native packaging
- [x] Windows NSIS installer
- [x] GitHub Actions CI
- [x] Automated release workflow
- [x] GitHub Pages website
- [x] WinGet manifest created
- [x] WinGet manifest validation
- [x] Local WinGet installation test
- [x] WinGet Community Repository submission
- [x] Automated WinGet validation
- [ ] WinGet moderator approval

### Future

The architecture is intended to provide room for additional widgets, richer desktop context, and deeper Windows integration as the project evolves.

---

## 🤝 Contributing

Contributions, ideas, bug reports, and feature requests are welcome.

Before opening a pull request:

1. Create a focused branch.
2. Keep changes scoped to the feature or fix.
3. Run the relevant tests and builds.
4. Make sure the existing CI workflow passes.
5. Explain the change clearly in the pull request.

For bugs and feature requests, use the project's GitHub Issues.

---

## 📄 License

PILL is released under the **MIT License**.

Copyright © 2026 Amogh Sharma.

See [`LICENSE`](LICENSE) for the complete license text.

---

## 👤 Author

**Amogh Sharma**

PILL is an independent open-source Windows desktop project.

---

<p align="center">
  <sub>Built for a quieter, more contextual Windows desktop.</sub>
</p>
