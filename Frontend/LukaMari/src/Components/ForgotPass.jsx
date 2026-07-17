import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { HiOutlineShieldCheck, HiOutlineMail } from 'react-icons/hi';
import '../index.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function handleChange(e) {
    setEmail(e.target.value);
    setError('');
    setMessage('');
  }

  function validate() {
    if (!email.trim()) {
      return 'Email is required.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Enter a valid email address.';
    }
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (resetError) throw resetError;
      setMessage('Password reset link sent! Check your inbox and spam folder.');
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl font-semibold text-white mb-1">Forgot Password</h1>
          <p className="text-gray-400 text-sm mb-7">Enter your email to receive a reset link</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="reset-email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-gray-600 text-sm
                              focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all
                              ${error ? 'border-red-500' : 'border-white/10 focus:border-purple-500'}`}
                />
              </div>
              {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
              {message && <p className="text-green-400 text-xs mt-1">{message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm
                         transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Sending Link...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="flex justify-center items-center mt-6">
            <Link to="/login" className="text-purple-400 text-sm hover:text-purple-300 font-medium transition">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}