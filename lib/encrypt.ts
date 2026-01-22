export async function encryptWithPublicKey(
  publicKeyValue: string,
  message: string
) {
  // Normalize env value (handles PEM, base64-of-PEM, or bare key body)
  function extractKeyBase64(input: string) {
    const trimmed = (input ?? "").trim();

    // Case 1: PEM with headers
    if (trimmed.includes("BEGIN PUBLIC KEY")) {
      return trimmed
        .replace(/-----BEGIN PUBLIC KEY-----/g, "")
        .replace(/-----END PUBLIC KEY-----/g, "")
        .replace(/\s+/g, "");
    }

    // Case 2: Base64 of PEM (starts with LS0t...) or decodes to PEM
    try {
      const decoded = atob(trimmed);
      if (decoded.includes("BEGIN PUBLIC KEY")) {
        return decoded
          .replace(/-----BEGIN PUBLIC KEY-----/g, "")
          .replace(/-----END PUBLIC KEY-----/g, "")
          .replace(/\s+/g, "");
      }
    } catch (_err) {
      // fall through
    }

    // Case 3: Assume already the bare key body (base64 DER)
    return trimmed;
  }

  // Helper: Convert key body base64 to ArrayBuffer
  function pemToArrayBuffer(pemLike: string) {
    const b64 = extractKeyBase64(pemLike)
      .replace(/[^A-Za-z0-9+/=]/g, "")
      .trim();

    // pad base64 safely
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);

    const binary = atob(padded);
    const buffer = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
      view[i] = binary.charCodeAt(i);
    }
    return buffer;
  }

  // Import public key
  const key = await window.crypto.subtle.importKey(
    "spki", // SubjectPublicKeyInfo
    pemToArrayBuffer(publicKeyValue),
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false, // not extractable
    ["encrypt"]
  );

  // Encode message to Uint8Array
  const encodedMessage = new TextEncoder().encode(message);

  // Encrypt
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    key,
    encodedMessage
  );

  // Convert to Base64 for sending to backend
  const base64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
  return base64;
}
