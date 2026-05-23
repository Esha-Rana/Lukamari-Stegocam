import {Routes, Route, Link} from 'react-router-dom'
import './index.css'
import './Components/image_selector.jsx'
import ImageSelector from './Components/image_selector.jsx';
import { useState } from 'react';

function EncodePage(){
return(
    <div className='flex flex-col mb-32'>

    <div className='flex flex-col justify-center items-center'>
     <h1 className=' text-3xl mt-5 text-purple-500 font-semibold'>Encode(Sender)</h1>
     <h2 className=' text-1.5xl text-gray-400 '> Hide your secret message in an image. </h2> 
    </div>

    <div className='w-full self-start flex flex-col '> 
    <h3 className='font-semibold text-left'>1. Select Image
    </h3>

    <div>
    <ImageSelector></ImageSelector>
    </div></div>

    <div className='py-5 flex flex-col'>
    <h2 className='font-semibold'>2. Enter a Secret Message.</h2>
    <textarea   placeholder='RAHAHAH ENTER THE SECRET, NO ONE BUT PERSON YOU CHOSE CAN READ IT'
        rows={1}
        onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
        }}
        className='
            w-full
            overflow-hidden
            resize-none
            border-2
            border-gray-400
            bg-white-300
            text-black
            p-4
            rounded-2xl
            outline-none
            focus:ring-2
            focus:ring-purple-400
            placeholder:text-gray-400
        '/>
    </div>

    <div className='flex flex-col'>
      <h2 className='font-semibold '>3. Enter the Password</h2>
      <input type='password' placeholder='*********' className='
      w-full
            overflow-hidden
            resize-none
            border-2
            border-gray-400
            bg-white-200
            text-black
            p-1
            rounded-xl
            outline-none
            focus:ring-2
            focus:ring-purple-400
            placeholder:text-gray-400
            '/>
    </div>

    <div className='flex flex-col'>
      <h2 className='font-semibold py-1.5'> 4. Options</h2>
        <label className='p-1 font-xs'>
          <input type='checkbox'/>
        Use Smart pixel selection(ML)</label>
    </div>

        <div className='flex flex-col'>
          <button type='submit' className='
          bg-purple-300
          text-white
          hover:bg-green-300
          rounded-xl
          p-2
          mt-2
          '>
            Encrypt and Hide Message
            </button>
        </div>
    </div>
    
   );
}

function DecodePage(){
return (
  <div className='mb-32'>

    <div className='flex flex-col justify-center items-center '>
      <h1 className='text-green-600 font-semibold text-3xl mt-5'>
        Decode Page(Reciever)
        </h1>

        <p className='text-gray-400 text-1.5xl'>
          Extract Hidden message from an image.
          </p>

    </div>

    <div className='flex flex-col justify-center'>

      <h1 className='font-semibold'> 
        1. Upload Stego Image.
      </h1>
      <ImageSelector/>

    </div>
    <div className='flex flex-col justify-center'>
       <h1 className='font-semibold mt-2'> 
        2. Enter Password.
      </h1>

     <input type='password' placeholder='*********' className='
      w-full
            overflow-hidden
            resize-none
            border-2
            border-gray-400
            bg-white-200
            text-black
            p-1
            rounded-xl
            outline-none
            focus:ring-2
            focus:ring-purple-400
            placeholder:text-gray-400
            '/>
    </div>

    <div className='flex flex-col'>
      <h1 className='font-semibold'>3. Extract and Decrypt</h1>
          <button type='submit' className='
          bg-green-300
          text-white
          hover:bg-purple-300
          rounded-xl
          p-2
          mt-2
          '>
           Extract and Decrypt Message.
            </button>
    </div>
    <div className='flex flex-col bg-gray-100 rounded-xl mt-4 shadow-xl gap-2 '>
       <h1 className='font-semibold text-green-600 p-2 tracking-wide '>
        Decrypted Message
        </h1>
        <textarea 
        readOnly
        placeholder="Decrypted Message will appear here."
        className='
        w-full
        border-2
        rounded-xl
        border-green-300
        outline-none
        focus:ring-2
        focus:ring-green-400
        min-h-31.25
        bg-green-50
        '>
        </textarea>

        <button className='mt-3 
        bg-green-50
        text-green-500
        border-2
        outline-none
        border-green-200
        rounded-xl
        hover:ring-2
        hover:ring-green-400
        p-1.5
        mb-2
        font-semibold
        text-s
        '>
          Copy to Clipboard.
          </button>
        </div>
  </div>

);  
}

function App() {
  return (
   <div className='flex justify-center items-center'>
   <div className='flex fixed justify-center bottom-0 pb-4'>
    <nav className='flex 
    justify-around
     items-center
      bg-gray-400
        w-full 
        gap-30
        bottom-0 
        px-8
        py-4
        rounded-2xl
        shadow-lg'>
    
    <Link to='/' className='
     bg-purple-200
      rounded-2xl
      p-3
      hover:bg-purple-400
      transition
      delay-100
      font-semibold
      '>
      Encode
      </Link>

    <Link to='/decode' className='bg-green-200
     rounded-2xl
      p-3
      hover:bg-green-400
      transition
      delay-100
      font-semibold
      '>
        Decode
      </Link>

    </nav>
    </div>
    <Routes>
      <Route path='/' element={<EncodePage/>}/>
      <Route path='/decode' element={<DecodePage/>}/>
      <Route path='*' element={<h1>404 not found</h1>}/>
    </Routes>
   </div>
  )
}

export default App
