
-- Create medicine_batches table for batch tracking with expiry dates
CREATE TABLE IF NOT EXISTS public.medicine_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id uuid REFERENCES public.medicines(id) ON DELETE CASCADE NOT NULL,
  batch_number text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  initial_quantity integer NOT NULL,
  unit_price numeric NOT NULL DEFAULT 0,
  expiry_date date NOT NULL,
  manufacture_date date,
  supplier_name text,
  received_date timestamp with time zone DEFAULT now(),
  status text NOT NULL DEFAULT 'active', -- active, depleted, expired, recalled
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create inventory_transactions table for stock movements
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id uuid REFERENCES public.medicines(id) ON DELETE CASCADE NOT NULL,
  batch_id uuid REFERENCES public.medicine_batches(id),
  transaction_type text NOT NULL, -- in, out, adjustment, expired, return
  quantity integer NOT NULL,
  previous_stock integer NOT NULL,
  new_stock integer NOT NULL,
  reference_type text, -- prescription, purchase_order, adjustment, expired
  reference_id uuid,
  unit_price numeric,
  total_price numeric,
  notes text,
  performed_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Create purchase_orders table for auto-reorder
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  supplier_name text NOT NULL,
  order_date timestamp with time zone DEFAULT now(),
  expected_delivery_date date,
  actual_delivery_date timestamp with time zone,
  status text NOT NULL DEFAULT 'draft', -- draft, pending, approved, ordered, shipped, received, cancelled
  subtotal numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  total numeric DEFAULT 0,
  notes text,
  auto_generated boolean DEFAULT false,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamp with time zone,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create purchase_order_items table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid REFERENCES public.purchase_orders(id) ON DELETE CASCADE NOT NULL,
  medicine_id uuid REFERENCES public.medicines(id) NOT NULL,
  quantity integer NOT NULL,
  received_quantity integer DEFAULT 0,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create inventory_settings table for auto-reorder configuration
CREATE TABLE IF NOT EXISTS public.inventory_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id uuid REFERENCES public.medicines(id) ON DELETE CASCADE UNIQUE NOT NULL,
  auto_reorder_enabled boolean DEFAULT true,
  reorder_point integer NOT NULL, -- trigger reorder when stock reaches this level
  reorder_quantity integer NOT NULL, -- how many to order
  max_stock integer, -- maximum stock level
  preferred_supplier text,
  lead_time_days integer DEFAULT 7, -- expected delivery time
  last_auto_order_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_medicine_batches_medicine_id ON public.medicine_batches(medicine_id);
CREATE INDEX IF NOT EXISTS idx_medicine_batches_expiry_date ON public.medicine_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_medicine_batches_status ON public.medicine_batches(status);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_medicine_id ON public.inventory_transactions(medicine_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON public.inventory_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_order_id ON public.purchase_order_items(purchase_order_id);

-- Enable RLS
ALTER TABLE public.medicine_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medicine_batches
CREATE POLICY "Staff can view batches" ON public.medicine_batches FOR SELECT USING (true);
CREATE POLICY "Pharmacy can manage batches" ON public.medicine_batches FOR ALL 
  USING (has_role(auth.uid(), 'farmasi') OR has_role(auth.uid(), 'admin'));

-- RLS Policies for inventory_transactions
CREATE POLICY "Staff can view transactions" ON public.inventory_transactions FOR SELECT USING (true);
CREATE POLICY "Pharmacy can insert transactions" ON public.inventory_transactions FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'farmasi') OR has_role(auth.uid(), 'admin'));

-- RLS Policies for purchase_orders
CREATE POLICY "Staff can view purchase orders" ON public.purchase_orders FOR SELECT USING (true);
CREATE POLICY "Pharmacy can manage purchase orders" ON public.purchase_orders FOR ALL 
  USING (has_role(auth.uid(), 'farmasi') OR has_role(auth.uid(), 'admin'));

-- RLS Policies for purchase_order_items
CREATE POLICY "Staff can view purchase order items" ON public.purchase_order_items FOR SELECT USING (true);
CREATE POLICY "Pharmacy can manage purchase order items" ON public.purchase_order_items FOR ALL 
  USING (has_role(auth.uid(), 'farmasi') OR has_role(auth.uid(), 'admin'));

-- RLS Policies for inventory_settings
CREATE POLICY "Staff can view inventory settings" ON public.inventory_settings FOR SELECT USING (true);
CREATE POLICY "Pharmacy can manage inventory settings" ON public.inventory_settings FOR ALL 
  USING (has_role(auth.uid(), 'farmasi') OR has_role(auth.uid(), 'admin'));

-- Create function to generate purchase order number
CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_number TEXT;
    date_part TEXT;
    sequence_part TEXT;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT LPAD((COALESCE(MAX(SUBSTRING(order_number FROM 12)::INTEGER), 0) + 1)::TEXT, 4, '0')
    INTO sequence_part
    FROM public.purchase_orders
    WHERE order_number LIKE 'PO-' || date_part || '-%';
    
    new_number := 'PO-' || date_part || '-' || sequence_part;
    RETURN new_number;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_medicine_batches_updated_at
  BEFORE UPDATE ON public.medicine_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_settings_updated_at
  BEFORE UPDATE ON public.inventory_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
