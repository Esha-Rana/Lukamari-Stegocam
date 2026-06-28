import { useEffect, useState } from "react";
import { getImages } from "../utils/indexedDB";

export default function ImageGallery({ onSelect }) {
  const [images, setImages] = useState([]);

  useEffect(() => {
    loadImages();
  }, []);

  async function loadImages() {
    const data = await getImages();
    setImages(data.reverse()); // latest first
  }

  return (
    <div className="mt-4">
      <h2 className="text-white font-semibold mb-2">Saved Images</h2>

      <div className="grid grid-cols-3 gap-3">
        {images.map((img) => (
          <div
            key={img.id}
            className="border border-white/10 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition"
            onClick={() => onSelect(img)}
          >
            <img
              src={img.image}
              alt="saved"
              className="w-full h-24 object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}