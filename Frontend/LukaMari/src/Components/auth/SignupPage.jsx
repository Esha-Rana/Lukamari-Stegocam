import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PasswordStrength from '../ui/PasswordStrength';
import { HiOutlineShieldCheck, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';

function Field({ label, id, type = 'text', placeholder, value, onChange, error }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={isPassword && show ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-gray-600 text-sm
                      focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all
                      ${error ? 'border-red-500' : 'border-white/10 focus:border-purple-500'}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-purple-400 transition"
          >
            {show ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    setServerError('');
  }

  function validate() {
    const e = {};
    if (!form.username.trim()) e.username = 'Username is required.';
    else if (form.username.length < 3) e.username = 'At least 3 characters.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 8) e.password = 'At least 8 characters.';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match.';
    return e;
  }

  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await signUp(form.email, form.password, form.username);
      setSubmitted(true);
    } catch (err) {
      setServerError(err.message ?? 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen w-full bg-[#0a0b14] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-purple-600/30">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Check your email</h2>
          <p className="mt-2 text-sm text-gray-400">We sent a verification link to <strong className="text-purple-400">{form.email}</strong></p>
          <p className="mt-1 text-xs text-gray-600">Don't forget to check your spam folder.</p>
          <Link to="/login" className="mt-6 inline-block text-sm text-purple-400 hover:text-purple-300 font-medium transition">
            ← Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0b14] flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
            <HiOutlineShieldCheck className="text-white w-6 h-6" />
          </div>
          <span className="text-white font-extralight text-2xl tracking-widest">
            luka<span className="text-purple-400 font-bold">MARI</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-semibold text-white mb-1">Create account</h1>
          <p className="text-gray-400 text-sm mb-7">Start hiding messages securely.</p>

          <div className="space-y-4">
            <Field label="Username" id="username" placeholder="e.g. esha_rana" value={form.username} onChange={handleChange} error={errors.username} />
            <Field label="Email address" id="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} error={errors.email} />
            <div>
              <Field label="Password" id="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} error={errors.password} />
              <PasswordStrength password={form.password} />
            </div>
            <Field label="Confirm password" id="confirm" type="password" placeholder="••••••••" value={form.confirm} onChange={handleChange} error={errors.confirm} />

            {serverError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{serverError}</p>
              </div>
            )}

            <button
              id="signup-submit"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm
                         transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating account...
                </span>
              ) : 'Create account'}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 font-semibold hover:text-purple-300 transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
