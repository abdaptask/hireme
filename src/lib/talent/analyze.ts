/**
 * Resume analysis entry point: Claude when configured, otherwise (or on any
 * failure) the built-in extractor. Server-only.
 */

import Anthropic from "@anthropic-ai/sdk";
import { builtinExtract } from "./builtin";
import { claudeEnabled, claudeExtract } from "./claude";
import type { ParserId, ResumeProfile } from "./profile";

export async function analyzeResume(text: string): Promise<{ profile: ResumeProfile; parser: ParserId; note?: string }> {
  if (claudeEnabled()) {
    try {
      const profile = await claudeExtract(text);
      if (profile) return { profile, parser: "claude-opus-5-5" };
      return { profile: builtinExtract(text), parser: "builtin", note: "Claude didn't return a usable profile; used the built-in extractor." };
    } catch (e) {
      const why =
        e instanceof Anthropic.AuthenticationError ? "the Anthropic API key was rejected"
        : e instanceof Anthropic.RateLimitError ? "Claude is rate-limited right now"
        : e instanceof Anthropic.APIError ? `Claude returned an error (${e.status ?? "network"})`
        : "Claude couldn't be reached";
      console.error("Resume AI fallback:", e);
      return { profile: builtinExtract(text), parser: "builtin", note: `Used the built-in extractor because ${why}.` };
    }
  }
  return { profile: builtinExtract(text), parser: "builtin" };
}
