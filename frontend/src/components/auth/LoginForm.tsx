import Link from "next/link";

interface Props {
  email: string;       setEmail: (v: string) => void;
  password: string;    setPassword: (v: string) => void;
  showPass: boolean;   setShowPass: (v: boolean) => void;
  loading: boolean;
  onSubmit: () => void;
}

export default function LoginForm({
  email, setEmail, password, setPassword,
  showPass, setShowPass, loading, onSubmit,
}: Props) {
  return (
    <div className="space-y-5">

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all"
        />
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">Password</label>
          <Link href="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full bg-white/5 border border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 rounded-xl px-4 py-3 pr-16 text-white placeholder-gray-500 text-sm outline-none transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors text-xs font-semibold"
          >
            {showPass ? "HIDE" : "SHOW"}
          </button>
        </div>
      </div>

      {/* Remember me */}
      <div className="flex items-center gap-2">
        <input type="checkbox" id="remember" className="w-4 h-4 rounded accent-violet-500" />
        <label htmlFor="remember" className="text-sm text-gray-400 cursor-pointer">
          Remember me for 30 days
        </label>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={loading}
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-violet-900/30"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Signing in...
          </span>
        ) : "Sign In"}
      </button>
    </div>
  );
}