alter table "public"."organization" alter column "primary_color" set default NULL::character varying;
alter table "public"."organization" alter column "secondary_color" set default NULL::character varying;

CREATE OR REPLACE FUNCTION public.create_organization_with_owner(
  org_name text,
  org_email text,
  org_max_points integer,
  org_subdomain text,
  owner_user_id uuid,
  owner_email text,
  owner_name text,
  org_primary_color text DEFAULT NULL,
  org_secondary_color text DEFAULT NULL,
  org_logo_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Insert the organization
  INSERT INTO organization (
    organization_name,
    email,
    max_points,
    subdomain,
    primary_color,
    secondary_color,
    logo_url,
    is_active
  ) VALUES (
    org_name,
    org_email,
    org_max_points,
    org_subdomain,
    org_primary_color,
    org_secondary_color,
    org_logo_url,
    true
  ) RETURNING id INTO new_org_id;

  -- Insert the organization member (owner)
  INSERT INTO organization_members (
    organization_id,
    user_id,
    email,
    name,
    role,
    is_active,
    invited_by,
    invited_at
  ) VALUES (
    new_org_id,
    owner_user_id,
    owner_email,
    owner_name,
    'owner',
    true,
    owner_user_id,
    now()
  );

  -- Return the organization ID
  RETURN new_org_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Any error will automatically rollback the transaction
    RAISE;
END;
$$;

ALTER TABLE organization
ADD COLUMN card_config JSONB;

