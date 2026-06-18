import { useState } from "react";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const [form, setForm] = useState({ displayname: "Shirish Tamrakar", email: "shirish@ku.edu.np" });
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const initials = form.displayname
    .trim()
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  return (
    <div className="min-h-screen w-full bg-[#16171d] flex flex-col">

      {/* Nav */}
      <div className="px-4 py-4 sm:px-8">
        <span className="text-white font-extralight text-2xl tracking-widest">
          luka<span className="text-blue-400 font-semibold">MARI</span>
        </span>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-sm sm:max-w-md bg-black rounded-2xl p-5 sm:p-8 shadow-2xl">

          {/* Avatar + user info */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-16 h-16 rounded-full bg-blue-800 flex items-center justify-center text-white text-xl font-semibold mb-3 select-none">
              {initials || "?"}
            </div>
            <h2 className="text-white font-semibold text-lg tracking-wide">{form.displayname || "—"}</h2>
            <p className="text-gray-400 text-sm">{form.email || "—"}</p>
            <span className="mt-2 px-3 py-0.5 rounded-full border border-gray-600 text-gray-300 text-xs">
              Student
            </span>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="displayname" className="block text-sm text-white mb-1.5">
                Display name
              </label>
              <input
                id="displayname"
                name="displayname"
                type="text"
                value={form.displayname}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm text-white mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              className="w-full py-3 text-sm font-semibold text-white rounded-xl bg-blue-700 hover:bg-blue-600 transition-colors mt-1"
            >
              {saved ? "✓ Changes saved" : "Save changes"}
            </button>

            {/* Delete */}
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 text-sm font-semibold text-red-400 rounded-xl border border-red-900 bg-transparent hover:bg-red-950 transition-colors"
              >
                Delete account
              </button>
            ) : (
              <div className="rounded-xl border border-red-900 bg-red-950 p-4 text-center space-y-3">
                <p className="text-sm text-red-300">Are you sure? This cannot be undone.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 text-sm font-semibold text-gray-300 rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 py-2 text-sm font-semibold text-white rounded-xl bg-red-700 hover:bg-red-600 transition-colors"
                  >
                    Yes, delete
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            <Link to="/" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
              ← Back to app
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}