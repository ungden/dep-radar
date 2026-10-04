const PRODUCTION_PROJECT_REF = 'ohjrocksurzkypcbfkha';
const PRODUCTION_URL = `https://${PRODUCTION_PROJECT_REF}.supabase.co`;

module.exports = ({ config }) => {
  if (process.env.EAS_BUILD_PROFILE !== 'production') return config;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (url !== PRODUCTION_URL || !key) {
    throw new Error('Production builds require the verified 360dep Supabase URL and public key. Check the EAS production environment.');
  }

  if (!key.startsWith('sb_publishable_')) {
    let claims;
    try {
      claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'));
    } catch {
      throw new Error('Production builds require a Supabase publishable key or valid anon JWT.');
    }
    if (claims.role !== 'anon' || claims.ref !== PRODUCTION_PROJECT_REF) {
      throw new Error('Production builds require the public anon key of the 360dep production project.');
    }
  }

  return config;
};
