-- AnnaSetu AI — Auth Triggers & Role Permissions Migration
-- Migration: 20261010000002_auth_triggers.sql
-- Source of truth: docs/architecture.md & docs/rules.md

-- Function to handle automated profile creation when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'AnnaSetu Member'),
        COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'donor'::public.user_role),
        timezone('utc', now()),
        timezone('utc', now())
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing on every new auth.users insertion
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Policy for Coordinators & Admins to view and verify all organizations
CREATE POLICY "Coordinators and admins manage all organizations"
    ON public.organizations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('coordinator', 'admin')
        )
    );

-- Policy for Coordinators and Safety Reviewers to view all safety assessments
CREATE POLICY "Staff view safety assessments"
    ON public.safety_assessments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('coordinator', 'safety_reviewer', 'admin')
        )
    );
