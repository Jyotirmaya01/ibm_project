-- AnnaSetu AI — Synthetic Development Seed Data
-- Source of truth: docs/rules.md (Clearly labeled synthetic/demo data only)

-- Insert synthetic organizations (Recipients)
INSERT INTO public.organizations (id, name, type, verification_status, latitude, longitude, address)
VALUES
    ('a0000000-0000-0000-0000-000000000001', '[DEMO] Shanti Ashram Community Kitchen', 'ashram', 'verified', 12.9716, 77.5946, 'Demo Street 1, Bengaluru'),
    ('a0000000-0000-0000-0000-000000000002', '[DEMO] Hope Child Shelter', 'orphanage', 'verified', 12.9800, 77.6000, 'Demo Street 2, Bengaluru'),
    ('a0000000-0000-0000-0000-000000000003', '[DEMO] City Night Shelter', 'shelter', 'verified', 12.9650, 77.5850, 'Demo Street 3, Bengaluru')
ON CONFLICT (id) DO NOTHING;

-- Insert synthetic recipient capacity snapshots
INSERT INTO public.recipient_capacity_snapshots (id, recipient_id, people_served, meals_needed, storage_capability, dietary_preferences, is_active)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 45, 45, 'refrigerated', '["pure_veg"]'::jsonb, TRUE),
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 30, 30, 'dry_only', '[]'::jsonb, TRUE),
    ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 60, 60, 'none', '[]'::jsonb, TRUE)
ON CONFLICT (id) DO NOTHING;
