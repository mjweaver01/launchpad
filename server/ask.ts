import { client, model } from './openai';
import { generateAskPrompt } from './prompt';

export const ask = async (question: string, conversationId: string, pretext: any) => {
  if (!question) {
    return { error: 'Question is required' };
  }

  try {
    // Generate OpenAI Prompt
    const prompt = generateAskPrompt(pretext);
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return { error: 'An error occurred while processing the request' };
  }
};
