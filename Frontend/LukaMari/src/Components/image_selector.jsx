import '../index.css'

export default function ImageSelector({ onImageSelect }) {

  function ImageHandler(event) {
    const file = event.target.files[0]  
    if (!file) return  
    
    if (onImageSelect) {
      onImageSelect(file)
    }
  }

  return (
    <div className='flex justify-center items-center'>
      <div className='bg-gray-300 p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4'>
        <p className='text-black-400 text-xs'>Select an image from your device.</p>
        <input
          type='file'
          accept="image/*"
          onChange={ImageHandler}
          className='
            text-white
            file:mr-4
            file:py-2
            file:px-4
            file:rounded-lg
            file:border-0
            file:font-semibold
            file:bg-gray-500
            file:text-white
            hover:file:bg-green-700
            cursor-pointer
          '
        />
      </div>
    </div>
  )
}