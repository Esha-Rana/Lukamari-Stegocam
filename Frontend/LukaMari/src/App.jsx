import Dashboard from "./Components/Dashboard.jsx";
import { encryptMessage, decryptMessage } from "./utils/crypto";
import { Routes, Route, Link } from "react-router-dom";
import "./index.css";
import ImageSelector from "./Components/image_selector.jsx";

import { useEffect, useState } from "react";

import { saveImage, getImages, deleteImage } from "./utils/indexedDB";

import LoginPage from "./Components/LoginPage.jsx";
import ForgotPassword from "./Components/ForgotPass.jsx";
import {
  FaLock,
  FaImage,
  FaEnvelope,
  FaKey,
  FaUnlock,
  FaUpload,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

import SignupPage from './Components/SignupPage.jsx'
import ProfilePage from './Components/ProfilePage.jsx'

import {
  loadImageToCanvas,
  exportCanvasAsPNG,
  downloadBlob
} from "./utils/canvas";

import {
  encodeMessageInPixels,
  decodeMessageFromPixels
} from "./utils/stegno";

/* ---------------- HELPERS ---------------- */
function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

/* ---------------- CARD ---------------- */
function Card({ children }) {
  return (
    <div className="w-full bg-[#1d2230] border border-gray-700/50 rounded-3xl p-6 shadow-xl">
      {children}
    </div>
  );
}

function NavBar() {
  return (
    <div className="mt-6 mb-6">
      <nav className="flex justify-center gap-3 bg-[#1d2230] border border-gray-700 rounded-2xl p-3 shadow-lg">

        <Link className="px-5 py-2 rounded-xl bg-purple-600 hover:scale-105 transition" to="/">
          🔒 Encode
        </Link>

        <Link className="px-5 py-2 rounded-xl bg-green-600 hover:scale-105 transition" to="/decode">
          🔓 Decode
        </Link>

        <Link className="px-5 py-2 rounded-xl bg-blue-600 hover:scale-105 transition" to="/dashboard">
          📊 Dashboard
        </Link>

      </nav>
    </div>
  );
}

/* ---------------- ENCODE ---------------- */
function EncodePage() {
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [savedImages, setSavedImages] = useState([]);
useEffect(() => {
  loadImages();
}, []);

function PasswordStrength({ password }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "Weak",   color: "bg-red-500",   text: "text-red-400",    width: "w-1/4" },
    { label: "Fair",   color: "bg-yellow-500", text: "text-yellow-400", width: "w-2/4" },
    { label: "Good",   color: "bg-blue-500",   text: "text-blue-400",   width: "w-3/4" },
    { label: "Strong", color: "bg-green-500",  text: "text-green-400",  width: "w-full" },
  ];
  const { label, color, text, width } = levels[Math.min(score - 1, 3)] ?? levels[0];

  return (
    <div className="mt-2">
      <div className="w-full bg-gray-700 rounded-full h-1">
        <div className={`h-1 rounded-full transition-all duration-300 ${color} ${width}`} />
      </div>
      <p className={`text-xs mt-1 font-medium ${text}`}>{label} password</p>
    </div>
  );
}
  async function loadImages() {
    const imgs = await getImages();
    setSavedImages(Array.isArray(imgs) ? imgs : []);
  }

  async function handleEncode() {
    if (!imageFile) return setStatus("Select image first");
    if (!message.trim()) return setStatus("Enter message");
    if (!password.trim()) return setStatus("Enter password");

    try {
      setLoading(true);

      const { canvas, ctx, imageData } = await loadImageToCanvas(imageFile);

      const encrypted = await encryptMessage(message, password);
      const payload = JSON.stringify(encrypted);

      const encoded = encodeMessageInPixels(imageData, payload);

      const blob = await exportCanvasAsPNG(canvas, ctx, encoded);
      downloadBlob(blob, "encoded.png");

      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsDataURL(blob);
      });

      await saveImage(base64);
await loadImages();

setImageFile(null);
setStatus("Saved successfully!");
    } catch (err) {
      setStatus("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReuse(img) {
    setImageFile(dataURLtoBlob(img.image));
    setStatus("Image selected for reuse");
  }

  async function handleDelete(id) {
    await deleteImage(id);
    await loadImages();
    setStatus("Image deleted");
  }

  return (
    <div className="flex flex-col gap-6 pb-24">

      <h1 className="text-3xl font-bold text-center text-purple-400">
        Encode (Sender)
      </h1>

     <Card>
  <div className="space-y-4">

    <div>
      <h3 className="flex items-center gap-2 text-xl font-semibold text-purple-300">
        🖼️ Upload Cover Image
      </h3>

      <p className="text-gray-400 text-sm mt-1">
        Select an image to hide your secret message.
      </p>
    </div>

    <div className="bg-[#2a2d3a] border border-gray-600 rounded-2xl p-5">

      <ImageSelector onImageSelect={setImageFile} />

    </div>

    {/* Selected Image Preview */}

    {imageFile && (
      <div className="bg-[#232634] rounded-xl p-4 border border-green-500">

        <h4 className="text-green-400 font-semibold mb-3">
          ✅ Selected Image
        </h4>

        <img
          src={URL.createObjectURL(imageFile)}
          alt="Selected"
          className="w-full max-h-64 object-contain rounded-lg"
        />

        <div className="mt-3 text-sm text-gray-300">

          <p>📄 <strong>Name:</strong> {imageFile.name}</p>

          <p>
            📦 <strong>Size:</strong>{" "}
            {(imageFile.size / 1024).toFixed(2)} KB
          </p>

          <p>
            🖼️ <strong>Type:</strong> {imageFile.type}
          </p>

        </div>

      </div>
    )}

  </div>
</Card>
      {/* SAVED IMAGES */}
      {savedImages.length > 0 && (
        <Card>
          <h3 className="mb-3">Saved Images</h3>

          <div className="grid grid-cols-3 gap-3">
            {savedImages.map((img) => (
              <div key={img.id} className="relative group">

                <img
                  src={img.image}
                  onClick={() => handleReuse(img)}
                  className="rounded-lg cursor-pointer hover:scale-105 transition"
                />

                <button
                  onClick={() => handleDelete(img.id)}
                  className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100"
                >
                  X
                </button>

              </div>
            ))}
          </div>
        </Card>
      )}

     <Card>

<div className="flex items-center gap-2 mb-3 text-purple-400 font-semibold">
  <FaEnvelope />
  Hidden Message
</div>

<textarea
  placeholder="Enter secret message..."
  className="w-full bg-[#2a2d3a] p-3 rounded-xl outline-none"
  onChange={(e) => setMessage(e.target.value)}
/>

</Card>
     <Card>

  <div className="flex items-center gap-2 mb-3 text-purple-400 font-semibold">
    <FaKey />
    Password
  </div>

 <div className="relative">

 <input
  type={showPassword ? "text" : "password"}
  placeholder="Enter password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="w-full bg-[#2a2d3a] p-3 pr-12 rounded-xl"
/>

 <button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-purple-400 transition"
>
  {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
</button>

</div>

<PasswordStrength password={password} />

</Card>

    <button
  onClick={handleEncode}
  disabled={loading}
  className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 p-3 rounded-xl transition"
>
  <FaLock />

  {loading
    ? "Processing..."
    : "Encrypt & Hide Message"}

</button>

      {status && <p className="text-center text-gray-400">{status}</p>}

      <NavBar />
    </div>
  );
}

/* ---------------- DECODE ---------------- */
function DecodePage() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [attempts,setAttempts]=useState(0);
const [blocked,setBlocked]=useState(false);
  const [password, setPassword] = useState("");
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {

  let timer;

  if (blocked && timeLeft > 0) {

    timer = setInterval(() => {

      setTimeLeft((prev) => prev - 1);

    }, 1000);

  }

  if (blocked && timeLeft === 0 && attempts >= 3) {

    setBlocked(false);

    setAttempts(0);

    setStatus("✅ You can try again.");

  }

  return () => clearInterval(timer);

}, [blocked, timeLeft, attempts]);


  async function handleDecode() {

  if (blocked) {
    return setStatus(
      "Too many failed attempts."
    );
  }

  if (!selectedImage)
    return setStatus("Select image");

  if (!password)
    return setStatus("Enter password");

  try {

    setLoading(true);

    const { imageData } =
      await loadImageToCanvas(selectedImage);

    const extracted =
      decodeMessageFromPixels(imageData);

    const data =
      JSON.parse(extracted.trim());

    const decrypted =
      await decryptMessage(data, password);

    setResult(decrypted);

    setAttempts(0);

    setBlocked(false);


    setStatus("Success!");

  }

 catch (err) {

  const newAttempts = attempts + 1;

  setAttempts(newAttempts);

  if (newAttempts >= 3) {

    setBlocked(true);

    setTimeLeft(30);

    setStatus(
      "🚫 Too many attempts. Locked for 30 seconds."
    );

  } else {

    setStatus(
      `❌ Wrong password. ${3 - newAttempts} attempts left.`
    );

  }

}


  finally {

    setLoading(false);

  }

}

  return (
    <div className="flex flex-col gap-6 pb-24">

      <h1 className="text-3xl text-green-400 text-center">Decode</h1>

     <Card>

<div className="flex items-center gap-2 mb-4 text-purple-400 font-semibold">
  <FaImage />
  Upload Stego Image
</div>

<label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-500 rounded-2xl p-8 cursor-pointer hover:border-purple-400 transition">

  <FaUpload size={30} />

  <p className="mt-3 text-gray-300">
    Select an image from your device
  </p>

  <input
    type="file"
    className="hidden"
    onChange={(e) =>
      setSelectedImage(e.target.files[0])
    }
  />

</label>

{selectedImage && (

<p className="mt-3 text-green-400">

  Selected: {selectedImage.name}

</p>

)}

</Card>
<Card>

  <div className="flex items-center gap-2 mb-3 text-green-400 font-semibold">
    <FaKey />
    Password
  </div>

  <div className="relative">

    <input
      type={showPassword ? "text" : "password"}
      placeholder="Enter password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      className="w-full bg-[#2a2d3a] p-3 pr-12 rounded-xl outline-none"
    />

    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-green-400 transition"
    >
      {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
    </button>

  </div>

</Card>

      <button
        onClick={handleDecode}
        disabled={loading || blocked}
        className="bg-green-600 p-3 rounded-xl"
      >
        {loading ? "Processing..." : "Decode"}
      </button>
      {attempts > 0 && !blocked && (
  <p className="text-yellow-400 text-center">
    Attempts left: {3 - attempts}
  </p>
)}

{blocked && (

  <p className="text-red-500 text-center font-bold">

    🚫 Try again in {timeLeft} seconds

  </p>

)}

      {result && (
        <Card>
          <p>{result}</p>
        </Card>
      )}

      <NavBar />
    </div>
  );
}


/* ---------------- APP ---------------- */
export default function App() {
  return (
    <div className="min-h-screen bg-[#16171d] text-white flex justify-center">
      <div className="w-full max-w-xl px-4 pt-6">

        <Routes>
          <Route path="/" element={<EncodePage />} />
          <Route path="/decode" element={<DecodePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgotpass" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<h1>404 not found</h1>} />
        </Routes>

      </div>
    </div>
  );
}