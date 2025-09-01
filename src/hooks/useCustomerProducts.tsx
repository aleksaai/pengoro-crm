import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CustomerProduct {
  id: string;
  customer_id: string;
  product_name: string;
  provider_company: string;
  monthly_contribution: number;
  commission_earned: number;
  start_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const useCustomerProducts = () => {
  const [products, setProducts] = useState<CustomerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching customer products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customer products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (productData: Omit<CustomerProduct, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const { data, error } = await supabase
        .from('customer_products')
        .insert(productData)
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Product added successfully",
      });
      return data;
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProduct = async (productId: string, updates: Partial<CustomerProduct>) => {
    try {
      const { data, error } = await supabase
        .from('customer_products')
        .update(updates)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...data } : p));
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('customer_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== productId));
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getProductsByCustomerId = (customerId: string) => {
    return products.filter(p => p.customer_id === customerId);
  };

  const getTotalCommissionByCustomerId = (customerId: string) => {
    return products
      .filter(p => p.customer_id === customerId)
      .reduce((sum, p) => sum + p.commission_earned, 0);
  };

  const getTotalMonthlyContributionByCustomerId = (customerId: string) => {
    return products
      .filter(p => p.customer_id === customerId)
      .reduce((sum, p) => sum + p.monthly_contribution, 0);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductsByCustomerId,
    getTotalCommissionByCustomerId,
    getTotalMonthlyContributionByCustomerId,
    refetch: fetchProducts,
  };
};