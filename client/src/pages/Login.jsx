import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

const FIELDS = [
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
    autoComplete: "current-password",
  },
];

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const response = await API.post("/auth/login", {
        ...form,
        email: form.email.trim(),
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md"
        noValidate
      >
        <h1 className="text-3xl font-bold text-center mb-2">RepoIQ AI</h1>

        <p className="text-center text-gray-500 mb-8">Login to your account</p>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3"
          >
            {error}
          </div>
        )}

        {FIELDS.map(({ name, type, label, autoComplete }) => (
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
              disabled={loading}
              required
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center mt-6">
          Don't have an account?
          <Link to="/register" className="text-indigo-600 font-semibold ml-2">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;