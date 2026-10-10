-- AnnaSetu AI — Initial Database Schema Migration
-- Migration: 20261010000001_initial_schema.sql
-- Source of truth: docs/architecture.md & docs/rules.md

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS (Strict State Machines)
-- ============================================================================

CREATE TYPE user_role AS ENUM (
    'donor',
    'recipient',
    'volunteer',
    'coordinator',
    'safety_reviewer',
    'admin'
);

CREATE TYPE listing_status AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'EVIDENCE_REVIEW',
    'AVAILABLE',
    'ON_HOLD',
    'PARTIALLY_RESERVED',
    'FULLY_RESERVED',
    'PICKUP_IN_PROGRESS',
    'PARTIALLY_HANDED_OVER',
    'COMPLETED',
    'EXPIRED',
    'CANCELLED',
    'REJECTED'
);

CREATE TYPE evidence_status AS ENUM (
    'INCOMPLETE',
    'PENDING_ASSESSMENT',
    'NEEDS_CLARIFICATION',
    'PENDING_HUMAN_REVIEW',
    'ELIGIBLE_UNDER_RULES',
    'ON_HOLD',
    'REJECTED_BY_RULE',
    'WITHDRAWN'
);

CREATE TYPE allocation_status AS ENUM (
    'PROPOSED',
    'OFFERED',
    'RESERVED',
    'CONFIRMED',
    'COLLECTED',
    'HANDED_OVER',
    'DECLINED',
    'EXPIRED',
    'CANCELLED',
    'FAILED',
    'PARTIALLY_ACCEPTED',
    'REJECTED_AT_HANDOVER'
);

CREATE TYPE food_unit AS ENUM (
    'kg',
    'grams',
    'liters',
    'plates',
    'packets'
);

-- ============================================================================
-- PROFILES & ORGANIZATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    phone_verified BOOLEAN DEFAULT FALSE,
    role user_role NOT NULL DEFAULT 'donor',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g. 'ashram', 'orphanage', 'shelter', 'community_kitchen', 'caterer', 'hotel'
    verification_status TEXT NOT NULL DEFAULT 'unverified', -- 'unverified', 'pending', 'verified', 'rejected'
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_in_org TEXT NOT NULL DEFAULT 'member', -- 'admin', 'coordinator', 'staff'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(organization_id, profile_id)
);

-- ============================================================================
-- FOOD LISTINGS & FOOD ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.food_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID NOT NULL REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    description TEXT,
    status listing_status NOT NULL DEFAULT 'DRAFT',
    pickup_window_start TIMESTAMPTZ NOT NULL,
    pickup_window_end TIMESTAMPTZ NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    approx_area_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT chk_pickup_window CHECK (pickup_window_end > pickup_window_start)
);

CREATE TABLE IF NOT EXISTS public.food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.food_listings(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    food_type TEXT NOT NULL, -- 'cooked_rice', 'cooked_curry', 'bread_roti', 'dry_rations', etc.
    quantity_value NUMERIC(10, 2) NOT NULL,
    quantity_unit food_unit NOT NULL DEFAULT 'kg',
    preparation_time TIMESTAMPTZ NOT NULL,
    handling_history TEXT,
    storage_condition TEXT, -- 'room_temperature', 'refrigerated', 'hot_held'
    is_perishable BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT chk_positive_quantity CHECK (quantity_value > 0)
);

CREATE TABLE IF NOT EXISTS public.food_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.food_listings(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    photo_type TEXT NOT NULL DEFAULT 'overhead_dish',
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.safety_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.food_listings(id) ON DELETE CASCADE,
    status evidence_status NOT NULL DEFAULT 'PENDING_ASSESSMENT',
    rule_version TEXT NOT NULL,
    model_name TEXT,
    observations JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    risk_indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
    reviewer_notes TEXT,
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ============================================================================
-- RECIPIENT CAPACITY SNAPSHOTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.recipient_capacity_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    people_served INTEGER NOT NULL,
    meals_needed INTEGER NOT NULL,
    storage_capability TEXT, -- 'dry_only', 'refrigerated', 'freezer', 'none'
    dietary_preferences JSONB NOT NULL DEFAULT '[]'::jsonb, -- e.g. ['pure_veg', 'no_onion_garlic']
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    snapshot_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT chk_positive_needs CHECK (people_served >= 0 AND meals_needed >= 0)
);

-- ============================================================================
-- ALLOCATION PLANS & RESERVATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.allocation_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.food_listings(id) ON DELETE CASCADE,
    optimizer_version TEXT NOT NULL,
    input_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'GENERATED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.allocation_plans(id) ON DELETE CASCADE,
    food_item_id UUID NOT NULL REFERENCES public.food_items(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    allocated_quantity NUMERIC(10, 2) NOT NULL,
    status allocation_status NOT NULL DEFAULT 'PROPOSED',
    reserved_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT chk_allocated_quantity CHECK (allocated_quantity > 0)
);

-- ============================================================================
-- HANDOVER RECORDS & AUDIT EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.handover_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allocation_id UUID NOT NULL UNIQUE REFERENCES public.allocations(id) ON DELETE CASCADE,
    offered_quantity NUMERIC(10, 2) NOT NULL,
    collected_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
    delivered_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
    accepted_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
    rejected_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
    rejection_reason TEXT,
    collector_id UUID REFERENCES public.profiles(id),
    confirmed_by_recipient UUID REFERENCES public.profiles(id),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipient_capacity_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocation_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- 2. Food Listings
CREATE POLICY "Donors can manage their own listings"
    ON public.food_listings FOR ALL
    USING (auth.uid() = donor_id);

CREATE POLICY "Available listings visible to authenticated users"
    ON public.food_listings FOR SELECT
    USING (status IN ('AVAILABLE', 'PARTIALLY_RESERVED', 'FULLY_RESERVED', 'PICKUP_IN_PROGRESS'));

-- 3. Food Items
CREATE POLICY "Items visible if listing is visible"
    ON public.food_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.food_listings fl
            WHERE fl.id = food_items.listing_id
            AND (fl.donor_id = auth.uid() OR fl.status IN ('AVAILABLE', 'PARTIALLY_RESERVED', 'FULLY_RESERVED', 'PICKUP_IN_PROGRESS'))
        )
    );

-- 4. Allocations
CREATE POLICY "Recipients view their own allocations"
    ON public.allocations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = allocations.recipient_id
            AND om.profile_id = auth.uid()
        )
    );
