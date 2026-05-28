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

    reader.readAsDataURL(file)
  })
}



export function convertToGrayscale(imageData) {

  
  const pixels = imageData.data

  
  for (let i = 0; i < pixels.length; i += 4) {

    const r = pixels[i]       
    const g = pixels[i + 1]   
    const b = pixels[i + 2]   
  

    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)

    
    pixels[i]     = gray   
    pixels[i + 1] = gray   
    pixels[i + 2] = gray   

  }


  return imageData
}



export function exportCanvasAsPNG(canvas, ctx, imageData) {
  return new Promise((resolve) => {

    
    ctx.putImageData(imageData, 0, 0)

  
    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/png')
  })
}




export function downloadBlob(blob, filename = 'lukamari_encoded.png') {

  
  const url = URL.createObjectURL(blob)

  
  const a = document.createElement('a')
  a.href = url
  a.download = filename   
  
  a.click()


  URL.revokeObjectURL(url)
}