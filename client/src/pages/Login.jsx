import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import API from "../services/api";

const FIELDS = [
  {
    name: "email",
    type: "email",
    label: "Email Address",
    placeholder: "name@company.com",
    autoComplete: "email",
    icon: Mail,
  },
  {
    name: "password",
    type: "password",
    label: "Password",
    placeholder: "••••••••",
    autoComplete: "current-password",
    icon: Lock,
    hasToggle: true,
  },
];

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    // Clear previous error when user starts typing again
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/auth/login", {
        email,
        password,
      });

      const token = response.data?.token;
      const user = response.data?.user;

      if (!token) {
        throw new Error("Login succeeded but no authentication token was received.");
      }

      localStorage.setItem("token", token);

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Glass Container */}
      <div className="relative z-10 w-full max-w-md bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-slate-800/80 shadow-2xl p-8 sm:p-10 transition-all">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/10 mb-4 flex items-center justify-center">
            <Sparkles size={26} className="stroke-[2.2]" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            RepoIQ <span className="text-indigo-400">AI</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1.5">
            Welcome back! Log in to access your dashboard
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3.5 flex items-start gap-3 text-xs text-rose-300 backdrop-blur-md"
          >
            <AlertCircle
              size={16}
              className="shrink-0 mt-0.5 text-rose-400"
            />

            <span className="font-medium leading-relaxed">
              {error}
            </span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {FIELDS.map(
            ({
              name,
              type,
              label,
              placeholder,
              autoComplete,
              icon: Icon,
              hasToggle,
            }) => {
              const isPassword = name === "password";

              const inputType = isPassword
                ? showPassword
                  ? "text"
                  : "password"
                : type;

              return (
                <div key={name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={name}
                      className="block text-xs font-semibold text-slate-300"
                    >
                      {label}
                    </label>
                  </div>

                  <div className="relative flex items-center">
                    <Icon
                      size={16}
                      className="absolute left-3.5 text-slate-500 pointer-events-none"
                    />

                    <input
                      id={name}
                      type={inputType}
                      name={name}
                      placeholder={placeholder}
                      value={form[name]}
                      onChange={handleChange}
                      autoComplete={autoComplete}
                      disabled={loading}
                      required
                      className="w-full text-xs sm:text-sm font-medium border border-slate-800 rounded-2xl pl-10 pr-10 py-3 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 outline-none transition-all duration-200 focus:bg-slate-950 focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
                    />

                    {hasToggle && (
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3.5 text-slate-500 hover:text-slate-300 p-1 rounded-lg transition-colors focus:outline-none"
                        tabIndex={-1}
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            }
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-600/25 transition-all duration-300 flex items-center justify-center gap-2 group active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-80"
          >
            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin text-indigo-200"
                />
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>

                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-400 font-medium">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors inline-flex items-center gap-0.5 ml-1"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}