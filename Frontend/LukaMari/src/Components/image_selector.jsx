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
    <div className="bg-[#2a2d3a] rounded-2xl p-6 flex flex-col items-center gap-4">

  <p className="text-gray-300 font-medium">
     Select an image from your device
  </p>

  <label
    className="cursor-pointer bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-semibold transition"
  >
    📂 Choose Image

    <input
      type="file"
      hidden
      accept="image/*"
      onChange={(e)=>onImageSelect(e.target.files[0])}
    />

  </label>

</div>
  )
}