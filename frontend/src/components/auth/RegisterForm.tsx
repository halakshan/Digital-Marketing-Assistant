import Link from "next/link";
import PasswordStrengthBar from "./PasswordStrengthBar";

interface Props {
  role: string;
  fullName: string;    setFullName: (v: string) => void;
  bizName: string;     setBizName: (v: string) => void;
  email: string;       setEmail: (v: string) => void;
  password: string;    setPassword: (v: string) => void;
  confirm: string;     setConfirm: (v: string) => void;
  showPass: boolean;   setShowPass: (v: boolean) => void;
  showConfirm: boolean;setShowConfirm: (v: boolean) => void;
  agreed: boolean;     setAgreed: (v: boolean) => void;
  loading: boolean;
  onSubmit: () => void;
}

export default function RegisterForm({
  role,
  fullName, setFullName,
  bizName, setBizName,
  email, setEmail,
  password, setPassword,
  confirm, setConfirm,
  showPass, setShowPass,
  showConfirm, setShowConfirm,
  agreed, setAgreed,
  loading, onSubmit,
}: Props) {

  const inputClass = "w-full bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all";

  return (
    <div className="space-y-4">

      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Full Name <span className="text-red-400">*</span>
        </label>
        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
          placeholder="Kasun Perera" className={inputClass} />
      </div>

      {/* Business / Brand Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {role === "business" ? "Business Name" : "Brand / Profile Name"}{" "}
          <span className="text-gray-500 text-xs">(optional)</span>
        </label>
        <input type="text" value={bizName} onChange={e => setBizName(e.target.value)}
          placeholder={role === "business" ? "Kasun's Shop" : "Kasun Designs"}
          className={inputClass} />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Email Address <span className="text-red-400">*</span>
        </label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com" className={inputClass} />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Password <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <input type={showPass ? "text" : "password"} value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            className={`${inputClass} pr-16`} />
          <button type="button" onClick={() => setShowPass(!showPass)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-xs font-semibold">
            {showPass ? "HIDE" : "SHOW"}
          </button>
        </div>
        <PasswordStrengthBar password={password} />
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Confirm Password <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <input type={showConfirm ? "text" : "password"} value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Re-enter your password"
            className={`w-full bg-white/5 border focus:ring-1 rounded-xl px-4 py-3 pr-16 text-white placeholder-gray-500 text-sm outline-none transition-all ${
              confirm && confirm !== password
                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
                : "border-white/10 focus:border-violet-500 focus:ring-violet-500/50"
            }`} />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-xs font-semibold">
            {showConfirm ? "HIDE" : "SHOW"}
          </button>
        </div>
        {confirm && confirm !== password && (
          <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
        )}
      </div>

      {/* Terms */}
      <div className="flex items-start gap-2 pt-1">
        <input type="checkbox" id="terms" checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          className="w-4 h-4 mt-0.5 rounded accent-violet-500 flex-shrink-0" />
        <label htmlFor="terms" className="text-xs text-gray-400 cursor-pointer leading-relaxed">
          I agree to the{" "}
          <Link href="/terms"   className="text-violet-400 hover:text-violet-300 underline">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-violet-400 hover:text-violet-300 underline">Privacy Policy</Link>
        </label>
      </div>

      {/* Submit */}
      <button type="button" onClick={onSubmit} disabled={loading}
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-violet-900/30 mt-2">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Creating account...
          </span>
        ) : "Create Account →"}
      </button>
    </div>
  );
}