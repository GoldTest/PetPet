-- PetPet 云存档 session 锁迁移
-- 在 Supabase SQL Editor 中执行
-- 作用：upsert_pet_save 增加 session_id 校验，防止旧版本覆盖数据

-- 1. 重写 upsert_pet_save RPC，增加 p_session_id 参数和校验
CREATE OR REPLACE FUNCTION upsert_pet_save(
  p_user_id TEXT,
  p_save_data JSONB,
  p_updated_at TEXT,
  p_session_id TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  existing_session_id TEXT;
BEGIN
  -- 旧版本没有传 session_id → 拒绝，防止旧版本覆盖新数据
  IF p_session_id IS NULL OR p_session_id = '' THEN
    RAISE EXCEPTION 'SESSION_ID_REQUIRED: old version rejected';
  END IF;

  -- 读取已有记录的 session_id（user_id 可能是 uuid 类型，转 text 比较）
  SELECT p_save_data->>'sessionId' INTO existing_session_id
  FROM pet_saves
  WHERE user_id::text = p_user_id;

  -- 已有记录且 session_id 不匹配 → 被其他设备顶替
  IF existing_session_id IS NOT NULL AND existing_session_id != '' AND existing_session_id != p_session_id THEN
    RAISE EXCEPTION 'SESSION_EXPIRED: session taken over by another device';
  END IF;

  -- 通过校验，全量覆盖
  INSERT INTO pet_saves (user_id, save_data, updated_at)
  VALUES (p_user_id, p_save_data, p_updated_at)
  ON CONFLICT (user_id)
  DO UPDATE SET save_data = p_save_data, updated_at = p_updated_at;
END;
$$;