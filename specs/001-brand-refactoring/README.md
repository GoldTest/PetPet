---
status: complete
created: 2026-07-21
priority: high
tags:
- branding
- refactoring
- rename
created_at: 2026-07-21T13:17:59.158622500Z
updated_at: 2026-07-21T13:23:44.633759800Z
completed_at: 2026-07-21T13:23:44.633759800Z
transitions:
- status: in-progress
  at: 2026-07-21T13:23:18.513528500Z
- status: complete
  at: 2026-07-21T13:23:44.633759800Z
---

# Overview

Rebrand the entire project from **PocPet (口袋宠物)** to **PetPet (小小宠物)**. The project is defined as: *虚拟桌宠，高度可自定义* (virtual desktop pet, highly customizable).

## Capitalization Rules

| Form | When to use |
|------|-------------|
| \PetPet\ | Title case — UI text, headings, display names, brand references where uppercase fits |
| \petpet\ | Lowercase — code identifiers, file names, URLs, package names, paths, slugs, general references |
| \Petpet\ or \petPet\ | **Never** — these forms are forbidden |

## Requirements

- [x] Replace all \PocPet\ occurrences in TypeScript/React source files (\src/\) with \PetPet\ or \petpet\ per capitalization rules
- [x] Replace all \PocPet\ occurrences in CSS files (\src/styles/\) — none found
- [x] Replace all \PocPet\ occurrences in Rust files (\src-tauri/src/\) — none found (config files handled separately)
- [x] Replace all \PocPet\ occurrences in i18n locale files (\src/i18n/\) — none found
- [x] Replace all \PocPet\ occurrences in configuration files (\package.json\, \Cargo.toml\, \tauri.conf.json\, etc.)
- [x] Replace all \PocPet\ occurrences in mod manifests (\src/mods/\) — none found
- [x] Replace all \PocPet\ occurrences in documentation and spec files (\docs/\, \specs/\)
- [x] Replace all \PocPet\ occurrences in CI/CD workflow files (\.github/\, \.gitee/\)
- [x] Replace all \PocPet\ occurrences in build scripts (\scripts/\) — none found
- [x] Update AGENTS.md to reflect new brand name (terminology, file map, key decisions)
- [x] Update README.md with new brand identity

## Non-Goals

- Not changing any functional logic, data structures, or game mechanics
- Not modifying external dependencies or third-party services
- Not restructuring file layout — only rename contents

## Acceptance Criteria

- \
pm run build\ passes with zero errors
- No remaining occurrences of \PocPet\ anywhere in the repository (case-sensitive)
- No occurrences of \Petpet\ or \petPet\ anywhere in the repository
- \PetPet\ used correctly in user-facing/display contexts
- \petpet\ used correctly in code identifiers and file references
- Repository builds and runs correctly after all changes