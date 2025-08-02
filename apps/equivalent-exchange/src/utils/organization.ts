import { createClient as createServerClient } from '@eq-ex/shared/server';

export type OrganizationData = {
  id: string;
  organization_name: string;
  subdomain: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  is_active: boolean;
};

export type OrganizationLookupResult = {
  success: true;
  data: OrganizationData;
} | {
  success: false;
  error: 'NOT_FOUND' | 'INACTIVE' | 'DATABASE_ERROR' | 'INVALID_SUBDOMAIN';
  message: string;
  subdomain: string;
};

function isValidSubdomainFormat(subdomain: string): boolean {
  // Check basic format requirements
  if (!subdomain || subdomain.length < 3 || subdomain.length > 50) {
    return false;
  }
  
  // Check regex pattern: alphanumeric + hyphens, not starting/ending with hyphen
  const subdomainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
  if (!subdomainRegex.test(subdomain)) {
    return false;
  }
  
  // Check for reserved subdomains
  const reservedSubdomains = [
    'www', 'api', 'admin', 'dashboard', 'app', 'mail', 'ftp', 'blog',
    'dev', 'test', 'staging', 'prod', 'production', 'support', 'help',
    'docs', 'status', 'cdn', 'assets', 'static', 'files', 'uploads'
  ];
  
  if (reservedSubdomains.includes(subdomain.toLowerCase())) {
    return false;
  }
  
  return true;
}

export async function getOrganizationBySubdomain(subdomain: string): Promise<OrganizationLookupResult> {
  // Skip organization lookup for 'www' or empty subdomain
  if (!subdomain || subdomain === 'www') {
    return {
      success: false,
      error: 'NOT_FOUND',
      message: 'No organization specified',
      subdomain: subdomain || 'www',
    };
  }

  // Validate subdomain format
  if (!isValidSubdomainFormat(subdomain)) {
    return {
      success: false,
      error: 'INVALID_SUBDOMAIN',
      message: 'Invalid subdomain format. Subdomains must be 3-50 characters, contain only letters, numbers, and hyphens, and cannot start or end with a hyphen.',
      subdomain,
    };
  }

  try {
    const supabase = await createServerClient(true);
    
    const { data, error } = await supabase
      .from('organization')
      .select('id, organization_name, subdomain, primary_color, secondary_color, logo_url, is_active')
      .eq('subdomain', subdomain)
      .single();

    if (error || !data) {
      console.error('Organization not found:', { subdomain, error });
      return {
        success: false,
        error: 'NOT_FOUND',
        message: `No organization found for "${subdomain}". Please check the subdomain and try again.`,
        subdomain,
      };
    }

    if (!data.is_active) {
      return {
        success: false,
        error: 'INACTIVE',
        message: 'This organization is temporarily unavailable. Please contact the organization administrator or try again later.',
        subdomain,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Database error fetching organization:', { subdomain, error });
    return {
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Unable to load organization data. Please try again in a few moments.',
      subdomain,
    };
  }
}
