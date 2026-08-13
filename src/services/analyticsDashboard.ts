import { supabase } from '../lib/supabase';

export type RealtimeAnalytics = {
  window: 'last_30_minutes';
  activeUsers: number;
  eventCount: number;
  pageViews: number;
  topEvents: Array<{ name: string; count: number }>;
  topPages: Array<{ name: string; count: number }>;
  updatedAt: string;
};

export type AnalyticsDashboardError = Error & { code?: string };

export async function getRealtimeAnalytics(): Promise<RealtimeAnalytics> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('site_analytics_snapshot');
  if (error) {
    const nextError = new Error(error.message) as AnalyticsDashboardError;
    nextError.code = error.code === 'PGRST202' || error.code === '42883' ? 'analytics_not_configured' : error.code;
    throw nextError;
  }
  if (!data) throw new Error('Supabase did not return analytics data.');
  return data as RealtimeAnalytics;
}
