import { createOpenAI } from "@ai-sdk/openai";

export const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:11434";

export const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL ?? "qwen3:8b";

export const OLLAMA_EMBEDDING_MODEL =
  process.env.OLLAMA_EMBEDDING_MODEL ?? "nomic-embed-text";

export const OLLAMA_EMBEDDING_DIMENSIONS = Number(
  process.env.OLLAMA_EMBEDDING_DIMENSIONS ?? "768",
);

export const ollama = createOpenAI({
  apiKey: "ollama",
  baseURL: `${OLLAMA_BASE_URL}/v1`,
  name: "ollama",
});

export function getOllamaApiUrl(path: `/${string}`) {
  return `${OLLAMA_BASE_URL}${path}`;
}
