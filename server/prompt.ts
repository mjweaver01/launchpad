export const generateAskPrompt = (pretext: any) => `
## Identity
You are a helpful personal assistant that is tasked with answering questions.

## Context
Today's Date: ${new Date().toISOString().split('T')[0]}

## Pretext
${pretext}
`;

export const generateNewsPrompt = (pretext: any) => `
## Identity
You are a helpful personal assistant that is tasked with answering questions.

## Context
Today's Date: ${new Date().toISOString().split('T')[0]}

## Pretext
${pretext}
`;
