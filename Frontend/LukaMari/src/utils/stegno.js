// utils/stegno.js

const END_MARKER = "|||END|||";

export function encodeMessageInPixels(imageData, message) {
  const pixels = imageData.data;

  // Add delimiter
  const fullMessage = message + END_MARKER;

  // Convert message → binary
  const binary = fullMessage
    .split("")
    .map(char => char.charCodeAt(0).toString(2).padStart(8, "0"))
    .join("");

  let bitIndex = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    if (bitIndex >= binary.length) break;

    // modify RED channel only
    pixels[i] = (pixels[i] & 0b11111110) | parseInt(binary[bitIndex]);

    bitIndex++;
  }

  return imageData;
}

export function decodeMessageFromPixels(imageData) {
  const pixels = imageData.data;
  let binary = "";

  // Read RED channel
  for (let i = 0; i < pixels.length; i += 4) {
    binary += (pixels[i] & 1).toString();
  }

  let message = "";

  for (let i = 0; i < binary.length; i += 8) {
    const byte = binary.slice(i, i + 8);
    if (byte.length < 8) break;

    const char = String.fromCharCode(parseInt(byte, 2));
    message += char;

    // STOP when marker found
    if (message.includes(END_MARKER)) {
      return message.replace(END_MARKER, "");
    }
  }

  return "";
}