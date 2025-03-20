import { openai } from "@/app/openai";

export const runtime = "nodejs";

// Create a new assistant
export async function POST() {
  const assistant = await openai.beta.assistants.create({
    instructions: "Você é a Bia, uma assistente útil.",
    name: "Assistente Bia",
    model: "gpt-4o",
    tools: []
  });
  return Response.json({ assistantId: assistant.id });
}