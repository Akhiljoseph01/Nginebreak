-- ==============================================================================
-- Nginebreak PostgreSQL Schema for Supabase
-- Paste this script into Supabase Dashboard -> SQL Editor and click "Run"
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'Car',
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    current_odometer INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Maintenance Modules Table (rules/schedules per vehicle)
CREATE TABLE IF NOT EXISTS public.maintenance_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    interval_km INTEGER,
    interval_months INTEGER,
    last_service_km INTEGER,
    last_service_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Service History Table (completed logs)
CREATE TABLE IF NOT EXISTS public.service_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.maintenance_modules(id) ON DELETE SET NULL,
    module_name TEXT NOT NULL,
    odometer INTEGER NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Row Level Security (RLS) Setup
-- This protects your database so users can only access their own vehicles.
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_history ENABLE ROW LEVEL SECURITY;

-- Development / MVP Policy (Allow anon / authenticated read & write for quick testing)
-- NOTE: For production with Supabase Auth, you can restrict to auth.uid() = user_id
CREATE POLICY "Allow all operations for development anon" 
    ON public.vehicles 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow all operations for development anon maintenance" 
    ON public.maintenance_modules 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow all operations for development anon service history" 
    ON public.service_history 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_user ON public.vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_modules_vehicle ON public.maintenance_modules(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_history_vehicle ON public.service_history(vehicle_id);

-- 6. Optional Vehicle Media Column
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]'::jsonb;

-- 7. Supabase Storage: 'vehicle-media' Bucket for Photos & Receipts
-- Enables high-performance, compressed image storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-media', 'vehicle-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public vehicle media read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-media');

CREATE POLICY "Public vehicle media upload access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vehicle-media');
