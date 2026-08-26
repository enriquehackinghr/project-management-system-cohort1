export const DOCUMENT_ACCEPT =
  ".pdf,.docx,.txt,.md,.markdown,.csv,.json,.html,.htm";

export const MAX_DOCUMENT_FILES = 8;
export const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;
export const MAX_DOCUMENT_CHARS = 80_000;

export const ALLOWED_DOCUMENT_EXTENSIONS = new Set([
  "pdf",
  "docx",
  "txt",
  "md",
  "markdown",
  "csv",
  "json",
  "html",
  "htm",
]);

export function documentExtension(name: string) {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1)! : "";
}

export function isAllowedDocument(file: { name: string; type: string }) {
  const extension = documentExtension(file.name);
  if (ALLOWED_DOCUMENT_EXTENSIONS.has(extension)) return true;
  return (
    file.type === "application/pdf" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type === "text/plain" ||
    file.type === "text/markdown" ||
    file.type === "text/csv" ||
    file.type === "application/json" ||
    file.type === "text/html"
  );
}
