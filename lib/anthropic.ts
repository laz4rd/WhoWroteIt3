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
const ollamaBaseUrl: string = (
  // Allow an explicit override, otherwise fall back to the default local URL
  process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"
);
const ollamaModel: string = process.env.OLLAMA_MODEL ?? "gemma4:cloud";

// ──────────────────────────────────────────────────────────────────────
// 2️⃣  Helper – send a prompt to Ollama’s /api/generate endpoint
// ──────────────────────────────────────────────────────────────────────
async function ollamaGenerate(prompt: string): Promise<string> {
  const payload = {
    model: ollamaModel,
    prompt,
    // Keep the generation deterministic for short sentences;
    // you can tweak temperature / max_tokens via extra env vars if desired.
    options: {
      // temperature: Number(process.env.OLLAMA_TEMPERATURE) ?? 0.0,
      max_tokens: Number(process.env.OLLAMA_MAX_TOKENS) ?? 60,
    },
    // non‑streaming – we want the whole answer in one response
    stream: false,
  };

  const response = await fetch(`${ollamaBaseUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(
      `Ollama request failed (${response.status}): ${txt}`
    );
  }

  const json = (await response.json()) as { response: string };
  // Ollama returns { response: "..." }
  const raw = json?.response ?? "";
  // Strip leading/trailing quotes some models add automatically
  return raw.replace(/^["']|["']$/g, "").trim();
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
