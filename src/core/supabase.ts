import { createClient, type User } from '@supabase/supabase-js';
import type { PetState } from './pet';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = !!supabase;

export type AuthUser = User;

export interface CloudActiveModInfo {
  type: 'builtin' | 'custom';
  id: string;
  name: string;
  version: string;
}

export interface CloudSaveData {
  pet: PetState;
  activeMod: CloudActiveModInfo | null;
  updatedAt: string;
  /** 登录会话 ID，用于多设备互斥：新设备登录后，旧设备无法再同步 */
  sessionId: string;
}

export const getCurrentSession = async () => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
};

export const signUp = async (email: string, password: string) => {
  if (!supabase) return { user: null, error: new Error('Supabase not configured') };
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { user: data.user, error };
};

export const signIn = async (email: string, password: string) => {
  if (!supabase) return { user: null, error: new Error('Supabase not configured') };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data.user, error };
};

export const signOut = async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

const getCloudUserId = (rawUserId: string): string => {
  const env = import.meta.env.VITE_APP_ENV ?? (import.meta.env.DEV ? 'dev' : 'production');
  if (env === 'production') return rawUserId;
  return `${env}:${rawUserId}`;
};

export const saveCloudSave = async (userId: string, data: CloudSaveData) => {
  if (!supabase) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const { error } = await supabase.rpc('upsert_pet_save', {
    p_user_id: getCloudUserId(userId),
    p_save_data: data,
    p_updated_at: data.updatedAt,
    p_session_id: data.sessionId,
  });
  if (error) throw error;
};

export const loadCloudSave = async (userId: string): Promise<CloudSaveData | null> => {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data, error } = await supabase.rpc('get_pet_save', { p_user_id: getCloudUserId(userId) });
  if (error || !data) return null;
  return data as unknown as CloudSaveData;
};

export const diagnoseCloudSave = async () => {
  if (!supabase) {
    console.log('=== PetPet 云存档诊断 ===');
    console.log('Supabase 未配置 (VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY 未设置)');
    console.log('=== 诊断结束 ===');
    return;
  }
  const { data: { session } } = await supabase.auth.getSession();
  console.log('=== PetPet 云存档诊断 ===');
  console.log('session 存在:', !!session);
  if (!session) {
    console.log('说明: 无 session，请先登录');
    return;
  }
  const cloudUserId = getCloudUserId(session.user.id);
  console.log('user_id:', session.user.id);
  console.log('cloud_user_id:', cloudUserId);

  const { data, error } = await supabase.rpc('get_pet_save', { p_user_id: cloudUserId });
  console.log('RPC get_pet_save 结果:', error ? `失败: ${error.message}` : '成功', data);
  if (data) {
    const cloud = data as unknown as CloudSaveData;
    console.log('云端存档宠物名:', cloud.pet?.name);
    console.log('云端存档模组:', cloud.activeMod ?? '无');
    console.log('云端存档时间:', cloud.updatedAt);
  }
  if (error) {
    console.log('诊断: RPC 也失败，请在 Supabase SQL Editor 检查 upsert_pet_save / get_pet_save 函数是否存在');
  } else {
    console.log('诊断: RPC 正常，云存档系统可工作');
  }
  console.log('=== 诊断结束 ===');
};