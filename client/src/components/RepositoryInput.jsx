import { useState } from "react";

function RepositoryInput({ repoUrl, setRepoUrl, analyzeRepository, isLoading }) {
  const [touched, setTouched] = useState(false);

  const isValidUrl = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+/.test(
    repoUrl.trim()
  );
  const showError = touched && repoUrl.trim().length > 0 && !isValidUrl;

  const handleSubmit = () => {
    setTouched(true);
    if (isValidUrl && !isLoading) analyzeRepository();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-lg p-8 mb-10">
      <h2 className="text-3xl font-bold tracking-tight text-slate-100 mb-2">
        Analyze Git Repository
      </h2>
      <p className="text-slate-400 mb-6">
        Paste any GitHub repository URL to visualize its evolution.
      </p>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Input */}
        <div className="relative flex-1 w-full">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 008 10.94c.58.1.79-.25.79-.56v-2.2c-3.25.71-3.94-1.39-3.94-1.39-.53-1.35-1.3-1.71-1.3-1.71-1.06-.73.08-.72.08-.72 1.18.08 1.8 1.2 1.8 1.2 1.04 1.79 2.73 1.27 3.39.97.11-.76.41-1.27.74-1.56-2.59-.29-5.31-1.3-5.31-5.77 0-1.27.46-2.31 1.2-3.13-.12-.29-.52-1.47.11-3.06 0 0 .98-.31 3.2 1.19a11.1 11.1 0 015.82 0c2.22-1.5 3.2-1.19 3.2-1.19.63 1.59.23 2.77.11 3.06.75.82 1.2 1.86 1.2 3.13 0 4.49-2.73 5.47-5.33 5.76.42.36.79 1.07.79 2.16v3.2c0 .31.21.67.8.56A11.5 11.5 0 0023.5 12C23.5 5.65 18.35.5 12 .5z" />
          </svg>

          <label htmlFor="repo-url" className="sr-only">
            GitHub repository URL
          </label>
          <input
            id="repo-url"
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setTouched(true)}
            placeholder="https://github.com/username/repository"
            disabled={isLoading}
            aria-invalid={showError}
            aria-describedby={showError ? "repo-url-error" : undefined}
            className={`w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900 text-slate-100 placeholder-slate-500 border outline-none transition disabled:opacity-60 disabled:cursor-not-allowed ${
              showError
                ? "border-red-500 focus:ring-4 focus:ring-red-500/20"
                : "border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
            }`}
          />

          {showError && (
            <p id="repo-url-error" className="mt-2 text-sm text-red-400">
              Enter a valid GitHub repository URL, e.g. github.com/owner/repo
            </p>
          )}
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"
                />
              </svg>
              Analyzing...
            </>
          ) : (
            <>🚀 Analyze</>
          )}
        </button>
      </div>
    </div>
  );
}

export default RepositoryInput;