import { Handler } from '@netlify/functions';

interface GoogleGeocodingResult {
  formatted_address: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface GoogleGeocodingResponse {
  results: GoogleGeocodingResult[];
  status: string;
}

interface NominatimResult {
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

interface LocationResponse {
  city: string;
  state: string;
  country: string;
  formattedAddress: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

const reverseGeocode = async (lat: number, lon: number): Promise<LocationResponse> => {
  const GOOGLE_MAPS_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;

  // Try Google Maps API first if API key is available
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(googleUrl);

      if (response.ok) {
        const data: GoogleGeocodingResponse = await response.json();

        if (data.status === 'OK' && data.results.length > 0) {
          const result = data.results[0];

          // Extract city, state, and country from address components
          let city = '';
          let state = '';
          let country = '';

          for (const component of result.address_components) {
            if (component.types.includes('locality')) {
              city = component.long_name;
            } else if (component.types.includes('administrative_area_level_1')) {
              state = component.short_name; // Use short name for states (e.g., "CA" instead of "California")
            } else if (component.types.includes('country')) {
              country = component.long_name;
            }
          }

          // Fallback for city if locality is not found
          if (!city) {
            for (const component of result.address_components) {
              if (component.types.includes('administrative_area_level_2')) {
                city = component.long_name;
                break;
              }
            }
          }

          return {
            city: city || 'Unknown',
            state: state || '',
            country: country || 'Unknown',
            formattedAddress: result.formatted_address,
            coordinates: { lat, lon },
          };
        }
      }
    } catch (error) {
      console.warn('Google Geocoding API failed, falling back to Nominatim:', error);
    }
  }

  // Fallback to OpenStreetMap Nominatim (free)
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'LaunchpadApp/1.0 (your-email@example.com)', // Required by Nominatim
      },
    });

    if (response.ok) {
      const data: NominatimResult = await response.json();

      const city = data.address?.city || data.address?.town || data.address?.village || 'Unknown';
      const state = data.address?.state || '';
      const country = data.address?.country || 'Unknown';

      return {
        city,
        state,
        country,
        formattedAddress: data.display_name,
        coordinates: { lat, lon },
      };
    }
  } catch (error) {
    console.error('Nominatim geocoding failed:', error);
  }

  // Ultimate fallback
  return {
    city: 'Unknown',
    state: '',
    country: 'Unknown',
    formattedAddress: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
    coordinates: { lat, lon },
  };
};

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

    const location = await reverseGeocode(latitude, longitude);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(location),
    };
  } catch (error) {
    console.error('Geocoding function error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error:
          error instanceof Error ? error.message : 'An error occurred while fetching location data',
      }),
    };
  }
};

export { handler };
