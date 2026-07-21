<!-- Managed by agent: keep sections and order; edit content, not structure. Last updated: 2026-07-21 -->

# AGENTS.md — src (Frontend)

## Overview
React 18 + TypeScript frontend: game logic, UI components, i18n, styles, and mod system.

## Key Files

### `src/core/` — Game logic (pure TS, no React)
`petTypes.ts`, `petState.ts`, `petStats.ts`, `petActions.ts`, `petEvents.ts`, `petLifecycle.ts`, `pomodoro.ts`, `garden.ts`, `items.ts`, `achievements.ts`, `dailyWishes.ts`, `dateRewards.ts`, `boostCards.ts`, `partnerSchedule.ts`, `partnerScheduleEffects.ts`, `mod.ts`, `modStorage.ts`, `saveCodec.ts`, `storage.ts`, `weather.ts`, `season.ts`, `audio.ts`, `yearlyStats.ts`, `utils.ts`

### `src/ui/` — React components
- `App.tsx` — Root component with navigation state
- `HomePage.tsx` — Main pet interaction screen
- `PetDisplay.tsx` — Pet character rendering
- `StatusBar.tsx` — Health/hunger/mood/etc. display
- `ActionDock.tsx` — Quick action buttons
- `DialogShell.tsx`, `ConfirmDialog.tsx` — Modal infrastructure
- `GardenPage.tsx`, `AchievementsPage.tsx`, `PartnerSchedulePage.tsx` — Feature pages
- `SettingsModal.tsx`, `ShopModal.tsx`, `InventoryModal.tsx` — Modals
- `BoostCardModal.tsx`, `YearReviewModal.tsx`, `PomodoroOverlay.tsx`, `RolePicker.tsx`
- `PartnerScheduleDock.tsx` — Schedule quick access

### `src/styles/` — CSS modules
`tokens.css`, `base.css`, `home.css`, `dialogs.css`, `garden.css`, `achievements.css`, `partner-schedule.css`, `role-picker.css`

### `src/i18n/` — Internationalization
`index.ts` (engine), `zh-CN.json` (Chinese), `en-US.json` (English)

### `src/mods/` — Built-in pet packs
`mod-mint/` (manifest + sprites), `mod-doro/` (manifest + sprites)

### `src/platform/` — Platform abstraction
`saveTextFile.ts` (Tauri dialog or browser download)

## Module Boundaries (enforced by convention)
| Module | Imports Allowed | Prohibited |
|--------|----------------|------------|
| `core/` | `i18n/`, `core/*`, external libs | `ui/`, `platform/`, React |
| `ui/` | `core/`, `i18n/`, `platform/`, `styles/`, React | Direct `mods/` access (use `core/mod.ts`) |
| `i18n/` | Locale JSON only | Any `src/` module |
| `platform/` | Tauri/browser APIs | Game logic |

## Conventions
- **Components**: PascalCase files, one component per file
- **Pure logic**: camelCase, placed in `core/`
- **CSS**: CSS custom properties in `tokens.css`, module files per page
- **i18n**: Add strings to both `zh-CN.json` and `en-US.json`
- **State**: Hook-based (see `usePetSession`, `useGardenController` in `ui/app/`)
