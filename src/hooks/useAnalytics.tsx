import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RevenueData {
  month: string;
  company: string;
  agent: string;
  revenue: number;
  commission: number;
}

export interface PersonalAnalytics {
  leadsAssigned: number;
  conversionRate: number;
  averageDealAmount: number;
  mostSoldProduct: string;
}

export interface CompanyAnalytics {
  totalRevenue: number;
  averageCommission: number;
  totalLeads: number;
  conversionRate: number;
}

export const useAnalytics = (selectedMonth?: string) => {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [personalAnalytics, setPersonalAnalytics] = useState<PersonalAnalytics | null>(null);
  const [companyAnalytics, setCompanyAnalytics] = useState<CompanyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRevenueData = async () => {
    try {
      let query = supabase
        .from('customer_products')
        .select(`
          monthly_contribution,
          commission_earned,
          provider_company,
          created_at,
          created_by
        `);

      if (selectedMonth) {
        const startDate = new Date(selectedMonth + '-01');
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        query = query
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
      }

      const { data: products, error } = await query;
      
      if (error) throw error;

      // Get unique user IDs and fetch their profiles
      const userIds = [...new Set(products?.map(p => p.created_by).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      // Create a map of user_id to full_name
      const userMap = profiles?.reduce((acc, profile) => {
        acc[profile.user_id] = profile.full_name;
        return acc;
      }, {} as Record<string, string>) || {};

      const formattedData: RevenueData[] = products?.map(item => ({
        month: new Date(item.created_at).toLocaleDateString('de-DE', { 
          year: 'numeric', 
          month: 'long' 
        }),
        company: item.provider_company,
        agent: userMap[item.created_by] || 'Unknown',
        revenue: Number(item.monthly_contribution),
        commission: Number(item.commission_earned)
      })) || [];

      setRevenueData(formattedData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    }
  };

  const fetchPersonalAnalytics = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get assigned leads
      let leadsQuery = supabase
        .from('leads')
        .select('*')
        .eq('created_by', user.id);

      if (selectedMonth) {
        const startDate = new Date(selectedMonth + '-01');
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        leadsQuery = leadsQuery
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
      }

      const { data: leads, error: leadsError } = await leadsQuery;
      if (leadsError) throw leadsError;

      // Get customer products for average deal amount
      let productsQuery = supabase
        .from('customer_products')
        .select('*')
        .eq('created_by', user.id);

      if (selectedMonth) {
        const startDate = new Date(selectedMonth + '-01');
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        productsQuery = productsQuery
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
      }

      const { data: products, error: productsError } = await productsQuery;
      if (productsError) throw productsError;

      const leadsAssigned = leads?.length || 0;
      const wonLeads = leads?.filter(lead => lead.status === 'Won').length || 0;
      const conversionRate = leadsAssigned > 0 ? (wonLeads / leadsAssigned) * 100 : 0;
      
      const averageDealAmount = products && products.length > 0
        ? products.reduce((sum, p) => sum + Number(p.monthly_contribution), 0) / products.length
        : 0;

      // Get most sold product
      const productCounts: { [key: string]: number } = {};
      products?.forEach(product => {
        productCounts[product.product_name] = (productCounts[product.product_name] || 0) + 1;
      });
      
      const mostSoldProduct = Object.keys(productCounts).length > 0
        ? Object.keys(productCounts).reduce((a, b) => productCounts[a] > productCounts[b] ? a : b)
        : 'N/A';

      setPersonalAnalytics({
        leadsAssigned,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageDealAmount: Math.round(averageDealAmount * 100) / 100,
        mostSoldProduct
      });
    } catch (error) {
      console.error('Error fetching personal analytics:', error);
    }
  };

  const fetchCompanyAnalytics = async () => {
    try {
      // Get all customer products
      let productsQuery = supabase
        .from('customer_products')
        .select('*');

      let leadsQuery = supabase
        .from('leads')
        .select('*');

      if (selectedMonth) {
        const startDate = new Date(selectedMonth + '-01');
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        
        productsQuery = productsQuery
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
        
        leadsQuery = leadsQuery
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
      }

      const { data: products, error: productsError } = await productsQuery;
      const { data: leads, error: leadsError } = await leadsQuery;
      
      if (productsError) throw productsError;
      if (leadsError) throw leadsError;

      const totalRevenue = products?.reduce((sum, p) => sum + Number(p.monthly_contribution), 0) || 0;
      const averageCommission = products && products.length > 0
        ? products.reduce((sum, p) => sum + Number(p.commission_earned), 0) / products.length
        : 0;
      
      const totalLeads = leads?.length || 0;
      const wonLeads = leads?.filter(lead => lead.status === 'Won').length || 0;
      const companyConversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

      setCompanyAnalytics({
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageCommission: Math.round(averageCommission * 100) / 100,
        totalLeads,
        conversionRate: Math.round(companyConversionRate * 100) / 100
      });
    } catch (error) {
      console.error('Error fetching company analytics:', error);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchRevenueData(),
        fetchPersonalAnalytics(),
        fetchCompanyAnalytics()
      ]);
      setLoading(false);
    };

    fetchAllData();
  }, [selectedMonth]);

  return {
    revenueData,
    personalAnalytics,
    companyAnalytics,
    loading,
    refetch: () => {
      fetchRevenueData();
      fetchPersonalAnalytics();
      fetchCompanyAnalytics();
    }
  };
};