export const PRODUCT_MEMBER_PORTAL = 'member_portal';
export const PRODUCT_CRM = 'crm';

export type AppRole = 'member' | 'admin' | 'coach';

export type Product = 'member_portal' | 'app' | 'crm' | 'coach_dashboard' | 'forum' | 'forum_admin';

export type AccessClaims = {
  roles: AppRole[];
  products: Product[];
};

export function parseAccessTokenClaims(accessToken: string | undefined): AccessClaims {
  if (!accessToken) {
    return { roles: [], products: [] };
  }

  try {
    const [, payloadSegment] = accessToken.split('.');
    if (!payloadSegment) {
      return { roles: [], products: [] };
    }

    const payload = JSON.parse(Buffer.from(payloadSegment, 'base64url').toString('utf8')) as {
      sbm_roles?: unknown;
      sbm_products?: unknown;
    };

    return {
      roles: Array.isArray(payload.sbm_roles)
        ? payload.sbm_roles.filter((role): role is AppRole => isAppRole(role))
        : [],
      products: Array.isArray(payload.sbm_products)
        ? payload.sbm_products.filter((product): product is Product => isProduct(product))
        : [],
    };
  } catch {
    return { roles: [], products: [] };
  }
}

export function hasProduct(products: Product[], required: Product): boolean {
  return products.includes(required);
}

function isAppRole(value: unknown): value is AppRole {
  return value === 'member' || value === 'admin' || value === 'coach';
}

function isProduct(value: unknown): value is Product {
  return (
    value === 'member_portal' ||
    value === 'app' ||
    value === 'crm' ||
    value === 'coach_dashboard' ||
    value === 'forum' ||
    value === 'forum_admin'
  );
}
