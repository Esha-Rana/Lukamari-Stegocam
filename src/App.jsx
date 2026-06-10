import { encryptMessage } from "./utils/crypto";
import { decryptMessage } from "./utils/crypto";
import { Routes, Route, Link } from 'react-router-dom'
import './index.css'
import ImageSelector from './Components/image_selector.jsx'
import { useState } from 'react'

import { loadImageToCanvas, convertToGrayscale, exportCanvasAsPNG, downloadBlob } from './utils/canvas'
import { encodeMessageInPixels, decodeMessageFromPixels } from './utils/stegno'

function EncodePage() {


  const [imageFile, setImageFile] = useState(null)   // the image user uploaded
  const [message, setMessage]     = useState('')      // the secret message typed
  const [password, setPassword]   = useState('')      // the password typed
  const [status, setStatus]       = useState('')      // progress text shown to user
  const [loading, setLoading]     = useState(false)   // true while processing


  async function handleEncode() {

    if (!imageFile) {
      setStatus(' Please select an image first.')
      return
    }
    if (!message.trim()) {
      setStatus(' Please enter a secret message.')
      return
    }
    if (!password.trim()) {
      setStatus(' Please enter a password.')
      return
    }

    try {
      setLoading(true)


      setStatus('Step 1/3 — Loading image into canvas...')
      const { canvas, ctx, imageData } = await loadImageToCanvas(imageFile)

      setStatus('Step 2/3 — Converting to grayscale...')
      const grayscaleData = convertToGrayscale(imageData)

      setStatus('Step 3/3 — Hiding message in image pixels...')
      const encrypted = await encryptMessage(message, password);

    const encodedData = encodeMessageInPixels(
    grayscaleData,
    JSON.stringify(encrypted)
    );


      const blob = await exportCanvasAsPNG(canvas, ctx, encodedData)

    
      downloadBlob(blob, 'lukamari_encoded.png')

      setStatus(' Done! Check your Downloads folder for lukamari_encoded.png')

    } catch (error) {
     
      setStatus('Error: ' + error.message)

    } finally {
      setLoading(false)
    }
  }


  
  return (
    <div className='flex flex-col mb-32'>

      <div className='flex flex-col justify-center items-center'>
        <h1 className='text-3xl mt-5 text-purple-500 font-semibold'>Encode (Sender)</h1>
        <h2 className='text-gray-400'>Hide your secret message in an image.</h2>
      </div>

 
      <div className='w-full self-start flex flex-col'>
        <h3 className='font-semibold text-left'>1. Select Image</h3>
        <ImageSelector onImageSelect={setImageFile} />

        {imageFile && (
          <p className='text-sm text-green-600 mt-2 text-center'>
            ✅ Selected: {imageFile.name}
          </p>
        )}
      </div>

  
      <div className='py-5 flex flex-col'>
        <h2 className='font-semibold'>2. Enter a Secret Message.</h2>
        <textarea
          placeholder='ENTER THE SECRET, NO ONE BUT THE PERSON YOU CHOSE CAN READ IT'
          rows={1}
          onChange={e => setMessage(e.target.value)}
          onInput={(e) => {
            e.target.style.height = "auto"
            e.target.style.height = e.target.scrollHeight + "px"
          }}
          className='
            w-full overflow-hidden resize-none border-2
            border-gray-400 text-black p-4 rounded-2xl outline-none
            focus:ring-2 focus:ring-purple-400 placeholder:text-gray-400
          '
        />
      </div>

      <div className='flex flex-col'>
        <h2 className='font-semibold'>3. Enter the Password</h2>
        <input
          type='password'
          placeholder='*********'
          onChange={e => setPassword(e.target.value)}
          className='
            w-full border-2 border-gray-400 text-black p-1
            rounded-xl outline-none focus:ring-2 focus:ring-purple-400
            placeholder:text-gray-400
          '
        />
      </div>

  
      <div className='flex flex-col'>
        <h2 className='font-semibold py-1.5'>4. Options</h2>
        <label className='p-1 font-xs'>
          <input type='checkbox' />
          Use Smart pixel selection (ML)
        </label>
      </div>

   
      <div className='flex flex-col'>
        <button
          onClick={handleEncode}
          disabled={loading}
          className='
            bg-purple-300 text-white hover:bg-green-300
            rounded-xl p-2 mt-2 disabled:opacity-50
          '>
          {loading ? 'Processing...' : 'Encrypt and Hide Message'}
        </button>
      </div>

    
      {status && (
        <p className='mt-3 text-sm text-center text-gray-700'>{status}</p>
      )}

    </div>
  )
}


function DecodePage() {

  const [imageFile, setImageFile] = useState(null)
  const [password, setPassword]   = useState('')
  const [result, setResult]       = useState('')   // the extracted message
  const [status, setStatus]       = useState('')
  const [loading, setLoading]     = useState(false)

  async function handleDecode() {

    if (!imageFile) {
      setStatus(' Please upload an encoded image.')
      return
    }
    if (!password.trim()) {
      setStatus(' Please enter the password.')
      return
    }

    try {
      setLoading(true)
      setResult('')  // clear any previous result


      setStatus('Step 1/2 — Loading image...')
      const { imageData } = await loadImageToCanvas(imageFile)

  
      setStatus('Step 2/2 — Extracting hidden message...')
      const extracted = decodeMessageFromPixels(imageData)

    // convert extracted string → encrypted object
    const data = JSON.parse(extracted)

    // 🔓 decrypt using password
    const result = await decryptMessage(data, password)

    // show final result
    setResult(result)

setStatus(' Message decrypted successfully!')

    } catch (error) {
      setStatus(' Error: ' + error.message)

    } finally {
      setLoading(false)
    }
  }


  function handleCopy() {
    navigator.clipboard.writeText(result)
      .then(() => alert('Copied to clipboard!'))
      .catch(() => alert('Copy failed.'))
  }

  return (
    <div className='mb-32'>

      <div className='flex flex-col justify-center items-center'>
        <h1 className='text-green-600 font-semibold text-3xl mt-5'>
          Decode Page (Receiver)
        </h1>
        <p className='text-gray-400'>Extract hidden message from an image.</p>
      </div>

      <div className='flex flex-col justify-center'>
        <h1 className='font-semibold'>1. Upload Stego Image.</h1>
        <ImageSelector onImageSelect={setImageFile} />

        {imageFile && (
          <p className='text-sm text-green-600 mt-2 text-center'>
             Selected: {imageFile.name}
          </p>
        )}
      </div>

      <div className='flex flex-col justify-center'>
        <h1 className='font-semibold mt-2'>2. Enter Password.</h1>
        <input
          type='password'
          placeholder='*********'
          onChange={e => setPassword(e.target.value)}
          className='
            w-full border-2 border-gray-400 text-black p-1
            rounded-xl outline-none focus:ring-2 focus:ring-purple-400
            placeholder:text-gray-400
          '
        />
      </div>


      <div className='flex flex-col'>
        <h1 className='font-semibold'>3. Extract and Decrypt</h1>
        <button
          onClick={handleDecode}
          disabled={loading}
          className='
            bg-green-300 text-white hover:bg-purple-300
            rounded-xl p-2 mt-2 disabled:opacity-50
          '>
          {loading ? 'Extracting...' : 'Extract and Decrypt Message'}
        </button>
      </div>

 
      {status && (
        <p className='mt-2 text-sm text-center text-gray-700'>{status}</p>
      )}


      {result && (
        <div className='flex flex-col bg-gray-100 rounded-xl mt-4 shadow-xl gap-2'>
          <h1 className='font-semibold text-green-600 p-2 tracking-wide'>
            Decrypted Message
          </h1>
          <textarea
            readOnly
            value={result}
            className='
              w-full border-2 rounded-xl border-green-300 outline-none
              focus:ring-2 focus:ring-green-400 min-h-20 bg-green-50 p-2
            '
          />
          <button
            onClick={handleCopy}
            className='
              mt-3 bg-green-50 text-green-500 border-2 outline-none
              border-green-200 rounded-xl hover:ring-2 hover:ring-green-400
              p-1.5 mb-2 font-semibold text-s
            '>
            Copy to Clipboard
          </button>
        </div>
      )}

    </div>
  )
}


function App() {
  return (
    <div className='flex justify-center items-center'>


      <div className='flex fixed justify-center bottom-0 pb-4'>
        <nav className='flex justify-around items-center bg-gray-400 w-full gap-30 bottom-0 px-8 py-4 rounded-2xl shadow-lg'>
          <Link to='/' className='bg-purple-200 rounded-2xl p-3 hover:bg-purple-400 transition delay-100 font-semibold'>
            Encode
          </Link>
          <Link to='/decode' className='bg-green-200 rounded-2xl p-3 hover:bg-green-400 transition delay-100 font-semibold'>
            Decode
          </Link>
        </nav>
      </div>

      <Routes>
        <Route path='/' element={<EncodePage />} />
        <Route path='/decode' element={<DecodePage />} />
        <Route path='*' element={<h1>404 not found</h1>} />
      </Routes>

    </div>
  )
}

export default App