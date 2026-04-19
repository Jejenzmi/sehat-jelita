
-- Procurement policies for inventory management  
CREATE POLICY "Procurement can manage medicines" ON public.medicines FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'procurement'::public.app_role)) 
WITH CHECK (public.has_role(auth.uid(), 'procurement'::public.app_role));

CREATE POLICY "Procurement can manage medicine_batches" ON public.medicine_batches FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'procurement'::public.app_role)) 
WITH CHECK (public.has_role(auth.uid(), 'procurement'::public.app_role));

CREATE POLICY "Procurement can manage inventory_transactions" ON public.inventory_transactions FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'procurement'::public.app_role)) 
WITH CHECK (public.has_role(auth.uid(), 'procurement'::public.app_role));

CREATE POLICY "Procurement can manage purchase_orders" ON public.purchase_orders FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'procurement'::public.app_role)) 
WITH CHECK (public.has_role(auth.uid(), 'procurement'::public.app_role));

CREATE POLICY "Procurement can manage purchase_order_items" ON public.purchase_order_items FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'procurement'::public.app_role)) 
WITH CHECK (public.has_role(auth.uid(), 'procurement'::public.app_role));

CREATE POLICY "Procurement can manage vendors" ON public.vendors FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'procurement'::public.app_role)) 
WITH CHECK (public.has_role(auth.uid(), 'procurement'::public.app_role));

CREATE POLICY "Procurement can manage vendor_contracts" ON public.vendor_contracts FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'procurement'::public.app_role)) 
WITH CHECK (public.has_role(auth.uid(), 'procurement'::public.app_role));

CREATE POLICY "Procurement can manage vendor_evaluations" ON public.vendor_evaluations FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'procurement'::public.app_role)) 
WITH CHECK (public.has_role(auth.uid(), 'procurement'::public.app_role));

CREATE POLICY "Procurement can manage maintenance_assets" ON public.maintenance_assets FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'procurement'::public.app_role)) 
WITH CHECK (public.has_role(auth.uid(), 'procurement'::public.app_role));

CREATE POLICY "Procurement can manage inventory_settings" ON public.inventory_settings FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'procurement'::public.app_role)) 
WITH CHECK (public.has_role(auth.uid(), 'procurement'::public.app_role));
