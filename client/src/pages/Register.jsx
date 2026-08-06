import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

const FIELDS = [
  {
    name: "name",
    type: "text",
    label: "Full Name",
    autoComplete: "name",
  },
  {
    name: "email",
    type: "email",
    label: "Email",
    autoComplete: "email",
  },
  {
    name: "password",
    type: "password",
    label: "Password",
    autoComplete: "new-password",
    minLength: 8,
    helperText: "At least 8 characters",
  },
  {
    name: "confirmPassword",
    type: "password",
    label: "Confirm Password",
    autoComplete: "new-password",
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
    return "Password must be at least 8 characters.";
  }
  if (form.password !== form.confirmPassword) {
    return "Passwords do not match.";
  }
  return "";
}

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
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
      setError(err.response?.data?.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-center mb-2">RepoIQ AI</h1>

        <p className="text-center text-gray-500 mb-8">Create your account</p>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {FIELDS.map(({ name, type, label, autoComplete, minLength, helperText }) => (
          <div key={name} className="mb-4 last:mb-6">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <input
              id={name}
              type={type}
              name={name}
              placeholder={label}
              value={form[name]}
              onChange={handleChange}
              autoComplete={autoComplete}
              minLength={minLength}
              disabled={loading || success}
              required
              className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {helperText && <p className="mt-1 text-xs text-gray-400">{helperText}</p>}
          </div>
        ))}

        <button
          type="submit"
          disabled={loading || success}
          className={`mt-2 w-full rounded-lg p-3 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-90 ${
            success ? "bg-green-600" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {success ? "Account created ✓" : loading ? "Creating Account..." : "Register"}
        </button>

        <p className="mt-6 text-center">
          Already have an account?
          <Link to="/login" className="ml-2 font-semibold text-indigo-600">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Register;