import { createServerClient } from '@eq-ex/shared';

export type OrganizationData = {
  id: string;
  organization_name: string;
  subdomain: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  is_active: boolean;
} | null;

export async function getOrganizationBySubdomain(subdomain: string): Promise<OrganizationData> {
  // Skip organization lookup for 'www' or empty subdomain
  if (!subdomain || subdomain === 'www') {
    return null;
  }

  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('organization')
      .select('id, organization_name, subdomain, primary_color, secondary_color, logo_url, is_active')
      .eq('subdomain', subdomain)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.error('Error fetching organization data:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching organization data:', error);
    return null;
  }
}
