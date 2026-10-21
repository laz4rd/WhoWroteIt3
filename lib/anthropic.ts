/**
 * lib/anthropic.ts – Ollama local wrapper
 *
 * This file replaces the Anthropic SDK with a tiny fetch‑based wrapper that
 * talks to an Ollama server (`ollama serve`).  The exported functions have the
 * same signatures as the original Anthropic version, so the rest of the code
 * (`server/game.ts`) does not need any changes.
 *
 * Environment variables (in `.env.local`):
 *   OLLAMA_BASE_URL  – base URL of the Ollama HTTP API
 *                   default: "http://localhost:11434"
 *   OLLAMA_MODEL     – name of the model you have pulled with `ollama pull`
 *                      default: "mistral"
 *
 * The game flow is unchanged:
 *   1️⃣ Writer submits a sentence → server calls `generateAiSentence` →
 *   2️⃣ Ollama returns a short sentence → guesser sees it → round reveal.
 */

// ──────────────────────────────────────────────────────────────────────
// 1️⃣  Environment – read once at module load time
// ──────────────────────────────────────────────────────────────────────
const ollamaBaseUrl: string = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const ollamaModel: string = process.env.OLLAMA_MODEL ?? "qwen3:8b";
const TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 45000; // first call loads the model: be generous
const MAX_TOKENS = Number(process.env.OLLAMA_MAX_TOKENS) || 80;

function cleanOutput(raw: string): string {
  let t = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "") // strip reasoning blocks
    .replace(/<think>[\s\S]*$/i, "") // unterminated think block
    .trim();
  t = t.split("\n").map((l) => l.trim()).filter(Boolean)[0] ?? ""; // first non-empty line only
  return t.replace(/^["'“”‘’]+|["'“”‘’]+$/g, "").trim();
}

/** Call once at server start so the first real round isn't slow. */
export async function warmUpOllama(): Promise<void> {
  try {
    await ollamaGenerate("Reply with the single word: ready");
    console.log(`[ollama] warmed up model "${ollamaModel}" at ${ollamaBaseUrl}`);
  } catch (err) {
    console.error(`[ollama] warm-up failed — is "ollama serve" running and "${ollamaModel}" pulled?`, err);
  }
}

// ──────────────────────────────────────────────────────────────────────
// 2️⃣  Helper – send a prompt to Ollama's /api/chat endpoint
// ──────────────────────────────────────────────────────────────────────
async function ollamaGenerate(prompt: string): Promise<string> {
  const payload = {
    model: ollamaModel,
    messages: [{ role: "user", content: prompt }],
    stream: false,
    think: false, // qwen3 etc: otherwise tokens get spent "thinking" and content comes back empty
    keep_alive: "30m", // keep model loaded between rounds
    options: {
      num_predict: MAX_TOKENS, // Ollama's real option name (max_tokens is ignored)
      temperature: 0.8,
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const txt = await response.text();
      throw new Error(`Ollama request failed (${response.status}): ${txt}`);
    }

    const json = (await response.json()) as { message?: { content?: string } };
    return cleanOutput(json?.message?.content ?? "");
  } catch (err: any) {
    if (err?.name === "AbortError") {
      console.error(`[Ollama Error]: Request timed out after ${TIMEOUT_MS}ms`);
    } else {
      console.error("[Ollama Fetch Error]:", err);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ──────────────────────────────────────────────────────────────────────
// 3️⃣  Public API – identical signatures to the original Anthropic code
// ──────────────────────────────────────────────────────────────────────

/**
 * Generate ONE short sentence about `topic`, styled to match the human
 * sentence's length/tone, without ever mentioning it's AI‑written.
 * Throws on failure – caller must handle fallback (the game falls back to
 * "human" rounds when this throws).
 */
export async function generateAiSentence(
  topic: string,
  humanSentence: string,
  challenge = "Write naturally"
): Promise<string> {
  const prompt = `Topic:
${topic}

A human player wrote this sentence:

${humanSentence}

Round challenge: ${challenge}

Generate ONE short sentence about the same topic that follows the round challenge.

Match the approximate:
- length
- simplicity
- casualness
- grammatical complexity
- tone

The output should feel like something an ordinary college student might naturally write.

Do not mention AI.
Do not mention this instruction.
Do not explain your reasoning.
Do not use quotation marks.
Return ONLY the sentence.`;

  const sentence = await ollamaGenerate(prompt);
  if (!sentence) {
    throw new Error("Empty response from Ollama");
  }
  return sentence;
}

/**
 * Retry‑wrapped version that returns `null` after two failures instead of
 * propagating the error – exactly the same contract the original code used
 * so the game can fall back to HUMAN rounds gracefully.
 */
export async function generateAiSentenceWithRetry(
  topic: string,
  humanSentence: string,
  challenge = "Write naturally"
): Promise<string | null> {
  try {
    return await generateAiSentence(topic, humanSentence, challenge);
  } catch (firstError) {
    console.error("[ollama] first attempt failed:", firstError);
    try {
      return await generateAiSentence(topic, humanSentence, challenge);
    } catch (secondError) {
      console.error("[ollama] retry failed:", secondError);
      return null;
    }
  }
}
