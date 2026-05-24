import { type OpenAIEmbeddingModelOptions, openai } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";
import {
  chunkText,
  normalizeTextForEmbedding,
  type TextChunk,
} from "@/lib/chunking";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

const embeddingModel = openai.embedding(EMBEDDING_MODEL);

type EmbeddingOptions = {
  abortSignal?: AbortSignal;
  user?: string;
};

export type EmbeddedTextChunk = TextChunk & {
  embedding: number[];
};

export async function generateEmbedding(
  value: string,
  options: EmbeddingOptions = {},
) {
  const normalizedValue = normalizeTextForEmbedding(value);

  if (!normalizedValue) {
    throw new Error("Cannot generate an embedding for empty text.");
  }

  const { embedding } = await embed({
    model: embeddingModel,
    value: normalizedValue,
    abortSignal: options.abortSignal,
    providerOptions: getOpenAIEmbeddingOptions(options.user),
  });

  return embedding;
}

export async function generateEmbeddingsForChunks(
  chunks: TextChunk[],
  options: EmbeddingOptions = {},
): Promise<EmbeddedTextChunk[]> {
  const normalizedChunks = chunks
    .map((chunk) => ({
      ...chunk,
      content: normalizeTextForEmbedding(chunk.content),
    }))
    .filter((chunk) => chunk.content.length > 0);

  if (normalizedChunks.length === 0) {
    return [];
  }

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: normalizedChunks.map((chunk) => chunk.content),
    abortSignal: options.abortSignal,
    providerOptions: getOpenAIEmbeddingOptions(options.user),
  });

  return normalizedChunks.map((chunk, index) => ({
    ...chunk,
    embedding: embeddings[index],
  }));
}

export async function generateEmbeddingsForText(
  text: string,
  options: EmbeddingOptions & {
    chunkSize?: number;
    overlap?: number;
  } = {},
) {
  const chunks = await chunkText(text, {
    chunkSize: options.chunkSize,
    overlap: options.overlap,
  });

  return generateEmbeddingsForChunks(chunks, options);
}

export async function generateSearchEmbedding(
  query: string,
  options: EmbeddingOptions = {},
) {
  return generateEmbedding(query, options);
}

function getOpenAIEmbeddingOptions(user?: string) {
  return {
    openai: {
      dimensions: EMBEDDING_DIMENSIONS,
      user,
    } satisfies OpenAIEmbeddingModelOptions,
  };
}