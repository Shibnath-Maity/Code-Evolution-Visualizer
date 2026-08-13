import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import API from "../services/api";

const FIELDS = [
  {
    name: "name",
    type: "text",
    label: "Full Name",
    placeholder: "John Doe",
    autoComplete: "name",
    icon: User,
  },
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
    autoComplete: "new-password",
    minLength: 8,
    helperText: "At least 8 characters required",
    icon: Lock,
    hasToggle: true,
  },
  {
    name: "confirmPassword",
    type: "password",
    label: "Confirm Password",
    placeholder: "••••••••",
    autoComplete: "new-password",
    icon: Lock,
    hasToggle: true,
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
  if (!form.name.trim()) {
    return "Please enter your full name.";
  }
  if (!EMAIL_RE.test(form.email.trim())) {
    return "Please enter a valid email address.";
  }
  if (form.password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (form.password !== form.confirmPassword) {
    return "Passwords do not match.";
  }
  return "";
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 900);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please check your details and try again."
      );
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
            Create an account to unlock intelligent insights
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3.5 flex items-start gap-3 text-xs text-rose-300 backdrop-blur-md animate-in fade-in slide-in-from-top-2"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {FIELDS.map(
            ({
              name,
              type,
              label,
              placeholder,
              autoComplete,
              minLength,
              helperText,
              icon: Icon,
              hasToggle,
            }) => {
              const isPassword = name === "password";
              const isConfirmPassword = name === "confirmPassword";

              let inputType = type;
              if (isPassword) {
                inputType = showPassword ? "text" : "password";
              } else if (isConfirmPassword) {
                inputType = showConfirmPassword ? "text" : "password";
              }

              return (
                <div key={name} className="space-y-1.5">
                  <label
                    htmlFor={name}
                    className="block text-xs font-semibold text-slate-300"
                  >
                    {label}
                  </label>
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
                      minLength={minLength}
                      disabled={loading || success}
                      required
                      className="w-full text-xs sm:text-sm font-medium border border-slate-800 rounded-2xl pl-10 pr-10 py-3 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 outline-none transition-all duration-200 focus:bg-slate-950 focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
                    />
                    {hasToggle && (
                      <button
                        type="button"
                        onClick={() => {
                          if (isPassword) setShowPassword(!showPassword);
                          if (isConfirmPassword)
                            setShowConfirmPassword(!showConfirmPassword);
                        }}
                        className="absolute right-3.5 text-slate-500 hover:text-slate-300 p-1 rounded-lg transition-colors focus:outline-none"
                        tabIndex={-1}
                      >
                        {(isPassword && showPassword) ||
                        (isConfirmPassword && showConfirmPassword) ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    )}
                  </div>
                  {helperText && (
                    <p className="text-[11px] text-slate-500 font-medium pl-1">
                      {helperText}
                    </p>
                  )}
                </div>
              );
            }
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success}
            className={`w-full mt-2 py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm text-white shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-80 ${
              success
                ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-600/25"
            }`}
          >
            {success ? (
              <>
                <CheckCircle2 size={18} className="animate-bounce" />
                <span>Account created successfully!</span>
              </>
            ) : loading ? (
              <>
                <Loader2 size={18} className="animate-spin text-indigo-200" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Register Account</span>
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
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors inline-flex items-center gap-0.5 ml-1"
            >
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}