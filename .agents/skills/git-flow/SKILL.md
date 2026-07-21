---
name: git-flow
description: >-
  Git flow operations for PetPet — release and push. Use when the user mentions
  "发版", "release", "发布版本", "推送", "push", "提交", "commit", "打tag",
  "版本号", or any git tagging/versioning/publishing workflow in Chinese or English.
---

# Git Flow Skill

Two main operations: **release** (发版) and **push** (推送).

## 1. Release (发版)

Trigger when user mentions 发版, release, 发布版本, or anything involving version bumping.

Steps:
1. **检查本地代码**: Run `npm run build` (typecheck + vite build) until zero errors.
2. **推送当前代码**: `git push` (ensure all changes including fixes are pushed).
3. **更新版本号**: 根据改动范围决定版本更新策略（见版本规则），同步到 `package.json`、`src-tauri/Cargo.toml` 和 `src-tauri/tauri.conf.json`。
4. **提交版本更新**: `git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json` → `git commit -m "chore(release): bump to x.y.z"`.
5. **创建并推送 tag**: `git tag vx.y.z && git push origin vx.y.z`.
6. Tag 推送会触发 CI release workflow，构建产物并创建 GitHub Release。
7. GitHub Pages 也自动部署。

### 版本规则

格式 `major.minor.patch`，每位上限 19，超出则进位：

| 改动范围 | 更新位 | 示例 |
|---------|--------|------|
| 默认 / 小修改 | patch（最后一位 +1） | `1.4.0` → `1.4.1` |
| 中等 / 大型修改 | minor（中间一位 +1，patch 归零） | `1.4.1` → `1.5.0` |

**进位规则**：
- patch 超出 19 时归零并进位到 minor：`1.4.19` → `1.5.0`
- minor 超出 19 时归零并进位到 major：`1.19.0` → `2.0.0`
- major 无上限

**示例**：
- `1.4.0` + 小修改 → `1.4.1`
- `1.4.19` + 小修改 → `1.5.0`（patch 溢出进位）
- `1.4.1` + 大修改 → `1.5.0`
- `1.19.5` + 大修改 → `2.0.0`（minor 溢出进位）

## 2. Push (推送)

Trigger when user says 推送, push, 提交, or commit-and-push (no version change).

Steps:
1. **检查本地代码**: Run `npm run build` until zero errors.
2. **推送远端**: `git push`.
3. **不要**更新版本号，不要创建 tag。

## Notes

- 版本号来源以 `package.json` 为准；同步写入 `src-tauri/Cargo.toml` 和 `src-tauri/tauri.conf.json`。
- CI release 由 `v*` tag 触发，见 `.github/workflows/release.yml`。
- Pages 部署由 push to main 或 `v*` tag 触发，见 `.github/workflows/pages.yml`。
