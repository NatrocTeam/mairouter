"use server";

import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

const getConfigPath = () =>
  path.join(os.homedir(), ".zcode", "v2", "config.json");

const readJson = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch (_error) {
    return null;
  }
};

const checkInstalled = async () => {
  try {
    await fs.access(getConfigPath());
    return true;
  } catch {
    return false;
  }
};

const findMairouterProvider = (config) => {
  if (!config?.provider) return null;
  for (const [id, provider] of Object.entries(config.provider)) {
    if (provider.source === "custom") {
      const baseURL = provider.options?.baseURL || "";
      if (
        baseURL.includes("localhost") ||
        baseURL.includes("127.0.0.1") ||
        baseURL.includes("mairouter") ||
        baseURL.includes("suryacagur")
      ) {
        return { id, ...provider };
      }
    }
  }
  return null;
};

export async function GET() {
  try {
    const installed = await checkInstalled();
    if (!installed) {
      return NextResponse.json({
        installed: false,
        settings: null,
        message: "ZCode is not installed",
      });
    }
    const config = await readJson(getConfigPath());
    const mairouterProvider = findMairouterProvider(config);

    return NextResponse.json({
      installed: true,
      settings: {
        providerCount: config?.provider
          ? Object.keys(config.provider).length
          : 0,
        mairouterProvider: mairouterProvider
          ? {
              id: mairouterProvider.id,
              name: mairouterProvider.name,
              baseURL: mairouterProvider.options?.baseURL,
              model: mairouterProvider.models
                ? Object.keys(mairouterProvider.models)[0]
                : null,
            }
          : null,
      },
      hasmairouter: !!mairouterProvider,
      configPath: getConfigPath(),
    });
  } catch (error) {
    console.log("Error checking ZCode settings:", error);
    return NextResponse.json(
      { error: "Failed to check ZCode settings" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { baseUrl, apiKey, model } = await request.json();
    if (!baseUrl || !apiKey || !model) {
      return NextResponse.json(
        { error: "baseUrl, apiKey and model are required" },
        { status: 400 },
      );
    }

    // Ensure config directory exists
    const configDir = path.dirname(getConfigPath());
    await fs.mkdir(configDir, { recursive: true });

    const config = (await readJson(getConfigPath())) || { provider: {} };

    // Remove any existing mairouter provider entry
    const existing = findMairouterProvider(config);
    if (existing) {
      delete config.provider[existing.id];
    }

    // Normalize base URL — ZCode uses Anthropic format, so no /v1 suffix needed
    const normalizedBaseUrl = baseUrl.endsWith("/v1")
      ? baseUrl.slice(0, -3)
      : baseUrl;

    // Generate a UUID for the new provider (matches ZCode's own UUID generation)
    const providerId = crypto.randomUUID();

    config.provider[providerId] = {
      name: "mairouter",
      kind: "anthropic",
      options: {
        apiKey: apiKey,
        baseURL: normalizedBaseUrl,
        apiKeyRequired: true,
      },
      source: "custom",
      models: {
        [model]: {
          limit: {
            context: 256000,
            output: 128000,
          },
          modalities: {
            input: ["text"],
            output: ["text"],
          },
        },
      },
    };

    await fs.writeFile(getConfigPath(), JSON.stringify(config, null, 2));

    return NextResponse.json({
      success: true,
      message: "ZCode provider added successfully!",
      configPath: getConfigPath(),
      providerId,
    });
  } catch (error) {
    console.log("Error updating ZCode settings:", error);
    return NextResponse.json(
      { error: "Failed to update ZCode settings" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const config = await readJson(getConfigPath());
    if (!config) {
      return NextResponse.json({
        success: true,
        message: "No config file to update",
      });
    }

    const existing = findMairouterProvider(config);
    if (existing) {
      delete config.provider[existing.id];
      await fs.writeFile(getConfigPath(), JSON.stringify(config, null, 2));
    }

    return NextResponse.json({
      success: true,
      message: existing
        ? "Mai Router provider removed from ZCode"
        : "No Mai Router provider found in ZCode",
    });
  } catch (error) {
    console.log("Error resetting ZCode settings:", error);
    return NextResponse.json(
      { error: "Failed to reset ZCode settings" },
      { status: 500 },
    );
  }
}
