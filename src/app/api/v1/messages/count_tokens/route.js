import { countInputTokens } from "open-sse/utils/tokenCounter.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*"
};

/**
 * Handle CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, { headers: CORS_HEADERS });
}

/**
 * POST /v1/messages/count_tokens — Real token count with format-aware tokenizer.
 * Supports Claude format and OpenAI format messages.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS }
    });
  }

  const { input_tokens, detected_format } = countInputTokens(body);

  return new Response(JSON.stringify({
    input_tokens,
    detected_format
  }), {
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  });
}
