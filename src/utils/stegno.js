

function textToBits(text) {
  let bits = ''

  for (let i = 0; i < text.length; i++) {

    // charCodeAt gives the ASCII number of the character
    // Example: 'H' = 72
    const charCode = text.charCodeAt(i)

    // toString(2) converts number to binary string
    // padStart(8, '0') makes sure it's always 8 digits
    // Example: 72 → "1001000" → "01001000"
    const binary = charCode.toString(2).padStart(8, '0')

    bits += binary
  }

  return bits

}


function bitsToText(bits) {
  let text = ''

  // Process 8 bits at a time (one character per 8 bits)
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    const byte = bits.slice(i, i + 8)

    // 00000000 = null character = our end marker
    // When we see this, the message is over- message terminator yeslai bhanincha
    if (byte === '00000000') break

    // parseInt(byte, 2) converts binary string to number
    // String.fromCharCode converts number to character
    text += String.fromCharCode(parseInt(byte, 2))
  }

  return text
}

// imageData = the pixel array from Canvas API
// message   = the text string to hide ?? yo ajjai bujh 

export function encodeMessageInPixels(imageData, message) {
  const pixels = imageData.data

  // Convert message to bits + add end marker
  // End marker = 16 zeros = tells decoder "message ends here"
  const bits = textToBits(message) + '0000000000000000'

  // Check if image has enough pixels to hold the message
  // Each pixel holds 1 bit, total pixels = pixels.length / 4
  const totalPixels = Math.floor(pixels.length / 4)

  if (bits.length > totalPixels) {
    throw new Error(
      `Message too long. Max ${totalPixels} bits, message needs ${bits.length} bits.`
    )
  }

  let bitIndex = 0  // tracks which bit of the message we're on

  // Loop through every pixel (step by 4 because R,G,B,A)
  for (let i = 0; i < pixels.length; i += 4) {

    if (bitIndex >= bits.length) break

    const bit = parseInt(bits[bitIndex])  

    
    pixels[i] = (pixels[i] & 0b11111110) | bit

    pixels[i + 1] = pixels[i]
    pixels[i + 2] = pixels[i]


    bitIndex++
  }

  return imageData
}



export function decodeMessageFromPixels(imageData) {
  const pixels = imageData.data
  let bits = ''

  for (let i = 0; i < pixels.length; i += 4) {

   
    const bit = (pixels[i] & 1).toString()
    bits += bit

    if (bits.length % 8 === 0 && bits.length >= 16) {
      const lastTwoBits = bits.slice(-16)
      if (lastTwoBits === '0000000000000000') break
    }
  }

  return bitsToText(bits)
}