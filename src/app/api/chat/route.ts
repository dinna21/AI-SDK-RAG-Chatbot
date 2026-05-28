import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { OLLAMA_CHAT_MODEL, ollama } from "@/lib/ollama";

function getChatErrorMessage(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return "The chat service could not complete the request.";
  }

  const providerError = error as {
    error?: { type?: string; code?: string; message?: string };
    type?: string;
    code?: string;
    message?: string;
  };

  const errorMessage =
    providerError.error?.message ?? providerError.message ?? "";

  if (errorMessage.toLowerCase().includes("connection refused")) {
    return "Ollama is not running. Start Ollama locally and try again.";
  }

  return "The local Ollama chat service could not complete the request.";
}

export async function POST(request: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await request.json();

    const result = streamText({
      model: ollama.chat(OLLAMA_CHAT_MODEL),
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({
      onError: getChatErrorMessage,
    });
  } catch (error) {
    console.error("Error in chat route:", error);

    return new Response("Internal Server Error", {
      status: 500,
    });
  }
}
