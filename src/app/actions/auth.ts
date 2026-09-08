'use server';

/**
 * Checks if real Google OAuth 2.0 Client credentials (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)
 * are configured in the environment variables.
 */
export async function checkGoogleOauthConfiguredAction(): Promise<{ isConfigured: boolean }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const isConfigured = Boolean(
    clientId &&
      clientSecret &&
      clientId.trim() !== '' &&
      clientSecret.trim() !== '' &&
      clientId !== 'mock-google-client-id' &&
      clientSecret !== 'mock-google-client-secret'
  );

  return { isConfigured };
}
