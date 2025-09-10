import { useState, useEffect } from 'react';
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

  const updatePreference = async (key: string, value: any) => {
    if (!user) return;

    const newPreferences = { ...preferences, [key]: value };
    
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preferences: newPreferences
        });

      if (error) throw error;

      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error updating user preference:', error);
    }
  };

  const getPreference = (key: string, defaultValue: any = null) => {
    return preferences[key] ?? defaultValue;
  };

  return {
    preferences,
    loading,
    updatePreference,
    getPreference,
    refetch: fetchPreferences
  };
}