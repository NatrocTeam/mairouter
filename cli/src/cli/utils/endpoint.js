const api = require("../api/client");

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m"
};

/**
 * Get endpoint URL based on tunnel status
 * @param {number} port - Local server port
 * @param {{withV1?: boolean}} options - Keep /v1 for OpenAI-compatible clients
 * @returns {Promise<{endpoint: string, tunnelEnabled: boolean}>}
 */
async function getEndpoint(port, { withV1 = true } = {}) {
  const result = await api.getTunnelStatus();
  const tunnelEnabled = result.success && result.data?.enabled === true;
  const publicUrl = result.success ? result.data?.publicUrl : "";

  const root = tunnelEnabled && publicUrl
    ? publicUrl
    : `http://localhost:${port}`;
  const endpoint = formatEndpoint(root, { withV1 });
  return { endpoint, tunnelEnabled };
}

function formatEndpoint(baseUrl, { withV1 = true } = {}) {
  if (typeof baseUrl !== "string") return "";
  const endpoint = baseUrl.trim().replace(/\/+$/, "");
  if (!endpoint) return "";
  if (withV1) {
    return /\/v1$/i.test(endpoint) ? endpoint : `${endpoint}/v1`;
  }
  return endpoint.replace(/\/v1$/i, "").replace(/\/+$/, "");
}

/**
 * Get endpoint with color formatting
 * @param {number} port - Local server port
 * @returns {Promise<string>} Colored endpoint string
 */
async function getEndpointColored(port) {
  const { endpoint, tunnelEnabled } = await getEndpoint(port);
  return tunnelEnabled ? `${COLORS.green}${endpoint}${COLORS.reset}` : endpoint;
}

module.exports = { getEndpoint, getEndpointColored, formatEndpoint };
