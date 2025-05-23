import type { Handler } from '@netlify/functions';
import { google } from 'googleapis';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export const handler: Handler = async event => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Google OAuth credentials not configured',
      }),
    };
  }

  try {
    const { refreshToken } = JSON.parse(event.body || '{}');

    if (!refreshToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Refresh token is required' }),
      };
    }

    const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    // Refresh the access token
    const { credentials } = await oauth2Client.refreshAccessToken();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: credentials.access_token,
        expires_in: credentials.expiry_date
          ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
          : 3600,
      }),
    };
  } catch (error) {
    console.error('Google token refresh error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Token refresh failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
