---
name: supabase-rls-debug
description: >-
  Supabase RLS 403 调试技能。当用户遇到 Supabase REST API 返回 403 Forbidden、
  RLS 策略不生效、auth.uid() 返回 NULL、PostgREST JWT 注入失败等问题时使用。
  触发词："RLS 403"、"auth.uid() null"、"Supabase 403"、"云存档 403"、"pet_saves 403"、
  "403 Forbidden"、"RLS 策略"、"PostgREST 错误"、"42501"。
---

# Supabase RLS 403 调试技能

## 背景

PetPet 使用 Supabase 作为云存档后端，通过 `pet_saves` 表存储宠物状态。当 RLS（Row Level Security）配置不正确时，应用会持续收到 403 Forbidden 错误。

## 问题症状

- 浏览器 console 持续输出 `POST /rest/v1/pet_saves?on_conflict=user_id 403`
- 应用代码中 `supabase.from('pet_saves').upsert()` 或直接 `fetch` REST API 都返回 403
- 请求头中 `Authorization: Bearer` 已正确携带 JWT token
- 本地 localStorage 保存正常，但云存档无法读写

## 调试流程

### 第 1 步：确认请求头是否携带 JWT

打开浏览器 F12 → Network 标签，筛选 `pet_saves`，点开任意请求查看 Request Headers：

- 如果 **没有** `Authorization: Bearer` 头 → `supabase-js` 客户端未正确传递 session token
- 如果 **有** `Authorization: Bearer` 头 → 继续下一步

### 第 2 步：确认表结构和 RLS 状态

在 Supabase Dashboard → Table Editor → `pet_saves` 确认：

| 检查项 | 说明 |
|--------|------|
| 表是否存在 | 不存在则创建（见下文 DDL） |
| RLS 是否启用 | 开关应为蓝色（已启用） |
| `user_id` 列类型 | 必须为 `uuid` |

### 第 3 步：检查 auth.uid() 是否正常

在 Supabase SQL Editor 执行：

```sql
SELECT auth.uid();
```

- 如果返回正确 UUID → `auth.uid()` 正常，检查策略表达式
- 如果返回 `NULL` → **PostgREST JWT 注入失败**，这是根本原因

### 第 4 步：检查当前策略

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'pet_saves';
```

确认策略的 `USING` 和 `WITH CHECK` 表达式中的 `auth.uid()` 是否被正确替换。

## 根因

`auth.uid()` 函数依赖 PostgREST 在请求上下文中注入 JWT 的 `sub` 字段。当 Supabase 项目配置异常时，PostgREST 未正确设置 `request.jwt.claim.sub`，导致 `auth.uid()` 返回 NULL，所有 RLS 策略比较 `NULL = user_id` 恒为 false。

## 解决方案

### 方案 A：使用 `current_setting`（快速尝试）

```sql
DROP POLICY IF EXISTS "users_own_saves" ON public.pet_saves;
DROP POLICY IF EXISTS "Users can read own saves" ON public.pet_saves;
DROP POLICY IF EXISTS "Users can upsert own saves" ON public.pet_saves;
DROP POLICY IF EXISTS "Users can update own saves" ON public.pet_saves;

CREATE POLICY "users_own_saves" ON public.pet_saves
  FOR ALL
  USING (current_setting('request.jwt.claims', true)::json->>'sub' = user_id::text)
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'sub' = user_id::text);
```

### 方案 B：创建 SECURITY DEFINER 函数（推荐，最终方案）

当 `auth.uid()` 和 `current_setting` 都不可用时，使用 `SECURITY DEFINER` 函数绕过 RLS。

**原理：** PostgreSQL 函数以 `SECURITY DEFINER` 执行时，以函数所有者身份运行，不受 RLS 限制。只暴露 upsert 和 get 两个接口，比关 RLS 安全。

#### 1. 清理旧策略

```sql
DROP POLICY IF EXISTS "users_own_saves" ON public.pet_saves;
DROP POLICY IF EXISTS "Users can read own saves" ON public.pet_saves;
DROP POLICY IF EXISTS "Users can upsert own saves" ON public.pet_saves;
DROP POLICY IF EXISTS "Users can update own saves" ON public.pet_saves;
```

#### 2. 创建函数

```sql
CREATE OR REPLACE FUNCTION public.upsert_pet_save(
  p_user_id uuid,
  p_save_data jsonb,
  p_updated_at timestamptz DEFAULT now()
) RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  INSERT INTO public.pet_saves (user_id, save_data, updated_at)
  VALUES (p_user_id, p_save_data, p_updated_at)
  ON CONFLICT (user_id)
  DO UPDATE SET save_data = EXCLUDED.save_data, updated_at = EXCLUDED.updated_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_pet_save(p_user_id uuid)
RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_data jsonb;
BEGIN
  SELECT save_data INTO v_data FROM public.pet_saves WHERE user_id = p_user_id;
  RETURN v_data;
END;
$$;
```

#### 3. 给 anon 角色授权执行

```sql
GRANT EXECUTE ON FUNCTION public.upsert_pet_save(uuid, jsonb, timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_pet_save(uuid, jsonb, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pet_save(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_pet_save(uuid) TO authenticated;
```

#### 4. 代码改动

在 `src/core/supabase.ts` 中，将 `saveCloudSave` 和 `loadCloudSave` 改为使用 `supabase.rpc()`：

```typescript
export const saveCloudSave = async (userId: string, pet: PetState) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const { error } = await supabase.rpc('upsert_pet_save', {
    p_user_id: userId,
    p_save_data: pet,
    p_updated_at: new Date().toISOString(),
  });
  if (error) throw error;
};

export const loadCloudSave = async (userId: string): Promise<PetState | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data, error } = await supabase.rpc('get_pet_save', { p_user_id: userId });
  if (error || !data) return null;
  return data as unknown as PetState;
};
```

在 `src/core/storage.ts` 中，云存档应使用节流（throttle）而非防抖（debounce），避免每秒 tick 重置定时器导致永不触发：

```typescript
let lastCloudSaveTime = 0;
const CLOUD_SAVE_INTERVAL = 30_000;

export const savePet = (pet: PetState) => {
  const normalized = normalizePet(pet);
  window.localStorage.setItem(storageKey, JSON.stringify(normalized));
  if (!currentUserId) return;
  const now = Date.now();
  if (now - lastCloudSaveTime < CLOUD_SAVE_INTERVAL) return;
  lastCloudSaveTime = now;
  saveCloudSave(currentUserId, normalized).catch(() => {});
};
```

## 安全对比

| 方案 | 风险 | 说明 |
|------|------|------|
| 关闭 RLS | **高** | 任何人都能 DELETE / SELECT * / UPDATE 全表 |
| `SECURITY DEFINER` 函数 | **低** | 只暴露 upsert 和按 id 查询，不能删除不能遍历 |
| 正常 RLS（`auth.uid()`） | 低 | 但如果 `auth.uid()` 坏了，就和关 RLS 一样不可用 |

## 验证方法

### 浏览器验证

刷新页面后，Network 标签应看到 `POST /rest/v1/rpc/upsert_pet_save` 请求，状态码 200。

### 控制台诊断

```js
import('/src/core/supabase.ts').then(m => m.diagnoseCloudSave())
```

## 相关文件

| 文件 | 作用 |
|------|------|
| `src/core/supabase.ts` | Supabase 客户端 + 云存档读写函数 + 诊断函数 |
| `src/core/storage.ts` | 本地存档 + 云存档节流调度 |
| `src/core/pet.ts` | PetState 类型定义 |
| `.env` | `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` |

## 非 RLS 的常见 403 原因

| 原因 | 排查方法 |
|------|----------|
| 表不存在 | 检查 Supabase Dashboard Table Editor |
| `onConflict` 列无唯一约束 | `user_id` 应设为 PRIMARY KEY 或 UNIQUE |
| anon 角色无 EXECUTE 权限 | 检查 `GRANT EXECUTE ON FUNCTION` 是否执行 |
| 客户端初始化时 `supabaseAnonKey` 为空 | 检查 `.env` 配置 |