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
    const { code } = JSON.parse(event.body || '{}');

    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Authorization code is required' }),
      };
    }

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      `${new URL(event.headers.origin || 'http://localhost:5173').origin}/auth/google/callback`
    );

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Get user info
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expiry_date
          ? Math.floor((tokens.expiry_date - Date.now()) / 1000)
          : 3600,
        userInfo: {
          email: userInfo.data.email,
          name: userInfo.data.name,
          picture: userInfo.data.picture,
        },
      }),
    };
  } catch (error) {
    console.error('Google auth error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
