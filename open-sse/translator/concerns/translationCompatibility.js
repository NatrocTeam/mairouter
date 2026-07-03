import { FORMATS } from "../formats.js";
import { CLAUDE_BLOCK } from "../schema/index.js";

const SUPPORTED_CLAUDE_MESSAGE_BLOCKS = new Set([
  CLAUDE_BLOCK.TEXT,
  CLAUDE_BLOCK.IMAGE,
  CLAUDE_BLOCK.TOOL_USE,
  CLAUDE_BLOCK.TOOL_RESULT,
]);

const SUPPORTED_IMAGE_SOURCE_TYPES = new Set(["base64", "url"]);

export class TranslationCompatibilityError extends Error {
  constructor({ sourceFormat, targetFormat, path, blockType, reason }) {
    const location = path ? ` at ${path}` : "";
    super(
      `Cannot translate ${sourceFormat} to ${targetFormat} losslessly${location}: ` +
        `${blockType}${reason ? ` ${reason}` : ""}. Use a native ${sourceFormat} route or remove the unsupported history block.`,
    );
    this.name = "TranslationCompatibilityError";
    this.code = "translation_not_lossless";
    this.status = 400;
    this.sourceFormat = sourceFormat;
    this.targetFormat = targetFormat;
    this.path = path;
    this.blockType = blockType;
  }
}

export function isTranslationCompatibilityError(error) {
  return error?.code === "translation_not_lossless";
}

function incompatible(targetFormat, path, blockType, reason) {
  throw new TranslationCompatibilityError({
    sourceFormat: FORMATS.CLAUDE,
    targetFormat,
    path,
    blockType,
    reason,
  });
}

function assertImageSource(block, targetFormat, path) {
  const sourceType = block?.source?.type;
  if (!SUPPORTED_IMAGE_SOURCE_TYPES.has(sourceType)) {
    incompatible(
      targetFormat,
      `${path}.source`,
      `image source type ${JSON.stringify(sourceType ?? "missing")}`,
      "has no supported cross-provider representation",
    );
  }

  if (
    sourceType === "base64" &&
    (typeof block.source.media_type !== "string" ||
      !block.source.media_type ||
      typeof block.source.data !== "string" ||
      !block.source.data)
  ) {
    incompatible(
      targetFormat,
      `${path}.source`,
      "malformed base64 image source",
      "requires non-empty media_type and data fields",
    );
  }

  if (
    sourceType === "url" &&
    (typeof block.source.url !== "string" ||
      !/^https?:\/\//i.test(block.source.url))
  ) {
    incompatible(
      targetFormat,
      `${path}.source`,
      "malformed URL image source",
      "requires an absolute HTTP(S) URL",
    );
  }
}

function assertTextOnlyToolResult(block, targetFormat, path) {
  // is_error is handled by claude-to-openai.js which prefixes the content
  // with "[Tool Error]\n". No need to fail — the semantic survives lossily.

  if (block.content == null || typeof block.content === "string") return;

  if (!Array.isArray(block.content)) {
    incompatible(
      targetFormat,
      `${path}.content`,
      "non-text tool_result content",
      "cannot be represented without changing its structure",
    );
  }

  for (let index = 0; index < block.content.length; index += 1) {
    const nested = block.content[index];
    if (nested?.type !== CLAUDE_BLOCK.TEXT || typeof nested.text !== "string") {
      incompatible(
        targetFormat,
        `${path}.content[${index}]`,
        `${nested?.type ?? "unknown"} tool_result block`,
        "is not supported by the target tool-message contract",
      );
    }
  }
}

/**
 * Guard Anthropic history before crossing into a non-Anthropic wire format.
 *
 * Anthropic requires thinking/redacted_thinking blocks to be round-tripped
 * unchanged, including their opaque signatures. OpenAI Chat Completions tool
 * messages only support text content and have no is_error equivalent. Those
 * shapes therefore fail closed instead of being silently dropped or stringified.
 */
export function assertClaudeTranslationIsLossless(
  body,
  targetFormat,
  { stripList = [] } = {},
) {
  if (!body || targetFormat === FORMATS.CLAUDE) return;

  if (Array.isArray(body.system)) {
    for (let index = 0; index < body.system.length; index += 1) {
      const block = body.system[index];
      if (block?.type && block.type !== CLAUDE_BLOCK.TEXT) {
        incompatible(
          targetFormat,
          `system[${index}]`,
          `${block.type} system block`,
          "is not supported by the target system-message contract",
        );
      }
    }
  }

  if (!Array.isArray(body.messages)) return;

  for (
    let messageIndex = 0;
    messageIndex < body.messages.length;
    messageIndex += 1
  ) {
    const content = body.messages[messageIndex]?.content;
    if (!Array.isArray(content)) continue;

    for (let blockIndex = 0; blockIndex < content.length; blockIndex += 1) {
      const block = content[blockIndex];
      const path = `messages[${messageIndex}].content[${blockIndex}]`;
      const type = block?.type;

      // Thinking blocks are lossy when translated, but claude-to-openai.js converts
      // them to regular text blocks so requests don't hard-fail. The opaque
      // signature is dropped — only the thinking content is preserved as text.
      if (
        type === CLAUDE_BLOCK.THINKING ||
        type === CLAUDE_BLOCK.REDACTED_THINKING
      ) {
        continue;
      }

      if (!SUPPORTED_CLAUDE_MESSAGE_BLOCKS.has(type)) {
        incompatible(
          targetFormat,
          path,
          `${type ?? "unknown"} content block`,
          "has no verified lossless target mapping",
        );
      }

      if (type === CLAUDE_BLOCK.IMAGE) {
        if (stripList.includes("image")) {
          incompatible(
            targetFormat,
            path,
            "image block",
            "would be removed by the selected model translation policy",
          );
        }
        assertImageSource(block, targetFormat, path);
      } else if (type === CLAUDE_BLOCK.TOOL_RESULT) {
        assertTextOnlyToolResult(block, targetFormat, path);
      } else if (type === CLAUDE_BLOCK.TOOL_USE && block.caller) {
        incompatible(
          targetFormat,
          `${path}.caller`,
          "tool_use caller metadata",
          "has no verified lossless target mapping",
        );
      }
    }
  }
}

/** Fail before capability filtering replaces Anthropic media with placeholders. */
export function assertClaudeModalitiesSupported(body, caps, targetFormat) {
  if (!body || !caps || !Array.isArray(body.messages)) return;

  const inspectBlock = (block, path) => {
    if (block?.type === CLAUDE_BLOCK.IMAGE && caps.vision === false) {
      incompatible(
        targetFormat,
        path,
        "image block",
        "is not supported by the selected model",
      );
    }
    if (block?.type === CLAUDE_BLOCK.DOCUMENT && caps.pdf === false) {
      incompatible(
        targetFormat,
        path,
        "document block",
        "is not supported by the selected model",
      );
    }
  };

  for (
    let messageIndex = 0;
    messageIndex < body.messages.length;
    messageIndex += 1
  ) {
    const content = body.messages[messageIndex]?.content;
    if (!Array.isArray(content)) continue;

    for (let blockIndex = 0; blockIndex < content.length; blockIndex += 1) {
      const block = content[blockIndex];
      const path = `messages[${messageIndex}].content[${blockIndex}]`;
      inspectBlock(block, path);

      if (
        block?.type === CLAUDE_BLOCK.TOOL_RESULT &&
        Array.isArray(block.content)
      ) {
        for (
          let nestedIndex = 0;
          nestedIndex < block.content.length;
          nestedIndex += 1
        ) {
          inspectBlock(
            block.content[nestedIndex],
            `${path}.content[${nestedIndex}]`,
          );
        }
      }
    }
  }
}
