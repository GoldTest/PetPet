<!-- FOR AI AGENTS - Human readability is a side effect, not a goal -->
<!-- Managed by agent: keep sections and order; edit content, not structure -->
<!-- Last updated: 2026-07-21 -->

# AGENTS.md

**Precedence:** the closest `AGENTS.md` to the files you're changing wins. Root holds global defaults only.

## Commands
<!-- AGENTS-GENERATED:START commands -->
| Task | Command | ~Time |
|------|---------|-------|
| Dev server | `npm run dev` | instant |
| Typecheck | `npm run build` (tsc --noEmit + vite) | ~30s |
| Tauri dev | `npm run tauri:dev` | ~60s |
| Tauri build (win portable) | `npm run package:win:portable` | ~5m |
| Android arm64 APK | `npm run package:android:arm64` | ~10m |
| Web deploy | `npm run package:web` | ~2m |
| Preview | `npm run preview` | instant |
<!-- AGENTS-GENERATED:END commands -->

> If commands fail, verify against `package.json` or ask user to update.

## Response Style
- Answer first, elaborate only if needed. No sycophantic openers.
- For yes/no or status questions, lead with the answer.
- Skip preamble. Match response length to task complexity.

## Workflow
1. **Before coding**: Read nearest `AGENTS.md` + check Golden Samples for the area you're touching. For new features, follow HarnSpec SDD lifecycle first (see `.agents/skills/harnspec/SKILL.md`).
2. **After each change**: Run `npm run build` (typecheck + vite build).
3. **Before committing**: Run full build if changes affect >2 files or touch shared code.
4. **Before claiming done**: Show build output as evidence — never say "should work now" or "verified" without pasted output.

## File Map
<!-- AGENTS-GENERATED:START filemap -->
| Path | Purpose |
|------|---------|
| `src/` | Frontend source (React/TSX components, game logic, i18n, CSS) |
| `src/core/` | Pure game logic modules (no UI imports) |
| `src/ui/` | React UI components |
| `src/styles/` | CSS modules (design tokens, base, component styles) |
| `src/i18n/` | i18n engine + locale files (zh-CN, en-US) |
| `src/mods/` | Built-in pet customization packs (manifest.json + assets) |
| `src/platform/` | Platform abstraction (Tauri vs browser save dialog) |
| `src-tauri/` | Tauri Rust backend (minimal shell + plugins) |
| `src-tauri/src/` | Rust source (lib.rs, main.rs) |
| `scripts/` | Build/packaging scripts (PowerShell + Node) |
| `specs/` | HarnSpec SDD specification files |
| `.agents/` | AI agent skill definitions (harnspec, agent-rules) |
| `.github/` | GitHub Actions CI/CD workflows |
| `.gitee/` | Gitee mirror CI/CD workflows |
| `docs/` | Documentation (Chinese + English) |
<!-- AGENTS-GENERATED:END filemap -->

## Golden Samples (follow these patterns)
<!-- AGENTS-GENERATED:START golden-samples -->
| For | Reference | Key patterns |
|-----|-----------|--------------|
| React component | `src/ui/HomePage.tsx` | Hook-based state, platform imports, DialogShell pattern |
| Game logic module | `src/core/petActions.ts` | Pure functions, cross-system effects, typed returns |
| CSS design tokens | `src/styles/tokens.css` | CSS custom properties, dark/light mode variables |
| i18n usage | `src/i18n/index.ts` | `t()` with fallback, `pick()` for plural, `list()` for enumeration |
| Spec definition | `specs/README.md` | SDD lifecycle, status values, dependency linking |
| Mod manifest | `src/mods/mod-mint/manifest.json` | schemaVersion 2, asset overrides, pet sprites |
| Tauri plugin setup | `src-tauri/src/lib.rs` | Plugin init, conditional debug logging |
<!-- AGENTS-GENERATED:END golden-samples -->

## Utilities (check before creating new)
<!-- AGENTS-GENERATED:START utilities -->
| Need | Use | Location |
|------|-----|----------|
| Save/load game data | `saveCodec.ts` + `storage.ts` | `src/core/saveCodec.ts`, `src/core/storage.ts` |
| i18n translate | `t()`, `pick()`, `list()` | `src/i18n/index.ts` |
| Time formatting | `formatTime()`, `formatDuration()` | `src/ui/time.ts` |
| Number formatting | `formatNumber()`, `ordinalSuffix()` | `src/ui/numberFormat.ts` |
| Item effect badges | `renderEffectBadges()` | `src/ui/itemEffectBadges.ts` |
| Platform save dialog | `saveTextFile()` | `src/platform/saveTextFile.ts` |
<!-- AGENTS-GENERATED:END utilities -->

## Heuristics (quick decisions)
<!-- AGENTS-GENERATED:START heuristics -->
| When | Do |
|------|-----|
| New feature requested | Follow HarnSpec SDD: Discover -> Create Spec -> Implement -> Verify |
| Adding UI component | Check existing patterns in `src/ui/`, match DialogShell/FeatureRow style |
| Adding game mechanic | Place pure logic in `src/core/`, not in `src/ui/` |
| Adding i18n string | Add to both `zh-CN.json` and `en-US.json` |
| Packaging build | Follow 打包规则 below for target selection |
| Adding dependency | Ask first — we minimize deps |
| Unsure about pattern | Check Golden Samples above |
<!-- AGENTS-GENERATED:END heuristics -->

## Repository Settings
<!-- AGENTS-GENERATED:START repo-settings -->
- Private: yes
- License: GPL-3.0-or-later
- Default branch: main
<!-- AGENTS-GENERATED:END repo-settings -->

## CI Rules
<!-- AGENTS-GENERATED:START ci-rules -->
- **validate** (ubuntu): `npm run build` — typecheck + vite build, required for all PRs
- **windows** (x64): portable exe on push/tag
- **android** (arm64): APK on push/tag
- **web**: deploy zip, only on full builds
- **linux** (AppImage + deb): ubuntu-22.04, only on full builds
- **macos** (dmg): macos-latest, only on full builds
- **release**: GitHub Release on `v*` tag, requires all expected artifacts
- **pages**: deploy `dist/` to GitHub Pages on push to main or `v*` tags
<!-- AGENTS-GENERATED:END ci-rules -->

## Key Decisions
<!-- AGENTS-GENERATED:START key-decisions -->
- **SDD methodology**: All features go through HarnSpec Spec-Driven Development lifecycle. See `.agents/skills/harnspec/SKILL.md` for full workflow.
- **No test framework**: Project relies on TypeScript strict mode + build-time validation. No Jest/Vitest.
- **No ESLint**: No linter configured. TypeScript strict mode is the only static analysis.
- **Mod system**: Pet customization via zip-based mods with schemaVersion 2 manifests.
- **Tauri 2**: Native desktop/mobile via Tauri v2 + Rust plugins (dialog, fs, opener).
- **i18n after feature**: i18n is bolted on top; new features should add locale strings for both zh-CN and en-US.
- **Idiom selection**: Always check codebase for existing patterns before writing new code — this project evolves fast.
- **AI-first development**: Project explicitly designed for AI-assisted development with HarnSpec SDD and agent rules.
<!-- AGENTS-GENERATED:END key-decisions -->

## Boundaries

### Always Do
- Run `npm run build` before committing
- Add i18n strings for both zh-CN and en-US for new user-facing text
- Use conventional commit format: `type(scope): subject`
- **Show build output as evidence before claiming work is complete**
- For new features: follow HarnSpec SDD lifecycle (discover -> create spec -> implement -> verify)
- Check nearest `AGENTS.md` before editing files in a directory

### Ask First
- Adding new dependencies
- Modifying CI/CD configuration
- Changing public API signatures
- Repo-wide refactoring or rewrites
- Modifying mod manifest schema
- Full release packaging (non-daily builds)

### Never Do
- Commit secrets, credentials, or sensitive data
- Modify `node_modules/`, `src-tauri/gen/`, or `src-tauri/target/`
- Push directly to main branch — open a PR
- Edit installed skill cache paths (`.claude/skills/`, `.agents/skills/` — edit source in `.agents/` instead)
- Overwrite `.harnspec/config.json` without understanding the impact
- Commit `release/` directory contents

## Module Boundaries
<!-- AGENTS-GENERATED:START module-boundaries -->
| Module | Imports Allowed | Imports Prohibited |
|--------|-----------------|-------------------|
| `src/core/` | `src/i18n/`, `src/core/*`, external libs | `src/ui/`, `src/platform/`, React |
| `src/ui/` | `src/core/`, `src/i18n/`, `src/platform/`, `src/styles/`, React | `src/mods/` (use `src/core/mod.ts` bridge) |
| `src/styles/` | Nothing (pure CSS) | JS imports |
| `src/i18n/` | Locale JSON only | Any `src/` module |
| `src/platform/` | Tauri APIs, browser APIs | Game logic |
| `src/mods/` | Nothing (self-contained packs) | N/A |
<!-- AGENTS-GENERATED:END module-boundaries -->

## Codebase State
<!-- AGENTS-GENERATED:START codebase-state -->
- **No test suite** — manual testing only. Verify via `npm run build`.
- **No ESLint** — TypeScript strict mode is the only guard.
- **Rust backend is minimal** — all logic is in TypeScript frontend.
- `src-tauri/gen/android/` is auto-generated — do not edit manually.
- `specs/` directory exists but has no active specs yet (only README).
- Version: 1.4.0 (from package.json, synced with Cargo.toml and tauri.conf.json).
<!-- AGENTS-GENERATED:END codebase-state -->

## Terminology
| Term | Means |
|------|-------|
| PetPet | PetPet — 虚拟桌宠，高度可自定义 (virtual desktop pet with high customizability) |
| HarnSpec | Spec-Driven Development methodology used for feature planning |
| SDD | Spec-Driven Development — lifecycle: Discover -> Create -> Refine -> Implement -> Check |
| Mod | Pet customization pack (zip archive with manifest.json + sprite assets) |
| Partner Schedule | Pet activity board system (task/goal planning) |
| Pomodoro | Built-in Pomodoro timer with pet integration |

## Scoped AGENTS.md (MUST read when working in these directories)
<!-- AGENTS-GENERATED:START scope-index -->
- `src/AGENTS.md` — Frontend TypeScript/React conventions, component patterns, CSS approach
- `src-tauri/AGENTS.md` — Rust/Tauri backend conventions, plugin patterns, Android build notes
<!-- AGENTS-GENERATED:END scope-index -->

> **Agents**: When you read or edit files in a listed directory, you **must** load its AGENTS.md first. It contains directory-specific conventions that override this root file.

## When instructions conflict
The nearest `AGENTS.md` wins. Explicit user prompts override files.

---

## 打包规则

- 当前版本来源以 `package.json` 为准；打包前同步确认 Tauri 和 Cargo 版本字段。
- 日常打包默认只生成简名测试包：
  - Windows x64：`release/pocket<version>.exe`
  - Android arm64：`release/pocket<version>.apk`
- 日常打包不要额外生成 Web、macOS、Linux 产物，除非用户明确要求。
- 全量打包在以下任一条件触发：
  - 当前版本号是 semver 的 `x.y.0`，例如 `1.1.0`、`1.2.0`、`2.0.0`
  - 用户明确要求"全量打包""完整包"，或明确要求包含 macOS、Linux、Web 部署包等产物
- 全量打包产物命名：
  - Windows x64：`release/pocket<version>.exe`
  - Android arm64：`release/pocket<version>.apk`
  - Web 部署包：`release/pocket<version>-web.zip`
  - macOS 图形桌面包：`release/pocket<version>-mac.dmg`
  - Ubuntu/Linux 图形桌面包：优先 `release/pocket<version>-ubuntu.AppImage`，如 CI/runner 支持也保留 `release/pocket<version>-ubuntu.deb`
- Android 测试包默认使用 debug keystore 签名；正式商店签名必须由用户明确要求。
- macOS/Linux 包需要在对应系统或 CI runner 上构建；Windows 本机不要强行生成这些平台产物。
- `release/` 是本地交付产物目录，打包产物不提交到 git。
