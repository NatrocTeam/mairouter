const _path = require("path");
const _fs = require("fs");
const { MITM_DIR: _MITM_DIR } = require("../paths");
const { generateRootCA, loadRootCA, generateLeafCert } = require("./rootCA");

/**
 * Generate Root CA certificate (one-time setup)
 * This replaces the old static wildcard cert approach
 */
async function generateCert() {
  return await generateRootCA();
}

/**
 * Get certificate for a specific domain (dynamic generation)
 * Used by SNICallback in server.js
 */
function getCertForDomain(domain) {
  try {
    const rootCA = loadRootCA();
    const leafCert = generateLeafCert(domain, rootCA);
    return {
      key: leafCert.key,
      cert: leafCert.cert
    };
  } catch (error) {
    console.error(`Failed to generate cert for ${domain}:`, error.message);
    return null;
  }
}

module.exports = { generateCert, getCertForDomain };
