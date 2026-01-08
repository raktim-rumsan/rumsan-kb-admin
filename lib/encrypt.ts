export async function encryptWithPublicKey(
  publicKeyPem: string,
  message: string
) {
  // Helper: Convert PEM to ArrayBuffer
  function pemToArrayBuffer(pem: string) {
    const b64 = pem
      .replace(/-----BEGIN PUBLIC KEY-----/, "")
      .replace(/-----END PUBLIC KEY-----/, "")
      .replace(/\s/g, "");
    const binary = atob(b64);
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
    pemToArrayBuffer(publicKeyPem),
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
