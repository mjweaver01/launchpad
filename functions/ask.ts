import { Handler } from '@netlify/functions';
import { ask } from '../server/ask';

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

  if (event.httpMethod === 'GET' || !event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Bad request' }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { question, conversationId } = body;

    if (!question) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Question is required' }),
      };
    }

    const answer = await ask(question, conversationId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(answer),
    };
  } catch (error) {
    console.error('Error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'An error occurred while processing the request' }),
    };
  }
};

export { handler };
