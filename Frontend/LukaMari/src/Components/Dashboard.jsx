import { useEffect, useState } from "react";
import { getImages, deleteImage } from "../utils/indexedDB";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadImages();
  }, []);

  async function loadImages() {
    const data = await getImages();
    setImages(Array.isArray(data) ? data : []);
  }

  async function handleDelete(id) {
    await deleteImage(id);
    loadImages();
  }

  return (
    <div className="p-4 text-white">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-blue-400">
          Dashboard (Storage)
        </h1>

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate("/")}
          className="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          ← Back to Encode
        </button>
      </div>

      {images.length === 0 ? (
        <p className="text-gray-400">No saved images found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {images.map((item) => (
            <div
              key={item.id}
              className="bg-[#1f222b] border border-gray-700 rounded-xl p-3"
            >
              {/* IMAGE */}
              <img
                src={item.image}
                alt="saved"
                className="w-full rounded-lg cursor-pointer hover:opacity-80"
                onClick={() => setPreview(item.image)}
              />

              {/* TIME */}
              <p className="text-xs text-gray-400 mt-2">
                Saved: {new Date(item.createdAt).toLocaleString()}
              </p>

              {/* DELETE */}
              <button
                onClick={() => handleDelete(item.id)}
                className="mt-2 bg-red-600 px-3 py-1 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* IMAGE PREVIEW MODAL */}
      {preview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center"
          onClick={() => setPreview(null)}
        >
          <img
            src={preview}
            className="max-w-[90%] max-h-[90%] rounded-xl border"
          />
        </div>
      )}
    </div>
  );
}