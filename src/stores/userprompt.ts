// userprompt.ts
export function generateUserPrompt(localization: string, destination: string, travelTypes: string[]): string {
  let prompt = `I am planning a trip from ${localization} to ${destination}.\n`;
  if (travelTypes.length > 0) {
    prompt += `My preferred travel types are: ${travelTypes.join(", ")}.\n`;
  } else {
    prompt += `I have no specific travel type preferences.\n`;
  }
  prompt += "Please provide a detailed itinerary with travel tips and weather considerations.";
  return prompt;
}
