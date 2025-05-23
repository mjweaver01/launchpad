import { client, model } from './openai';
import { generateNewsPrompt } from './prompt';

export const news = async () => {
  try {
    // Generate OpenAI Prompt
    const prompt = generateNewsPrompt({});

    // Call OpenAI's Responses API to get the probability of the player appearing in their next game
    // Uses the built-in web_search_preview tool to get real-time data
    const response = await client.responses.create({
      model,
      tools: [{ type: 'web_search_preview' }],
      tool_choice: 'required',
      input: prompt,
    });

    return response.output_text;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return { error: 'An error occurred while processing the request' };
  }
};
