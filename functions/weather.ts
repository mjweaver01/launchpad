import { Handler } from '@netlify/functions';
import { getWeather } from '../server/weather';

const handler: Handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const { lat, lon } = event.queryStringParameters || {};

    if (!lat || !lon) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Latitude and longitude are required' }),
      };
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid latitude or longitude' }),
      };
    }

    const weather = await getWeather(latitude, longitude);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(weather),
    };
  } catch (error) {
    console.error('Weather function error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error:
          error instanceof Error ? error.message : 'An error occurred while fetching weather data',
      }),
    };
  }
};

export { handler };
