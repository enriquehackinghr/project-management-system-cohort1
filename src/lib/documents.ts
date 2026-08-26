import "server-only";

import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  documentExtension,
  isAllowedDocument,
  MAX_DOCUMENT_BYTES,
  MAX_DOCUMENT_CHARS,
  MAX_DOCUMENT_FILES,
} from "./document-limits";

export type ExtractedDocument = {
  name: string;
  text: string;
};

export async function extractDocuments(files: File[]): Promise<ExtractedDocument[]> {
  if (files.length > MAX_DOCUMENT_FILES) {
    throw new Error(`Attach at most ${MAX_DOCUMENT_FILES} documents.`);
  }

  const extracted: ExtractedDocument[] = [];
  for (const file of files) {
    if (file.size > MAX_DOCUMENT_BYTES) {
      throw new Error(`${file.name} is larger than 8 MB.`);
    }
    if (!isAllowedDocument(file)) {
      throw new Error(
        `${file.name} is not a supported document. Use PDF, Word, Markdown, text, CSV, JSON, or HTML.`,
      );
    }
    const extension = documentExtension(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = (await extractOne(extension, file.type, buffer)).trim();
    if (!text) {
      throw new Error(`${file.name} did not contain readable text.`);
    }
    extracted.push({
      name: file.name,
      text: text.slice(0, MAX_DOCUMENT_CHARS),
    });
  }
  return extracted;
}

async function extractOne(extension: string, mime: string, buffer: Buffer) {
  if (extension === "pdf" || mime === "application/pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }
  if (
    extension === "docx" ||
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  if (ALLOWED_DOCUMENT_EXTENSIONS.has(extension) || mime.startsWith("text/")) {
    return buffer.toString("utf8");
  }
  return buffer.toString("utf8");
}

export function documentsPromptBlock(documents: ExtractedDocument[]) {
  if (documents.length === 0) return "";
  return documents
    .map(
      (document) =>
        `--- Attached document: ${document.name} ---\n${document.text}`,
    )
    .join("\n\n");
}
