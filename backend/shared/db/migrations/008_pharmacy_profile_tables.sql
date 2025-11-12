-- Migration 008: Pharmacy Profile Management Tables
-- Creates tables for pharmacy profiles, photos, operating hours, and delivery zones

-- Pharmacy Profiles Table
CREATE TABLE IF NOT EXISTS pharmacy_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address JSONB,
  phone VARCHAR(20),
  email VARCHAR(255),
  fax VARCHAR(20),
  whatsapp VARCHAR(20),
  website VARCHAR(255),
  services JSONB,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(pharmacy_id)
);

CREATE INDEX idx_pharmacy_profiles_pharmacy_id ON pharmacy_profiles(pharmacy_id);
CREATE INDEX idx_pharmacy_profiles_published ON pharmacy_profiles(published);

-- Pharmacy Photos Table
CREATE TABLE IF NOT EXISTS pharmacy_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL,
  url VARCHAR(500) NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pharmacy_photos_pharmacy_id ON pharmacy_photos(pharmacy_id);
CREATE INDEX idx_pharmacy_photos_display_order ON pharmacy_photos(pharmacy_id, display_order);

-- Operating Hours Table
CREATE TABLE IF NOT EXISTS operating_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT FALSE,
  notes TEXT
);

CREATE INDEX idx_operating_hours_pharmacy_id ON operating_hours(pharmacy_id);
CREATE INDEX idx_operating_hours_day ON operating_hours(pharmacy_id, day_of_week);

-- Delivery Zones Table
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL,
  zone_name VARCHAR(255),
  postal_codes TEXT[],
  delivery_fee DECIMAL(10,2),
  min_order DECIMAL(10,2),
  max_distance_km DECIMAL(5,2),
  polygon_geojson JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_delivery_zones_pharmacy_id ON delivery_zones(pharmacy_id);
CREATE INDEX idx_delivery_zones_postal_codes ON delivery_zones USING GIN(postal_codes);

-- Comments
COMMENT ON TABLE pharmacy_profiles IS 'Public-facing pharmacy information for patient discovery';
COMMENT ON TABLE pharmacy_photos IS 'Photo gallery for pharmacy pages';
COMMENT ON TABLE operating_hours IS 'Pharmacy operating hours by day of week';
COMMENT ON TABLE delivery_zones IS 'Pharmacy delivery zones with coverage and pricing';

-- Update updated_at trigger for pharmacy_profiles
CREATE OR REPLACE FUNCTION update_pharmacy_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pharmacy_profiles_updated_at
BEFORE UPDATE ON pharmacy_profiles
FOR EACH ROW
EXECUTE FUNCTION update_pharmacy_profiles_updated_at();
