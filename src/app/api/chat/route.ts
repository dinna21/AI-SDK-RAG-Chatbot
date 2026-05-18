import {
  streamText,
  UIMessage,
  convertToModelMessages,
} from "ai";

import { openai } from "@ai-sdk/openai";

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

  const errorType = providerError.error?.type ?? providerError.type;
  const errorCode = providerError.error?.code ?? providerError.code;
  const errorMessage = providerError.error?.message ?? providerError.message ?? "";

  if (
    errorType === "insufficient_quota" ||
    errorCode === "insufficient_quota" ||
    errorMessage.toLowerCase().includes("insufficient_quota")
  ) {
    return "OpenAI quota has been exceeded. Check your plan and billing settings before trying again.";
  }

  return "The chat service could not complete the request.";
}

export async function POST(request: Request) {
  try {
    const { messages }: { messages: UIMessage[] } =
      await request.json();

    const result = streamText({
      model: openai("gpt-4o-mini"),
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