import { client, model } from './openai';
import { generateAskPrompt, generateWebSearchPrompt } from './prompt';

export const ask = async (
  question: string,
  conversationId: string,
  pretext: any,
  useWebSearch = false
) => {
  if (!question) {
    return { error: 'Question is required' };
  }

  try {
    // Generate OpenAI Prompt
    const prompt = useWebSearch ? generateWebSearchPrompt(question) : generateAskPrompt(pretext);
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      tools: useWebSearch
        ? [
            {
              type: 'function',
              function: {
                name: 'web_search',
                description: 'Search the web for current information',
                parameters: {
                  type: 'object',
                  properties: {
                    query: {
                      type: 'string',
                      description: 'The search query to look up',
                    },
                  },
                  required: ['query'],
                },
              },
            },
          ]
        : undefined,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return { error: 'An error occurred while processing the request' };
  }
};
