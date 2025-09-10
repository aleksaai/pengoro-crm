import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserPreferences {
  pipelineDashboard_selectedAgent?: string;
  leadsPipeline_selectedAgent?: string;
  [key: string]: any;
}

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const preferencesRef = useRef<UserPreferences>({});

  useEffect(() => {
    if (user) {
      fetchPreferences();
    } else {
      setLoading(false);
      setPreferences({});
      preferencesRef.current = {};
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      const prefs = (data?.preferences as UserPreferences) || {};
      setPreferences(prefs);
      preferencesRef.current = prefs;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      setPreferences({});
      preferencesRef.current = {};
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = useCallback((key: string, value: any) => {
    if (!user) return;

    const prev = preferencesRef.current || {};
    if ((prev as any)[key] === value) {
      return; // No change
    }

    const next = { ...prev, [key]: value } as UserPreferences;
    preferencesRef.current = next;
    setPreferences(next);

    // Debounce the database update
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const payload = next; // capture stable snapshot for debounce
    timeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            preferences: payload
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;
      } catch (error) {
        console.error('Error updating user preference:', error);
        // Revert local state on error
        fetchPreferences();
      }
    }, 300); // 300ms debounce
  }, [user?.id]);

  const getPreference = useCallback((key: string, defaultValue: any = null) => {
    const prefs = preferencesRef.current || {};
    return (prefs as any)[key] ?? defaultValue;
  }, []);

  return {
    preferences,
    loading,
    updatePreference,
    getPreference,
    refetch: fetchPreferences
  };
}