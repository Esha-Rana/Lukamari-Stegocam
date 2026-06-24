import { useState } from "react";
import { Link } from "react-router-dom";

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

function Field({ label, id, type = "text", placeholder, value, onChange, error }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={isPassword && show ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full px-4 py-3 rounded-xl bg-gray-800 border text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
            error ? "border-red-500" : "border-gray-700 focus:border-blue-500"
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            {show ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export default function SignupPage() {
  const [form, setForm] = useState({ fullname: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const e = {};
    if (!form.fullname.trim()) e.fullname = "Full name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 8) e.password = "Must be at least 8 characters.";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match.";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 1200);
  };

  if (submitted) {
    return (
      <div className="min-h-screen w-full bg-[#16171d] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Account created!</h2>
          <p className="mt-2 text-sm text-gray-400">Welcome, {form.fullname}.</p>
          <button
            onClick={() => { setForm({ fullname: "", email: "", password: "", confirm: "" }); setSubmitted(false); }}
            className="mt-6 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            ← Back to sign up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#16171d] flex flex-col">

      {/* Nav */}
      <div className="px-4 py-4 sm:px-8">
        <span className="text-white font-extralight text-2xl tracking-widest">
          luka<span className="text-blue-400 font-semibold">MARI</span>
        </span>
      </div>

      {/* Centered card */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-sm sm:max-w-md bg-black rounded-2xl p-5 sm:p-8 shadow-2xl">

          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-light tracking-wide text-white">Create account</h1>
            <p className="mt-1 text-sm font-extralight text-gray-400">Start hiding messages securely.</p>
          </div>

          <div className="space-y-4">
            <Field label="Full name" id="fullname" placeholder="e.g. Esha Rana" value={form.fullname} onChange={handleChange} error={errors.fullname} />
            <Field label="Email address" id="email" type="email" placeholder="abc@gmail.com" value={form.email} onChange={handleChange} error={errors.email} />
            <div>
              <Field label="Password" id="password" type="password" placeholder="········" value={form.password} onChange={handleChange} error={errors.password} />
              <PasswordStrength password={form.password} />
            </div>
            <Field label="Confirm password" id="confirm" type="password" placeholder="········" value={form.confirm} onChange={handleChange} error={errors.confirm} />

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-2.5 sm:py-3 text-sm font-semibold text-white rounded-xl bg-blue-700 hover:bg-blue-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating account...
                </span>
              ) : "Create account"}
            </button>
          </div>

          <p className="mt-5 text-center text-sm text-white font-extralight">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}