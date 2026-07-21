<!-- Managed by agent: keep sections and order; edit content, not structure. Last updated: 2026-07-21 -->

# AGENTS.md — src-tauri (Rust Backend)

## Overview
Minimal Tauri v2 Rust shell. All game logic lives in the TypeScript frontend (`src/`). This directory only initializes Tauri plugins and platform-specific configuration.

## Key Files
- `src/lib.rs` — Plugin initialization, conditional debug logging, app entry point
- `src/main.rs` — Windows subsystem attribute, calls `app_lib::run()`
- `Cargo.toml` — Dependencies: tauri 2.11, plugins (dialog, fs, opener, log)
- `tauri.conf.json` — Build config, window dimensions (420×780), bundle settings
- `tauri.macos.conf.json` — macOS bundle targets (dmg, app)
- `tauri.linux.conf.json` — Linux bundle targets (appimage, deb)
- `capabilities/default.json` — Required permissions (dialog:save, fs:write, opener)

## Plugins Used
| Plugin | Purpose |
|--------|---------|
| `tauri-plugin-dialog` | Native save dialog |
| `tauri-plugin-fs` | Write save files |
| `tauri-plugin-opener` | Open URLs/files |
| `tauri-plugin-log` | Debug logging (dev only) |

## Android
- Auto-generated Gradle project: `gen/android/` — do NOT edit manually
- Build: `npm run package:android:arm64` (debug-signed APK)
- Release builds need user-configured keystore

## Conventions
- Keep Rust minimal — all new logic goes in `src/` (TypeScript)
- Use `plugin_*::init()` pattern for Tauri plugins
- Debug logging behind `cfg!(debug_assertions)` guard
- Version synced manually: update `Cargo.toml` + `tauri.conf.json` when `package.json` changes
