---
status: complete
created: 2026-07-28
priority: high
tags:
- auth
- cloud-sync
- supabase
- backend
created_at: 2026-07-28T05:43:43.004027400Z
updated_at: 2026-07-28T10:05:31.201593700Z
completed_at: 2026-07-28T10:05:31.201593700Z
transitions:
- status: in-progress
  at: 2026-07-28T07:59:39.092166800Z
- status: complete
  at: 2026-07-28T10:05:31.201593700Z
---

# Supabase Auth & Cloud Sync

## Overview

PetPet 当前存档完全存储在 `localStorage`，无后端支持。本 spec 引入 Supabase BaaS，提供邮箱认证登录 + 云端存档同步能力，以最小维护成本实现账号系统与多端同步。

## Requirements

- [x] 注册 Supabase 项目并获取 anon key 与 project URL
- [x] 安装 `@supabase/supabase-js` SDK
- [x] 初始化 Supabase 客户端模块 `src/core/supabase.ts`
- [x] 创建用户表（auth.users 内置）+ 存档表 `pet_saves`（userId + saveData + updatedAt）
- [x] 实现登录/注册页面（邮箱密码）
- [x] 实现登出功能
- [x] 将 `storage.ts` 的 `localStorage` 读写改为云端存档读写（保留 localStorage 作为离线降级）
- [x] 配置 PostgreSQL RLS 策略：用户只能读写自己的存档
- [x] 实现存档自动同步（保存时同步上传云端）
- [x] 实现多端冲突策略：以最新 updatedAt 为准
- [ ] 适配 Tauri 环境的 Supabase 调用（CSP 配置）

## Non-Goals

- 第三方 OAuth 登录（初期仅邮箱密码，后续可加）
- 实时同步（仅保存时上传 + 启动时拉取）
- 服务端业务逻辑（全 RLS + 客户端直连）
- 用户管理后台

## Technical Notes

- Supabase 免费额度：50,000 MAU / 500MB DB / 2GB 带宽，对个人项目几乎永久免费
- 使用 Supabase JS SDK v2 的 `@supabase/supabase-js`
- 存档表结构：`pet_saves(user_id uuid PK, save_data jsonb, updated_at timestamptz)`
- RLS 策略：`USING (auth.uid() = user_id)` + `WITH CHECK (auth.uid() = user_id)`
- `storage.ts` 改为尝试云端写入，离线时 fallback 到 localStorage
- 密钥管理：anon key 通过 `VITE_SUPABASE_ANON_KEY` 环境变量注入

## Acceptance Criteria

- 用户可注册/登录/登出
- 登录后存档自动同步到云端
- 另一设备登录同一账号可拉取最新存档
- 离线时仍可使用本地存档
- 构建通过 (`npm run build`)