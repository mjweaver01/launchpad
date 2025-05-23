import type { Handler } from '@netlify/functions';
import { google } from 'googleapis';

export const handler: Handler = async event => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Authorization header required' }),
    };
  }

  const accessToken = authHeader.replace('Bearer ', '');

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get events for the next week
    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 7);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events: events.map(event => ({
          id: event.id,
          summary: event.summary || 'No Title',
          description: event.description,
          start: event.start,
          end: event.end,
          location: event.location,
          htmlLink: event.htmlLink,
          created: event.created,
          updated: event.updated,
          creator: event.creator,
          attendees: event.attendees,
          colorId: event.colorId,
          status: event.status,
        })),
      }),
    };
  } catch (error) {
    console.error('Calendar events error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to fetch calendar events',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
