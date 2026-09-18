import { supabase } from '@/lib/supabase';
import type { Ride, UserRole } from '@/types';
import { RIDE_COST } from '@/data/shuttleData';

export async function ensureStudentProfile(role: UserRole = 'student') {
  const { error } = await supabase.rpc('ensure_student_profile', { p_role: role });
  if (error) console.error('Failed to ensure student profile:', error);
}

export async function getStudentCredits(): Promise<number> {
  const { data, error } = await supabase
    .from('students')
    .select('credits, role')
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch credits:', error);
    return 0;
  }
  return data?.credits ?? 0;
}

export async function getStudentRole(): Promise<UserRole> {
  const { data, error } = await supabase
    .from('students')
    .select('role')
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch role:', error);
    return 'student';
  }
  return (data?.role as UserRole) ?? 'student';
}

export async function deductCreditsForRide(amount: number = RIDE_COST): Promise<{ success: boolean; newBalance: number; error: string | null }> {
  const { data, error } = await supabase.rpc('deduct_credits', { p_amount: amount });

  if (error) {
    return { success: false, newBalance: 0, error: error.message };
  }

  return { success: true, newBalance: data as number, error: null };
}

export async function recordRide(ride: {
  shuttle_id: string;
  shuttle_name: string;
  origin: string;
  destination: string;
  credits_spent: number;
}): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase.from('rides').insert({
    shuttle_id: ride.shuttle_id,
    shuttle_name: ride.shuttle_name,
    origin: ride.origin,
    destination: ride.destination,
    credits_spent: ride.credits_spent,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export async function getRideHistory(): Promise<Ride[]> {
  const { data, error } = await supabase
    .from('rides')
    .select('*')
    .order('departed_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Failed to fetch ride history:', error);
    return [];
  }

  return (data as Ride[]) ?? [];
}
