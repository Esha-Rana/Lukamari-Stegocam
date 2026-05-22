import {Routes, Route} from 'react-router-dom'
import './index.css'
import './Components/image_selector.jsx'
import ImageSelector from './Components/image_selector.jsx';
import { useState } from 'react';

function EncodePage(){
return(
    <div className='flex flex-col'>

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
return <h1>This is the Decode page.</h1>
}

function App() {
  return (
   <div className='flex justify-center items-center'>
    <EncodePage/>
   </div>
  )
}

export default App
