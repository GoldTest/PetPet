import { createClient, type User } from '@supabase/supabase-js';
import type { PetState } from './pet';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = !!supabase;

export type AuthUser = User;

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

export const saveCloudSave = async (userId: string, pet: PetState) => {
  if (!supabase) return;
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
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data, error } = await supabase.rpc('get_pet_save', { p_user_id: userId });
  if (error || !data) return null;
  return data as unknown as PetState;
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
  console.log('user_id:', session.user.id);

  const { data, error } = await supabase.rpc('get_pet_save', { p_user_id: session.user.id });
  console.log('RPC get_pet_save 结果:', error ? `失败: ${error.message}` : '成功', data);
  if (error) {
    console.log('诊断: RPC 也失败，请在 Supabase SQL Editor 检查 upsert_pet_save / get_pet_save 函数是否存在');
  } else {
    console.log('诊断: RPC 正常，云存档系统可工作');
  }
  console.log('=== 诊断结束 ===');
};