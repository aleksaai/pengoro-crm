import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function usePermissions() {
  const { user, accountType } = useAuth();

  const canEditLead = async (leadId: string): Promise<boolean> => {
    if (!user || !accountType) return false;
    
    try {
      const { data, error } = await supabase.rpc('can_edit_lead', {
        lead_uuid: leadId,
        user_uuid: user.id
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking lead edit permissions:', error);
      return false;
    }
  };

  const isSuperAdmin = accountType === 'super_admin';
  const isAdmin = accountType === 'admin';
  const isUser = accountType === 'user';

  return {
    canEditLead,
    isSuperAdmin,
    isAdmin,
    isUser,
    accountType
  };
}