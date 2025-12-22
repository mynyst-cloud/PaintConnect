-- =====================================================
-- Material Price History Table
-- Tracks historical prices from supplier invoices
-- =====================================================

CREATE TABLE IF NOT EXISTS material_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_invoice_id UUID REFERENCES supplier_invoices(id) ON DELETE SET NULL,
  
  -- Material identification
  sku TEXT,                          -- Artikelnummer/productcode van leverancier
  material_name TEXT NOT NULL,       -- Productnaam
  category TEXT,                     -- verf, primer, lak, klein_materiaal, etc.
  
  -- Pricing info from this invoice
  gross_unit_price DECIMAL(10,2),    -- Brutoprijs per eenheid
  discount_percentage DECIMAL(5,2) DEFAULT 0, -- Korting %
  net_unit_price DECIMAL(10,2),      -- Nettoprijs per eenheid (na korting)
  quantity DECIMAL(10,2),
  unit TEXT,                         -- stuk, liter, m2, kg, etc.
  vat_rate DECIMAL(5,2) DEFAULT 21,  -- BTW tarief
  total_line_price DECIMAL(10,2),    -- Totaalprijs van deze lijn
  
  -- Price change detection
  previous_net_price DECIMAL(10,2),  -- Vorige nettoprijs (indien bekend)
  price_change_percentage DECIMAL(5,2), -- Prijswijziging % t.o.v. vorige
  price_change_type TEXT,            -- 'increase', 'decrease', 'no_change', 'new'
  expected_discount DECIMAL(5,2),    -- Verwachte korting (gebaseerd op afspraken)
  discount_deviation DECIMAL(5,2),   -- Afwijking van verwachte korting
  
  -- Flags
  needs_review BOOLEAN DEFAULT false,
  review_reason TEXT,                -- 'price_increase', 'missing_discount', 'new_product', etc.
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  invoice_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mph_company ON material_price_history(company_id);
CREATE INDEX IF NOT EXISTS idx_mph_supplier ON material_price_history(supplier_id);
CREATE INDEX IF NOT EXISTS idx_mph_invoice ON material_price_history(supplier_invoice_id);
CREATE INDEX IF NOT EXISTS idx_mph_sku ON material_price_history(sku);
CREATE INDEX IF NOT EXISTS idx_mph_material_name ON material_price_history(material_name);
CREATE INDEX IF NOT EXISTS idx_mph_needs_review ON material_price_history(needs_review) WHERE needs_review = true;
CREATE INDEX IF NOT EXISTS idx_mph_invoice_date ON material_price_history(invoice_date);

-- RLS
ALTER TABLE material_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company material price history" ON material_price_history
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Service role full access" ON material_price_history
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- Supplier Discount Agreements Table
-- Stores agreed discounts per supplier/category
-- =====================================================

CREATE TABLE IF NOT EXISTS supplier_discount_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  
  -- Discount scope
  category TEXT,                     -- NULL = all products, or specific category
  sku_pattern TEXT,                  -- Optional: regex pattern for specific SKUs
  material_name_pattern TEXT,        -- Optional: pattern for material names
  
  -- Agreed discount
  discount_percentage DECIMAL(5,2) NOT NULL,
  min_quantity DECIMAL(10,2),        -- Minimum quantity for this discount
  
  -- Validity
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sda_company ON supplier_discount_agreements(company_id);
CREATE INDEX IF NOT EXISTS idx_sda_supplier ON supplier_discount_agreements(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sda_active ON supplier_discount_agreements(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE supplier_discount_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company discount agreements" ON supplier_discount_agreements
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage discount agreements" ON supplier_discount_agreements
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND company_role IN ('admin', 'owner')
    )
  );

COMMENT ON TABLE material_price_history IS 'Tracks material prices from each invoice for price change detection';
COMMENT ON TABLE supplier_discount_agreements IS 'Stores agreed discounts with suppliers for verification';

