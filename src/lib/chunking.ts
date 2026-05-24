import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export function normalizeTextForEmbedding(text: string) {
	return text.replace(/\s+/g, " ").trim();
}

export type TextChunk = {
	content: string;
	chunkIndex: number;
};

export async function chunkText(
	text: string,
	{ chunkSize = 1200, overlap = 200 } = {},
): Promise<TextChunk[]> {
	if (chunkSize <= 0) {
		throw new Error("chunkSize must be greater than 0.");
	}

	if (overlap < 0 || overlap >= chunkSize) {
		throw new Error(
			"overlap must be greater than or equal to 0 and less than chunkSize.",
		);
	}

	const normalizedText = normalizeTextForEmbedding(text);

	if (!normalizedText) {
		return [];
	}

	const splitter = new RecursiveCharacterTextSplitter({
		chunkSize,
		chunkOverlap: overlap,
		separators: ["\n\n", "\n", ". ", "? ", "! ", " ", ""],
	});

	const chunks = await splitter.splitText(normalizedText);

	return chunks.map((content, index) => ({
		content: content.trim(),
		chunkIndex: index,
	}));
}
