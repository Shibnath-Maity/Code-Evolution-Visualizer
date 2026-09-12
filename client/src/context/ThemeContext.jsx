import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("repoiq_theme") || "system";
  });

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (mode) => {
      let isDark = false;

      if (mode === "dark") {
        isDark = true;
      }

      if (mode === "system") {
        isDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
      }

      root.classList.toggle("dark", isDark);
    };

    applyTheme(theme);

    if (theme === "system") {
      const mediaQuery = window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

      const handleChange = () => applyTheme("system");

      mediaQuery.addEventListener("change", handleChange);

      return () => {
        mediaQuery.removeEventListener(
          "change",
          handleChange
        );
      };
    }
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("repoiq_theme", newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        changeTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}