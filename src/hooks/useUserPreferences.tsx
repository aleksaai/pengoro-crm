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
  const preferencesRef = useRef<UserPreferences>(preferences);

  // Keep ref in sync with state
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    } else {
      setLoading(false);
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

      setPreferences((data?.preferences as UserPreferences) || {});
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      setPreferences({});
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = useCallback(async (key: string, value: any) => {
    if (!user) return;

    // Update local state immediately for smooth UX
    const newPreferences = { ...preferencesRef.current, [key]: value };
    setPreferences(newPreferences);

    // Debounce the database update
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            preferences: { ...preferencesRef.current }
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
  }, [user]);

  const getPreference = useCallback((key: string, defaultValue: any = null) => {
    return preferences[key] ?? defaultValue;
  }, [preferences]);

  return {
    preferences,
    loading,
    updatePreference,
    getPreference,
    refetch: fetchPreferences
  };
}