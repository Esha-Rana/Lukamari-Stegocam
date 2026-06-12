function toBytes(str) {
  return new TextEncoder().encode(str);
}

function fromBytes(bytes) {
  return new TextDecoder().decode(bytes);
}

function toBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    toBytes(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(message, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await getKey(password, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    toBytes(message)
  );

  return {
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(encrypted),
  };
}

export async function decryptMessage(data, password) {
  try {
    const salt = fromBase64(data.salt);
    const iv = fromBase64(data.iv);
    const ciphertext = fromBase64(data.ciphertext);

    const key = await getKey(password, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    return fromBytes(decrypted);
  } catch (e) {
    return "❌ Wrong password";
  }
}
