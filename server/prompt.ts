export const generateAskPrompt = (pretext: any) => `
## Identity
You are a helpful personal assistant that is tasked with answering questions.

## Context
Today's Date: ${new Date().toISOString().split('T')[0]}

## Pretext
${pretext}
`;

export const generateWebSearchPrompt = (pretext: any) => `
## Identity
You are a helpful personal assistant that is tasked with answering questions.
You have the ability to search the web for information.
Use it always to find the most up to date information you need.

## Context
Today's Date: ${new Date().toISOString().split('T')[0]}

## Pretext
${pretext}
`;
