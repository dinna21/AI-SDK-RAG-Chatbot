import {
  chunkText,
  normalizeTextForEmbedding,
  type TextChunk,
} from "@/lib/chunking";
import {
  getOllamaApiUrl,
  OLLAMA_EMBEDDING_DIMENSIONS,
  OLLAMA_EMBEDDING_MODEL,
} from "@/lib/ollama";

export const EMBEDDING_MODEL = OLLAMA_EMBEDDING_MODEL;
export const EMBEDDING_DIMENSIONS = OLLAMA_EMBEDDING_DIMENSIONS;

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

  const [embedding] = await requestOllamaEmbeddings([normalizedValue], options);

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

  const embeddings = await requestOllamaEmbeddings(
    normalizedChunks.map((chunk) => chunk.content),
    options,
  );

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

async function requestOllamaEmbeddings(
  values: string[],
  options: EmbeddingOptions,
) {
  const response = await fetch(getOllamaApiUrl("/api/embed"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: values,
    }),
    signal: options.abortSignal,
  });

  if (!response.ok) {
    throw new Error(await getOllamaErrorMessage(response));
  }

  const data: unknown = await response.json();
  const embeddings = parseOllamaEmbeddings(data);

  if (embeddings.length !== values.length) {
    throw new Error(
      `Ollama returned ${embeddings.length} embeddings for ${values.length} inputs.`,
    );
  }

  return embeddings.map(validateEmbeddingDimensions);
}

function parseOllamaEmbeddings(data: unknown) {
  if (
    typeof data === "object" &&
    data !== null &&
    "embeddings" in data &&
    Array.isArray(data.embeddings)
  ) {
    return data.embeddings as number[][];
  }

  throw new Error("Ollama did not return embeddings for this request.");
}

function validateEmbeddingDimensions(embedding: number[]) {
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Ollama embedding model "${EMBEDDING_MODEL}" returned ${embedding.length} dimensions, but the database expects ${EMBEDDING_DIMENSIONS}. Update OLLAMA_EMBEDDING_MODEL, OLLAMA_EMBEDDING_DIMENSIONS, and the documents.embedding vector size together.`,
    );
  }

  return embedding;
}

async function getOllamaErrorMessage(response: Response) {
  const fallback = `Ollama embedding request failed with status ${response.status}.`;

  try {
    const data = (await response.json()) as { error?: string };

    return data.error ? `${fallback} ${data.error}` : fallback;
  } catch {
    return fallback;
  }
}
