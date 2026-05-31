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
      const encodedData = encodeMessageInPixels(grayscaleData, message)


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
    <div className='flex flex-col mb-32 gap-3'>

      <div className='flex flex-col justify-center items-center'>
        <h1 className='text-3xl mt-5 text-purple-500 font-semibold'>Encode (Sender)</h1>
        <h2 className='text-gray-400'>Hide your secret message in an image.</h2>
      </div>

 
      <div className='w-full self-start flex flex-col'>
        <h3 className='font-semibold text-left flex items-center'>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 mr-1">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>

          1. Select Image
        </h3>
        <ImageSelector onImageSelect={setImageFile} />

        {imageFile && (
          <p className='text-sm text-green-600 mt-2 text-center'>
            ✅ Selected: {imageFile.name}
          </p>
        )}
      </div>

  
      <div className='py-5 flex flex-col'>
        <h2 className='font-semibold flex items-center'>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 mr-2 mt-0.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>

          2. Enter a Secret Message.</h2>
        <textarea
          placeholder='ENTER THE SECRET, NO ONE BUT THE PERSON YOU CHOSE CAN READ IT'
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
        <h2 className='font-semibold flex'>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 mr-2 mt-0.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>

          3. Enter the Password</h2>
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
        <h2 className='font-semibold py-1.5 flex '>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 mr-2 mt-0.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>

          4. Options</h2>
        <label className='p-1 font-xs'>
          <input type='checkbox' />
          Use Smart pixel selection (ML)
        </label>
      </div>

   
      <div className='flex flex-row gap-2'>
        <button
          onClick={handleEncode}
          disabled={loading}
          
          className='
            bg-purple-400 text-white hover:bg-green-400
            rounded-xl p-2  disabled:opacity-50 w-full
            flex justify-center items-center
          '>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 mr-2 mt-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>

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

      if (!extracted) {
        setStatus('No hidden message found in this image.')
        return
      }

     
      setResult(extracted)
      setStatus(' Message extracted successfully!')

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
    <div className='mb-32 flex flex-col gap-3'>

      <div className='flex flex-col justify-center items-center'>
        <h1 className='text-green-600 font-semibold text-3xl mt-5'>
          Decode(Receiver)
        </h1>
        <p className='text-gray-400'>Extract hidden message from an image.</p>
      </div>

      <div className='flex flex-col justify-center'>
        <h1 className='font-semibold flex '>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 mr-2 mt-1">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>

          1. Upload Stego Image.</h1>
        <ImageSelector onImageSelect={setImageFile} />

        {imageFile && (
          <p className='text-sm text-green-600 mt-2 text-center'>
             Selected: {imageFile.name}
          </p>
        )}
      </div>

      <div className='flex flex-col justify-center'>
        <h1 className='font-semibold mt-2 flex '>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 mr-2 mt-1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>

          2. Enter Password.</h1>
        <input
          type='password'
          placeholder='*********'
          onChange={e => setPassword(e.target.value)}
          className='
            mt-2 w-full border-2 border-gray-400 text-black p-1
            rounded-xl outline-none focus:ring-2 focus:ring-purple-400
            placeholder:text-gray-400
          '
        />
      </div>


      <div className='flex flex-col'>
        <h1 className='font-semibold flex'>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 mr-2 mt-1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
          </svg>

          3. Extract and Decrypt</h1>
        <button
          onClick={handleDecode}
          disabled={loading}
          className='
            bg-green-400 text-white hover:bg-purple-400
            rounded-xl p-2 mt-2 disabled:opacity-50
            flex justify-center items-center 
          '>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>

          {loading ? 'Extracting...' : 'Extract and Decrypt Message'}
        </button>
      </div>

 
      {status && (
        <p className='mt-2 text-sm text-center text-gray-700'>{status}</p>
      )}


      {result && (
        <div className='flex flex-col bg-gray-100 rounded-xl mt-4 shadow-xl gap-2'>
          <h1 className='font-semibold text-green-600 p-2 tracking-wide flex '>
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 mr-2 mt-1">
           <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>

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
        <nav className='flex justify-around items-center bg-gray-300 w-full gap-30 bottom-0 px-8 py-4 rounded-2xl shadow-lg'>
          <Link to='/' className='bg-purple-300 rounded-2xl p-3 hover:bg-purple-500 transition delay-60 font-semibold flex flex-col items-center'>
            
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            Encode
          </Link>
          <Link to='/decode' className='bg-green-200 rounded-2xl p-3 hover:bg-green-400 transition delay-60 font-semibold flex flex-col items-center'>
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 ">
           <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
           </svg>

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