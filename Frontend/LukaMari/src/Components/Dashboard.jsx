import { useEffect, useState } from "react";
import { getImages, deleteImage } from "../utils/indexedDB";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState(null);
  const [storageSize, setStorageSize] = useState("0.00");

  const navigate = useNavigate();

  useEffect(() => {
    loadImages();
  }, []);

  async function loadImages() {
    const data = await getImages();

    const imgs = Array.isArray(data) ? data : [];

    setImages(imgs);

    let total = 0;

    imgs.forEach((img) => {
      total += img.image.length;
    });

    setStorageSize((total / 1024 / 1024).toFixed(2));
  }

  async function handleDelete(id) {
    await deleteImage(id);
    loadImages();
  }

  return (
    <div className="min-h-screen bg-[#16171d] text-white p-6">

      {/* HEADER */}

      <div className="flex justify-between items-center mb-8">

        <div>

          <h1 className="text-2xl sm:text-2xl md:text-3xl xl:text-3xl font-bold text-blue-400">
             Dashboard
          </h1>

          <p className="text-gray-400 mt-1 text-sm sm:text-sm md:text-base xl:text-base">
            Manage your encoded images securely.
          </p>

        </div>

        <button
          onClick={() => navigate("/")}
          className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-xl transition text-sm sm:text-sm md:text-base xl:text-base"
        >
          ← Back to Encode
        </button>

      </div>

      {/* STATS */}

      <div className="grid grid-cols-2 gap-5 mb-8">

        <div className="bg-[#1f222b] rounded-2xl border border-gray-700 p-6 shadow-lg">

          <p className="text-gray-400 text-sm sm:text-sm md:text-base xl:text-base">
             Images Stored
          </p>

          <h2 className="text-3xl sm:text-3xl md:text-4xl xl:text-4xl font-bold text-green-400 mt-2">
            {images.length}
          </h2>

        </div>

        <div className="bg-[#1f222b] rounded-2xl border border-gray-700 p-6 shadow-lg">

          <p className="text-gray-400 text-sm sm:text-sm md:text-base xl:text-base">
             Storage Used
          </p>

          <h2 className="text-3xl sm:text-3xl md:text-4xl xl:text-4xl font-bold text-blue-400 mt-2">
            {storageSize} MB
          </h2>

        </div>

      </div>

      {/* TITLE */}

      <h2 className="text-sm sm:text-sm md:text-2xl xl:text-2xl font-semibold mb-5">
         Saved Images
      </h2>

      {images.length === 0 ? (

        <div className="bg-[#1f222b] rounded-2xl border border-gray-700 p-10 text-center">

          <p className="text-gray-400 text-sm sm:text-sm md:text-lg xl:text-lg">
            No saved images found.
          </p>

        </div>

      ) : (

        <div className="grid md:grid-cols-2 gap-6">

          {images.map((item) => (

            <div
              key={item.id}
              className="bg-[#1f222b] border border-gray-700 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition"
            >

              <img
                src={item.image}
                alt="Saved"
                className="w-full h-56 object-cover cursor-pointer hover:scale-105 transition duration-300"
                onClick={() => setPreview(item.image)}
              />

              <div className="p-4">

                <div className="space-y-2">

                  <p className="text-gray-300">

                    📅 {new Date(item.createdAt).toLocaleDateString()}

                  </p>

                  <p className="text-gray-400 text-sm">

                    🕒 {new Date(item.createdAt).toLocaleTimeString()}

                  </p>

                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="mt-5 w-full bg-red-600 hover:bg-red-700 py-2 rounded-xl transition"
                >
                  🗑 Delete Image
                </button>

              </div>

            </div>

          ))}

        </div>

      )}

      {/* IMAGE PREVIEW */}

      {preview && (

        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setPreview(null)}
        >

          <img
            src={preview}
            alt="Preview"
            className="max-w-[90%] max-h-[90%] rounded-2xl border-2 border-white"
          />

        </div>

      )}

    </div>
  );
}