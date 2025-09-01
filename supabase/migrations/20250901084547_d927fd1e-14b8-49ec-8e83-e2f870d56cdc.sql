-- Create customer_products table to track detailed product information
CREATE TABLE public.customer_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  provider_company TEXT NOT NULL,
  monthly_contribution DECIMAL(10,2) NOT NULL DEFAULT 0,
  commission_earned DECIMAL(10,2) NOT NULL DEFAULT 0,
  start_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.customer_products ENABLE ROW LEVEL SECURITY;

-- Create policies for customer_products access
CREATE POLICY "All users can view customer products" 
ON public.customer_products 
FOR SELECT 
USING (true);

CREATE POLICY "All users can create customer products" 
ON public.customer_products 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "All users can update customer products" 
ON public.customer_products 
FOR UPDATE 
USING (true);

CREATE POLICY "All users can delete customer products" 
ON public.customer_products 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_customer_products_updated_at
BEFORE UPDATE ON public.customer_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_customer_products_customer_id ON public.customer_products(customer_id);