import { Handler } from '@netlify/functions';

const handler: Handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { lat, lon, zoom = '12', size = '400x150' } = event.queryStringParameters || {};

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

    // Get Google Maps API key from environment
    const GOOGLE_MAPS_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Google Maps API key not configured' }),
      };
    }

    // Build the Google Maps Static API URL
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    const params = new URLSearchParams({
      center: `${latitude},${longitude}`,
      zoom: zoom,
      size: size,
      maptype: 'roadmap',
      markers: `color:red|${latitude},${longitude}`,
      key: GOOGLE_MAPS_API_KEY,
      style: 'feature:poi|visibility:off', // Hide points of interest for cleaner look
    });

    const mapUrl = `${baseUrl}?${params.toString()}`;

    // Fetch the image from Google Maps
    const response = await fetch(mapUrl);

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `Google Maps API error: ${response.statusText}` }),
      };
    }

    // Get the image as a buffer
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/png';

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: `data:${contentType};base64,${base64Image}`,
        contentType: contentType,
      }),
    };
  } catch (error) {
    console.error('Static map function error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'An error occurred while fetching map data',
      }),
    };
  }
};

export { handler };
