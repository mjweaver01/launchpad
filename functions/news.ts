import { Handler } from '@netlify/functions';
import { getTopNews } from '../server/news';

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
    // Get query parameters
    const { country, category, page, pageSize } = event.queryStringParameters || {};

    const newsData = await getTopNews(
      country || 'us',
      category,
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(newsData),
    };
  } catch (error) {
    console.error('Error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error:
          error instanceof Error ? error.message : 'An error occurred while processing the request',
      }),
    };
  }
};

export { handler };
