const trimEndpoint = (url) => {
  if (typeof url !== "string") return "";
  return url.trim().replace(/\/+$/, "");
};

export function toOpenAIBaseUrl(url) {
  const endpoint = trimEndpoint(url);
  if (!endpoint) return "";
  return /\/v1$/i.test(endpoint) ? endpoint : `${endpoint}/v1`;
}

export function toAnthropicBaseUrl(url) {
  const endpoint = trimEndpoint(url);
  if (!endpoint) return "";
  return endpoint.replace(/\/v1$/i, "").replace(/\/+$/, "");
}
