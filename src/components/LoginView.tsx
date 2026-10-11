import React, { useState } from 'react';
import { useIrrigation } from '../context/IrrigationContext';
import {
  Sprout,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShieldCheck,
  User,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const {
    signInWithEmail,
    signUpWithEmail,
    loginAsDemo,
    loginLoading,
    loginError,
    setLoginError,
  } = useIrrigation();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('elena@garden.local');
  const [password, setPassword] = useState('pass123');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (authMode === 'signup') {
      if (password !== confirmPassword) {
        setLoginError('Passwords do not match. Please verify your password.');
        return;
      }
      if (password.length < 6) {
        setLoginError('Password must be at least 6 characters.');
        return;
      }
      await signUpWithEmail(email, password, displayName);
    } else {
      await signInWithEmail(email, password);
    }
  };

  const handleQuickFill = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    if (authMode === 'signup') {
      setConfirmPassword(userPass);
      setDisplayName(userEmail.split('@')[0]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F8FAF6] text-[#1A221E] px-4 py-12 relative overflow-hidden font-sans">
      {/* Soft natural pastel green gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#E2EDE0]/60 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[#D7E7D4]/40 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#E6EFE4] border border-[#CFDFCB] text-[#143826] mb-4 shadow-sm">
            <Sprout className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#143826] mb-2 font-display">
            NURTURA
          </h1>
          <p className="text-sm text-[#4A5D4E] max-w-sm mx-auto">
            Autonomous closed-loop smart irrigation. Cloud-synced local controller.
          </p>
        </div>

        {/* Login & Signup Card */}
        <div className="bg-white border border-[#D1E0CE] rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#143826]/4">
          {/* Header & Status */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E6EFE4] mb-5">
            <div>
              <h2 className="text-base font-bold text-[#143826] font-display">
                {authMode === 'signin' ? 'Controller Sign In' : 'Create New Account'}
              </h2>
              <p className="text-xs text-[#667C6A]">Node: balc-esp32-node1</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-[#E6EFE4] text-[#143826] border border-[#CFDFCB]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              CLOUD READY
            </span>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex items-center p-1 rounded-2xl bg-[#F8FAF6] border border-[#D8E6D3] mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setLoginError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                authMode === 'signin'
                  ? 'bg-white text-[#143826] shadow-xs'
                  : 'text-[#667C6A] hover:text-[#143826]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setLoginError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-white text-[#143826] shadow-xs'
                  : 'text-[#667C6A] hover:text-[#143826]'
              }`}
            >
              Create Account
            </button>
          </div>

          {loginError && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs font-medium space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 font-bold shrink-0">⚠</span>
                <div className="flex-1 leading-relaxed text-[#5C3D11]">{loginError}</div>
              </div>
              {loginError.includes('Firebase Console') && (
                <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between gap-2">
                  <a
                    href="https://console.firebase.google.com/project/gen-lang-client-0842902664/authentication/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-[#143826] underline hover:text-[#0E281B] inline-flex items-center gap-1"
                  >
                    Open Firebase Console Settings ↗
                  </a>
                  <button
                    type="button"
                    onClick={loginAsDemo}
                    className="px-2 py-1 rounded bg-white border border-amber-300 text-[11px] text-[#143826] font-semibold hover:bg-amber-100 transition-colors"
                  >
                    Use Demo Mode
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name field (only in signup mode) */}
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-[#143826] uppercase font-mono tracking-wider mb-1.5">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667C6A]" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Elena Vance"
                    className="w-full pl-10 pr-4 py-3 bg-[#F8FAF6] border border-[#D1E0CE] rounded-xl text-sm text-[#1A221E] placeholder-[#8A9B8D] focus:outline-none focus:border-[#143826] focus:ring-1 focus:ring-[#143826] transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-[#143826] uppercase font-mono tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667C6A]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@garden.local"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#F8FAF6] border border-[#D1E0CE] rounded-xl text-sm text-[#1A221E] placeholder-[#8A9B8D] focus:outline-none focus:border-[#143826] focus:ring-1 focus:ring-[#143826] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#143826] uppercase font-mono tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-[#667C6A]">
                  {authMode === 'signup' ? 'Min 6 characters' : 'Encrypted key'}
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667C6A]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-3 bg-[#F8FAF6] border border-[#D1E0CE] rounded-xl text-sm text-[#1A221E] placeholder-[#8A9B8D] focus:outline-none focus:border-[#143826] focus:ring-1 focus:ring-[#143826] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#667C6A] hover:text-[#143826] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (only in signup mode) */}
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-[#143826] uppercase font-mono tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667C6A]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-3 bg-[#F8FAF6] border border-[#D1E0CE] rounded-xl text-sm text-[#1A221E] placeholder-[#8A9B8D] focus:outline-none focus:border-[#143826] focus:ring-1 focus:ring-[#143826] transition-all"
                  />
                </div>
              </div>
            )}

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#334237]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[#D1E0CE] text-[#143826] focus:ring-[#143826]"
                />
                <span>Remember this controller</span>
              </label>

              <span className="text-xs text-[#667C6A]">Per-User Isolation</span>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 px-4 bg-[#143826] hover:bg-[#0E281B] text-[#F8FAF6] font-semibold text-sm rounded-xl transition-all shadow-md shadow-[#143826]/10 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Connecting to Cloud Controller...</span>
                </>
              ) : (
                <>
                  <span>
                    {authMode === 'signin'
                      ? 'Sign In to Controller'
                      : 'Create Account & Connect Controller'}
                  </span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Offline / Demo Mode Option */}
          <div className="mt-5 pt-4 border-t border-[#E6EFE4]">
            <button
              type="button"
              onClick={loginAsDemo}
              className="w-full py-2.5 px-4 rounded-xl border border-[#CFDFCB] bg-[#F8FAF6] hover:bg-[#EAEFE8] text-[#143826] text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sliders className="h-3.5 w-3.5 text-[#143826]" />
              <span>Continue in Demo Mode (Local Simulation)</span>
            </button>
          </div>

          {/* Quick preset credentials helper */}
          <div className="mt-4 pt-4 border-t border-[#E6EFE4]">
            <p className="text-[11px] text-[#667C6A] mb-2 font-mono">
              Quick Test Credentials:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('elena@garden.local', 'pass123')}
                className="px-2.5 py-1 rounded-lg bg-[#F8FAF6] hover:bg-[#EAEFE8] border border-[#CFDFCB] text-[11px] font-mono text-[#143826] transition-colors"
              >
                elena@garden.local / pass123
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('marcus@balcony.hub', 'grow2026')}
                className="px-2.5 py-1 rounded-lg bg-[#F8FAF6] hover:bg-[#EAEFE8] border border-[#CFDFCB] text-[11px] font-mono text-[#143826] transition-colors"
              >
                marcus@balcony.hub / grow2026
              </button>
            </div>
          </div>
        </div>

        {/* Download source code option & Footer */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <a
            href="/nurtura-smart-irrigation.zip"
            download="nurtura-smart-irrigation.zip"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-[#EAEFE8] text-[#143826] border border-[#CFDFCB] text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Download Website Source Code (.ZIP)</span>
          </a>

          <div className="text-center text-xs text-[#667C6A] flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#143826]" />
            <span>Secure Firebase Authentication · Cloud Firestore Isolated</span>
          </div>
        </div>
      </div>
    </div>
  );
};
