export function loadImageToCanvas(file) {
  return new Promise((resolve) => {

    // FileReader reads the file from the user's computer
    const reader = new FileReader()

    reader.onload = (e) => {

      // Create an Image element to hold the loaded file
      const img = new Image()

      img.onload = () => {

        // Create an invisible canvas in memory (not shown on screen)
        const canvas = document.createElement('canvas')

        canvas.width = img.width
        canvas.height = img.height

        // Get the 2D drawing context — this is what lets us
        // draw things and read pixel data
        const ctx = canvas.getContext('2d')

        // Draw the image onto the canvas
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        resolve({ canvas, ctx, imageData })
      }

      img.src = e.target.result
    }

    // This actually triggers reader.onload above
    // readAsDataURL converts the file to a Base64 string
    reader.readAsDataURL(file)
  })
}



export function convertToGrayscale(imageData) {

  // imageData.data is a Uint8ClampedArray
  // "Clamped" means values are always kept between 0-255
  const pixels = imageData.data

  // Loop through every pixel
  // Each pixel = 4 array positions (R, G, B, A)
  // So we jump by 4 each time
  for (let i = 0; i < pixels.length; i += 4) {

    const r = pixels[i]       // Red value of this pixel
    const g = pixels[i + 1]   // Green value of this pixel
    const b = pixels[i + 2]   // Blue value of this pixel
    // pixels[i + 3] is Alpha — we never touch this

    // Calculate the gray value using the luminance formula
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)

    // Set R, G, B all to the same gray value
    // This makes the pixel appear gray/black/white
    pixels[i]     = gray   // Red
    pixels[i + 1] = gray   // Green
    pixels[i + 2] = gray   // Blue
    // Alpha stays the same
  }

  // Return the modified imageData
  return imageData
}


// -------------------------------------------------------
// FUNCTION 3: exportCanvasAsPNG
// -------------------------------------------------------
// WHY: After modifying pixels, we need to get the image
// back out as a file the user can download.
// We MUST use PNG — it's lossless (saves every pixel exactly).
// JPEG compresses and destroys the hidden LSB data.
//
// HOW IT WORKS:
// Put modified pixels back on canvas → canvas converts to
// PNG → gives us a Blob (raw binary file data in memory)
// -------------------------------------------------------

export function exportCanvasAsPNG(canvas, ctx, imageData) {
  return new Promise((resolve) => {

    // Put the modified pixel array back onto the canvas
    // This overwrites what was drawn before with our new pixels
    ctx.putImageData(imageData, 0, 0)

    // toBlob converts the canvas content to a file
    // A Blob is like a file sitting in browser memory
    // 'image/png' tells it what format to use
    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/png')
  })
}


// -------------------------------------------------------
// FUNCTION 4: downloadBlob
// -------------------------------------------------------
// WHY: We have a Blob (file in memory) but the user needs
// to actually save it to their computer.
//
// HOW IT WORKS:
// Create a temporary URL pointing to the Blob
// Create an invisible <a> link pointing to that URL
// Programmatically click it → browser triggers download
// Clean up the temporary URL to free memory
// -------------------------------------------------------

export function downloadBlob(blob, filename = 'lukamari_encoded.png') {

  // createObjectURL makes a temporary URL like:
  // blob:http://localhost:5173/3f8a92bc-1234-...
  // This URL only exists in this browser tab's memory
  const url = URL.createObjectURL(blob)

  // Create an invisible download link
  const a = document.createElement('a')
  a.href = url
  a.download = filename   // this becomes the filename in Downloads folder

  // Click it — triggers the browser's download
  a.click()

  // Clean up — remove the temporary URL from memory
  // If you don't do this, it leaks memory
  URL.revokeObjectURL(url)
}