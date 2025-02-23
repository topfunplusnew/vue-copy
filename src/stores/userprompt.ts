// userprompt.ts
export function generateUserPrompt(localization: string, destination: string, travelTypes: string[]): string {
  let prompt = `I am planning a trip from ${localization} to ${destination}.\n`;
  if (travelTypes.length > 0) {
    prompt += `My preferred travel type: ${travelTypes.join(", ")}.\n`;
  } else {
    prompt += `I have no specific travel type preferences.\n`;
  }
  prompt += "Let's GO! ";
  return prompt;
}
