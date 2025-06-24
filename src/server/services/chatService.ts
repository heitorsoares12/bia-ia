import { openai } from "@/server/utils/openai";
import { assistantId } from "@/server/config/assistant";

export async function sendToAssistant(threadId: string, content: string): Promise<string> {
  const messagePromise = openai.beta.threads.messages.create(threadId, {
    role: "user",
    content,
  });

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Timeout ao enviar mensagem")), 10000);
  });

  await Promise.race([messagePromise, timeoutPromise]);

  const stream = await openai.beta.threads.runs.stream(threadId, {
    assistant_id: assistantId,
  });

  let assistantText = "";

  await new Promise<void>((resolve, reject) => {
    stream.on("textDelta", (delta) => {
      if (delta.value) assistantText += delta.value;
    });
    stream.on("end", () => resolve());
    stream.on("error", (err) => reject(err));
  });

  return assistantText;
}
