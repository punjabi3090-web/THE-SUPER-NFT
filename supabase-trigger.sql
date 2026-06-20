-- ============================================================
-- PASTE THIS ENTIRE FILE INTO:
-- Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Step 1: Replace handle_new_user with schema-matched version
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_ref_code TEXT;
  upline_uuid  UUID;
  ref_code_in  TEXT;
  name_in      TEXT;
BEGIN
  name_in     := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  ref_code_in := UPPER(TRIM(COALESCE(NEW.raw_user_meta_data->>'referred_by_code', '')));

  -- Unique SNP referral code (same format as API server)
  new_ref_code := 'SNP' || UPPER(SUBSTR(MD5(NEW.id::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 6));

  -- Upline lookup by referral_code
  IF ref_code_in <> '' THEN
    SELECT id INTO upline_uuid
      FROM public.profiles
     WHERE referral_code = ref_code_in
     LIMIT 1;
  END IF;

  -- Insert profile — ON CONFLICT DO NOTHING so API server upsert always wins
  INSERT INTO public.profiles (
    user_id, email, name, referral_code, referred_by_code, upline_id,
    role, balance, total_team, total_deposit, total_withdraw, total_orders,
    is_valid_member, totp_enabled, level, user_level,
    bought_count, sold_count, daily_income, total_income, team_commission_earned,
    referral_earnings, is_level2_qualified, valid_team_count
  ) VALUES (
    NEW.id, NEW.email, name_in, new_ref_code,
    NULLIF(ref_code_in, ''), upline_uuid,
    'user', 0, 0, 0, 0, 0,
    true, false, 0, 0,
    0, 0, 0, 0, 0,
    0, false, 0
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Increment upline total_team
  IF upline_uuid IS NOT NULL THEN
    UPDATE public.profiles
       SET total_team = COALESCE(total_team, 0) + 1
     WHERE id = upline_uuid;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block auth signup — log the error and continue
  RAISE LOG 'handle_new_user failed for %: %', NEW.email, SQLERRM;
  RETURN NEW;
END;
$$;

-- Step 2: Recreate trigger cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Verify
SELECT 'Trigger created successfully' AS status;
