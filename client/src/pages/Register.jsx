import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GitCommit,
  Users,
  Code2,
  Sparkles,
  GitBranch,
} from "lucide-react";
import API from "../services/api";
import logo from "../assets/logo.png";

/* lucide-react no longer ships brand/logo icons (Github, Twitter, etc.), so
   the GitHub mark is a small inline SVG instead of a package import. */
function GithubMark({ size = 14, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.04 11.04 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.43-2.69 5.41-5.26 5.69.42.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .3.2.66.79.55A10.51 10.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Static content                                                             */
/* -------------------------------------------------------------------------- */

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

const FEATURE_POINTS = [
  { icon: Code2, label: "Repository intelligence" },
  { icon: Sparkles, label: "AI-powered code insights" },
  { icon: GitCommit, label: "Commit & contributor analytics" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* -------------------------------------------------------------------------- */
/* Validation (unchanged)                                                     */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Small presentational pieces                                                */
/* -------------------------------------------------------------------------- */

function Logo({ className = "" }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {imgFailed ? (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-sky-400 shrink-0">
          <GitBranch size={17} className="stroke-[2.2]" />
        </div>
      ) : (
        <img
          src={logo}
          alt=""
          onError={() => setImgFailed(true)}
          className="h-8 w-8 shrink-0 object-contain transition-transform duration-200 hover:scale-105"
        />
      )}
      <span className="text-[15px] font-semibold tracking-tight text-white">
        RepoIQ <span className="text-sky-400">AI</span>
      </span>
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="w-full border-b border-slate-800/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Logo />
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="hidden text-slate-500 sm:inline">
            Already have an account?
          </span>
          <Link
            to="/login"
            className="rounded-lg px-3 py-1.5 font-medium text-slate-200 transition-colors hover:bg-slate-900 hover:text-white"
          >
            Log in
          </Link>
        </div>
      </div>
    </header>
  );
}

function StatRow({ label, value, tone = "default" }) {
  const toneClasses =
    tone === "good"
      ? "text-emerald-400"
      : tone === "accent"
      ? "text-sky-400"
      : "text-slate-200";

  return (
    <div className="flex items-center justify-between border-b border-slate-800/70 py-2 last:border-0">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className={`text-[11px] font-medium ${toneClasses}`}>{value}</span>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg shadow-black/20">
      {/* window chrome */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-slate-700" />
        <span className="h-2 w-2 rounded-full bg-slate-700" />
        <span className="h-2 w-2 rounded-full bg-slate-700" />
        <span className="ml-2 text-[11px] text-slate-500">repoiq / overview</span>
      </div>

      <div className="px-4 py-3.5">
        <div className="mb-3 flex items-center gap-2">
          <GithubMark size={14} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-200">acme/payments-api</span>
          <span className="ml-auto flex items-center gap-1 text-[11px] text-slate-500">
            <GitBranch size={11} />
            main
          </span>
        </div>

        <StatRow label="Commits (30d)" value="214" />
        <StatRow label="Contributors" value="12" />
        <StatRow label="Code health" value="Good" tone="good" />
        <StatRow label="Open PRs" value="6" />

        <div className="mt-3 flex items-start gap-2 rounded-lg border border-sky-500/15 bg-sky-500/5 p-2.5">
          <Sparkles size={13} className="mt-0.5 shrink-0 text-sky-400" />
          <p className="text-[11px] leading-relaxed text-slate-400">
            <span className="font-medium text-slate-300">AI insight:</span>{" "}
            Auth module complexity rose 18% this sprint.
          </p>
        </div>
      </div>
    </div>
  );
}

function HeroVisual() {
  const nodes = [
    { icon: GithubMark, label: "GitHub repository" },
    { icon: Code2, label: "Code" },
    { icon: GitCommit, label: "Commits" },
    { icon: Users, label: "Contributors" },
    { icon: Sparkles, label: "AI insights" },
  ];

  return (
    <div className="hidden flex-col items-center gap-0 sm:flex" aria-hidden="true">
      {nodes.map(({ icon: Icon, label }, i) => (
        <React.Fragment key={label}>
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5">
            <Icon size={13} className="text-sky-400" />
            <span className="text-[11px] text-slate-400">{label}</span>
          </div>
          {i < nodes.length - 1 && (
            <div className="h-4 w-px bg-slate-800" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function FormField({ field, value, onChange, disabled, showValue, onToggleShow }) {
  const { name, type, label, placeholder, autoComplete, minLength, helperText, icon: Icon, hasToggle } =
    field;

  const inputType = hasToggle ? (showValue ? "text" : "password") : type;

  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-xs font-medium text-slate-300">
        {label}
      </label>
      <div className="relative flex items-center">
        <Icon size={16} className="pointer-events-none absolute left-3.5 text-slate-500" />
        <input
          id={name}
          type={inputType}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          minLength={minLength}
          disabled={disabled}
          required
          className="h-[50px] w-full rounded-lg border border-slate-800 bg-slate-950/70 pl-10 pr-10 text-sm text-slate-100 outline-none transition-colors duration-150 placeholder:text-slate-600 focus:border-sky-500/70 focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {hasToggle && (
          <button
            type="button"
            onClick={onToggleShow}
            className="absolute right-3.5 rounded-md p-1 text-slate-500 transition-colors hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            tabIndex={-1}
            aria-label={showValue ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          >
            {showValue ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {helperText && <p className="pl-0.5 text-[11px] text-slate-500">{helperText}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main component                                                             */
/* -------------------------------------------------------------------------- */

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
    <div className="min-h-screen w-full bg-[#030712] font-sans antialiased">
      <SiteHeader />

      <main className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:py-20 lg:px-8">
        {/* ---------------------------------------------------------------- */}
        {/* Hero column                                                     */}
        {/* ---------------------------------------------------------------- */}
        <section className="order-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p className="mb-4 text-xs font-medium text-sky-400">
            AI-powered repository intelligence
          </p>

          <h1 className="text-[34px] font-bold leading-[1.1] tracking-tight text-white sm:text-[42px] lg:text-[52px]">
            Understand your codebase.
            <br />
            Build with <span className="text-sky-400">confidence.</span>
          </h1>

          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-slate-400">
            RepoIQ AI analyzes your GitHub repositories, code changes, contributors,
            and architecture to help you understand what is really happening inside
            your codebase.
          </p>

          <ul className="mt-6 space-y-2.5">
            {FEATURE_POINTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm text-slate-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/10 text-sky-400">
                  <Icon size={12} />
                </span>
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-10 hidden lg:flex lg:items-start lg:gap-8">
            <DashboardPreview />
            <HeroVisual />
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Registration card                                               */}
        {/* ---------------------------------------------------------------- */}
        <section className="order-2 flex justify-center lg:justify-end">
          <div className="w-full max-w-[440px] rounded-[20px] border border-slate-800 bg-slate-900/50 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">Create your RepoIQ account</h2>
              <p className="mt-1.5 text-sm text-slate-400">
                Start analyzing your repositories with AI.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300"
              >
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-400" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {FIELDS.map((field) => {
                const isPassword = field.name === "password";
                const isConfirmPassword = field.name === "confirmPassword";
                const showValue = isPassword
                  ? showPassword
                  : isConfirmPassword
                  ? showConfirmPassword
                  : undefined;

                return (
                  <FormField
                    key={field.name}
                    field={field}
                    value={form[field.name]}
                    onChange={handleChange}
                    disabled={loading || success}
                    showValue={showValue}
                    onToggleShow={() => {
                      if (isPassword) setShowPassword((v) => !v);
                      if (isConfirmPassword) setShowConfirmPassword((v) => !v);
                    }}
                  />
                );
              })}

              <button
                type="submit"
                disabled={loading || success}
                aria-live="polite"
                className={`group mt-2 flex h-[50px] w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-white transition-colors duration-150 disabled:cursor-not-allowed ${
                  success
                    ? "bg-emerald-600"
                    : "bg-sky-600 hover:bg-sky-500 disabled:opacity-70"
                }`}
              >
                {success ? (
                  <>
                    <CheckCircle2 size={17} />
                    <span>Account created successfully</span>
                  </>
                ) : loading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create account</span>
                    <ArrowRight
                      size={16}
                      className="transition-transform duration-150 group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-800 pt-5 text-center">
              <p className="text-xs leading-relaxed text-slate-500">
                Built for developers who want deeper insight into their codebase.
              </p>
              <p className="mt-1.5 text-[11px] text-slate-600">
                GitHub &bull; Code Analytics &bull; AI Insights
              </p>
            </div>

            <p className="mt-5 text-center text-xs text-slate-500 sm:hidden">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-sky-400 hover:text-sky-300">
                Log in
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}