export const assistantId =
  process.env.OPENAI_ASSISTANT_ID ||
  process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID;

if (!assistantId) {
  throw new Error('OPENAI_ASSISTANT_ID environment variable not set');
}
