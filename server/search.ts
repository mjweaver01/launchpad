import { client, model } from './openai';
import { generateWebSearchPrompt } from './prompt';

interface SearchSource {
  title: string;
  snippet: string;
  url: string;
}

interface SearchResponse {
  answer: string;
  sources: SearchSource[];
}

export const search = async (query?: string): Promise<SearchResponse | { error: string }> => {
  if (!query) {
    return { error: 'Query is required' };
  }

  try {
    // Generate OpenAI Prompt
    const prompt = generateWebSearchPrompt(query);

    // Call OpenAI's Responses API
    // Uses the built-in web_search_preview tool to get real-time data
    const response = await client.responses.create({
      model,
      tools: [{ type: 'web_search_preview' }],
      tool_choice: 'required',
      input: prompt,
    });

    // Extract answer from response
    const answer = response.output_text || 'No answer available';

    // Return empty sources array for now
    const sources: SearchSource[] = [];

    return {
      answer,
      sources,
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return { error: 'An error occurred while processing the request' };
  }
};
