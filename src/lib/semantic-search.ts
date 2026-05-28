import { desc, eq, sql } from "drizzle-orm";
import { cosineDistance } from "drizzle-orm/sql/functions/vector";
import { db } from "@/lib/db-config";
import { documents } from "@/lib/db-schema";
import { generateSearchEmbedding } from "@/lib/embeddings";

const DEFAULT_SEARCH_LIMIT = 5;
const MAX_SEARCH_LIMIT = 10;
const DEFAULT_MIN_SIMILARITY = 0;

export type SearchKnowledgeBaseOptions = {
  abortSignal?: AbortSignal;
  limit?: number;
  minSimilarity?: number;
  source?: string;
};

export type SearchKnowledgeBaseResult = {
  id: number;
  source: string;
  title: string | null;
  content: string;
  chunkIndex: number;
  similarity: number;
  metadata: Record<string, unknown> | null;
};

export async function searchKnowledgeBase(
  query: string,
  options: SearchKnowledgeBaseOptions = {},
): Promise<SearchKnowledgeBaseResult[]> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const limit = clampLimit(options.limit);
  const minSimilarity = options.minSimilarity ?? DEFAULT_MIN_SIMILARITY;
  const embedding = await generateSearchEmbedding(trimmedQuery, {
    abortSignal: options.abortSignal,
  });
  const distance = cosineDistance(documents.embedding, embedding);
  const similarity = sql<number>`1 - (${distance})`;

  const rows = await db
    .select({
      id: documents.id,
      source: documents.source,
      title: documents.title,
      content: documents.content,
      chunkIndex: documents.chunkIndex,
      metadata: documents.metadata,
      similarity,
    })
    .from(documents)
    .where(
      options.source
        ? sql`${eq(documents.source, options.source)} and ${similarity} >= ${minSimilarity}`
        : sql`${similarity} >= ${minSimilarity}`,
    )
    .orderBy(desc(similarity))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    similarity: Number(row.similarity),
  }));
}

export function formatSearchResultsForPrompt(
  results: SearchKnowledgeBaseResult[],
) {
  if (results.length === 0) {
    return "No relevant uploaded document chunks were found.";
  }

  return results
    .map((result, index) => {
      const title = result.title ?? result.source;
      const similarity = Math.round(result.similarity * 100);

      return [
        `[${index + 1}] ${title}`,
        `Source: ${result.source}`,
        `Chunk: ${result.chunkIndex}`,
        `Similarity: ${similarity}%`,
        "Content:",
        result.content,
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

function clampLimit(limit = DEFAULT_SEARCH_LIMIT) {
  if (!Number.isFinite(limit)) {
    return DEFAULT_SEARCH_LIMIT;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), MAX_SEARCH_LIMIT);
}
