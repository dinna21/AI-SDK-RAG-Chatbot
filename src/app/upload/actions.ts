"use server";

import { eq, sql } from "drizzle-orm";
import { PDFParse } from "pdf-parse";
import { chunkText } from "@/lib/chunking";
import { db } from "@/lib/db-config";
import { documents } from "@/lib/db-schema";
import { generateEmbeddingsForChunks } from "@/lib/embeddings";

export async function uploadDocument(formData: FormData) {
  try {
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new Error("A file is required.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const parser = new PDFParse({ data: buffer });
    let text = "";

    try {
      const parsedDocument = await parser.getText();
      text = parsedDocument.text;
    } finally {
      await parser.destroy();
    }

    const chunks = await chunkText(text);

    if (chunks.length === 0) {
      return { inserted: 0 };
    }

    const embeddedChunks = await generateEmbeddingsForChunks(chunks, {
      user: file.name,
    });

    const source = file.name;
    const title = file.name.replace(/\.[^.]+$/, "") || file.name;

    await db.delete(documents).where(eq(documents.source, source));

    await db.insert(documents).values(
      embeddedChunks.map((chunk) => ({
        source,
        title,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        metadata: {
          fileName: file.name,
          fileType: file.type,
          size: file.size,
        },
        embedding: sql`${formatPgVector(chunk.embedding)}::vector`,
      })),
    );

    return {
      inserted: embeddedChunks.length,
    };
  } catch (error) {
    console.error("❌ Error uploading document:", error);

    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }

    throw error;
  }
}

function formatPgVector(embedding: number[]) {
  return `[${embedding.join(",")}]`;
}
