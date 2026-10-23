/**
 * Resume file → plain text (PDF, DOCX, TXT). Server-only.
 */

import { extractText } from "unpdf";
import mammoth from "mammoth";

export const RESUME_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word (.docx)",
  "text/plain": "Text",
};

export class ResumeFileError extends Error {}

export async function resumeText(bytes: Uint8Array, mimeType: string, fileName: string): Promise<string> {
  // Some browsers send an empty or generic type; fall back to the extension.
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  const byExt: Record<string, string> = { pdf: "application/pdf", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", txt: "text/plain" };
  const type = mimeType && mimeType !== "application/octet-stream" ? mimeType : (byExt[ext] ?? "");
  if (type === "application/pdf") {
    const { text } = await extractText(new Uint8Array(bytes), { mergePages: false });
    return text.join("\n");
  }
  if (type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return value;
  }
  if (type === "text/plain") return new TextDecoder().decode(bytes);
  if (fileName.toLowerCase().endsWith(".doc")) throw new ResumeFileError("Old .doc files can't be read — save it as .docx or PDF.");
  throw new ResumeFileError("Upload the resume as PDF, Word (.docx), or plain text.");
}
