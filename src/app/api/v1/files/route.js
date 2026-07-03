// Anthropic Files API proxy (retained for pass-through to Anthropic upstream).
// Anthropic's Files API requires an Anthropic API key; mairouter forwards the
// request to api.anthropic.com/v1/files when the upstream is Anthropic.
// Non-Anthropic providers (OpenAI, Gemini, Kiro) do not have an equivalent
// Files API — file uploads should use inline content blocks instead.

import { getProviderCredentials } from "@/sse/services/auth";
import { ANTHROPIC_COMPAT_BASE } from "open-sse/providers/shared.js";
import { HTTP_STATUS } from "open-sse/config/runtimeConfig.js";
import { errorResponse } from "open-sse/utils/error.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export async function OPTIONS() {
  return new Response(null, { headers: CORS_HEADERS });
}

/**
 * Proxy POST /v1/files to Anthropic's file upload API.
 * OpenAI/Gemini/Kiro clients should use inline content blocks instead.
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // Get Anthropic credentials
    const credentials = await getProviderCredentials("anthropic");
    if (!credentials) {
      return new Response(
        JSON.stringify({ error: "No Anthropic provider configured" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        },
      );
    }

    const apiKey = credentials.apiKey;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "No Anthropic API key" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // Forward to Anthropic's Files API
    const anthropicForm = new FormData();
    anthropicForm.append("file", file);

    const response = await fetch(`${ANTHROPIC_COMPAT_BASE}/files`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Anthropic-Version": "2023-06-01",
      },
      body: formData,
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (err) {
    return errorResponse(
      HTTP_STATUS.SERVER_ERROR,
      `File upload failed: ${err.message}`,
    );
  }
}
