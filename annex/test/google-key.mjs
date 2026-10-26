// Prints a GOOGLE_SERVICE_ACCOUNT line with a throwaway key for .dev.vars, so the Search Console stand-in can be signed.
// Usage: node annex/test/google-key.mjs >> .dev.vars
import { generateKeyPairSync } from "node:crypto";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
console.log("GOOGLE_SERVICE_ACCOUNT='" + JSON.stringify({ type: "service_account", client_email: "annex-test@example.iam.gserviceaccount.com", private_key: privateKey }) + "'");
