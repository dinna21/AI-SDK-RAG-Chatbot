import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { OLLAMA_CHAT_MODEL, ollama } from "@/lib/ollama";
import {
  formatSearchResultsForPrompt,
  searchKnowledgeBase,
} from "@/lib/semantic-search";

const SYSTEM_PROMPT = `You are a helpful RAG assistant.

Use the uploaded document context to answer questions. The knowledge base may contain multiple documents, so search across them when the user does not name a specific file.
If the context is missing or does not contain the answer, say that clearly instead of guessing.
When a user asks about documents, policies, notes, requirements, or source material, use the searchKnowledgeBase tool to retrieve relevant chunks before giving the final answer.
Ground answers in the retrieved content, cite sources by title/source and chunk number when useful, and keep responses concise.`;

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
    const latestUserPrompt = getLatestUserText(messages);
    const initialSearchResults = latestUserPrompt
      ? await searchKnowledgeBase(latestUserPrompt, {
          abortSignal: request.signal,
          limit: 8,
        })
      : [];
    const retrievedContext = formatSearchResultsForPrompt(initialSearchResults);

    const result = streamText({
      model: ollama.chat(OLLAMA_CHAT_MODEL),
      system: `${SYSTEM_PROMPT}

Initial semantic search results for the latest user message:
${retrievedContext}`,
      messages: await convertToModelMessages(messages),
      tools: {
        searchKnowledgeBase: tool({
          description:
            "Run semantic search over uploaded document chunks from one or more uploaded documents and return the most relevant source content for answering the user.",
          inputSchema: z.object({
            query: z
              .string()
              .min(1)
              .describe("The focused natural-language search query."),
            limit: z
              .number()
              .int()
              .min(1)
              .max(10)
              .optional()
              .describe("Maximum number of document chunks to return across documents."),
            source: z
              .string()
              .optional()
              .describe("Optional exact uploaded file source name to narrow results to one document."),
            minSimilarity: z
              .number()
              .min(0)
              .max(1)
              .optional()
              .describe(
                "Optional cosine similarity floor from 0 to 1. Leave unset unless the user asks for strict matching.",
              ),
          }),
          execute: async (
            { query, limit, source, minSimilarity },
            { abortSignal },
          ) => {
            const results = await searchKnowledgeBase(query, {
              abortSignal,
              limit,
              minSimilarity,
              source,
            });

            return {
              results,
              formattedContext: formatSearchResultsForPrompt(results),
            };
          },
        }),
      },
      stopWhen: stepCountIs(3),
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

function getLatestUserText(messages: UIMessage[]) {
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  if (!latestUserMessage) {
    return "";
  }

  return latestUserMessage.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { type: "text"; text: string }).text)
    .join("\n")
    .trim();
}
