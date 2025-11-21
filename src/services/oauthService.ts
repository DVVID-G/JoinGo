import axios from 'axios';

export type NormalizedProfile = {
  provider: string;
  providerUid?: string;
  displayName?: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  email?: string;
  avatarUrl?: string;
  locale?: string | undefined;
};

/**
 * Exchange an OAuth authorization code for a normalized profile.
 * Currently implements Google OAuth2 code exchange.
 * @param provider 'google' | 'facebook' (google implemented)
 * @param code Authorization code from the provider
 * @param redirectUri Redirect URI used in the OAuth flow
 */
export async function exchangeCodeForProfile(provider: string, code: string, redirectUri?: string): Promise<NormalizedProfile> {
  if (provider === 'google') {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error('Google OAuth client id/secret not configured');

    // Exchange code for tokens
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('redirect_uri', redirectUri || '');
    params.append('grant_type', 'authorization_code');

    const tokenResp = await axios.post(tokenUrl, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const accessToken = tokenResp.data.access_token as string | undefined;
    const idToken = tokenResp.data.id_token as string | undefined;
    if (!accessToken && !idToken) throw new Error('No tokens returned from Google');

    // Prefer userinfo endpoint using access_token
    const userinfoUrl = 'https://www.googleapis.com/oauth2/v3/userinfo';
    const profileResp = await axios.get(userinfoUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    const profile = profileResp.data;

    const normalized: NormalizedProfile = {
      provider: 'google',
      providerUid: profile.sub || profile.id,
      displayName: profile.name,
      firstName: profile.given_name,
      lastName: profile.family_name,
      email: profile.email,
      avatarUrl: profile.picture,
      locale: profile.locale
    };
    return normalized;
  }

  // Facebook and others can be added later
  throw new Error(`Provider ${provider} not implemented`);
}

export default { exchangeCodeForProfile };
