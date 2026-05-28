"use server";

import { sql } from "drizzle-orm";
import { PDFParse } from "pdf-parse";
import { chunkText } from "@/lib/chunking";
import { db } from "@/lib/db-config";
import { documents } from "@/lib/db-schema";
import { generateEmbeddingsForChunks } from "@/lib/embeddings";

export async function uploadDocument(formData: FormData) {
  try {
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);

    if (files.length === 0) {
      const file = formData.get("file");

      if (file instanceof File) {
        files.push(file);
      }
    }

    if (files.length === 0) {
      throw new Error("At least one file is required.");
    }

    let inserted = 0;

    for (const file of files) {
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
        continue;
      }

      const embeddedChunks = await generateEmbeddingsForChunks(chunks, {
        user: file.name,
      });

      const source = file.name;
      const title = file.name.replace(/\.[^.]+$/, "") || file.name;

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

      inserted += embeddedChunks.length;
    }

    return {
      inserted,
      files: files.length,
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
