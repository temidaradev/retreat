import { useState, useEffect, useRef } from "react";
import { Palette } from "lucide-react";
import { themes, applyTheme } from "../../config/themes";

export default function ThemeSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("gruvbox");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem("theme") || "gruvbox";
    setCurrentTheme(savedTheme);
    applyTheme(themes[savedTheme]);
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleThemeChange = (themeKey: string) => {
    setCurrentTheme(themeKey);
    applyTheme(themes[themeKey]);
    localStorage.setItem("theme", themeKey);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef} style={{ zIndex: 9999 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
        style={{
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-primary)",
        }}
        aria-label="Select theme"
        title="Select theme"
      >
        <Palette className="w-5 h-5" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg border overflow-hidden"
          style={{
            background: "var(--color-bg-secondary)",
            borderColor: "var(--color-border)",
            zIndex: 9999,
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: "var(--color-border)" }}
          >
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Choose Theme
            </p>
          </div>
          <div className="py-1 max-h-96 overflow-y-auto">
            {Object.entries(themes).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => handleThemeChange(key)}
                className="w-full px-4 py-3 text-left transition-colors duration-150 flex items-center justify-between gap-3"
                style={{
                  background:
                    currentTheme === key
                      ? "var(--color-bg-tertiary)"
                      : "transparent",
                  color: "var(--color-text-primary)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-bg-tertiary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    currentTheme === key
                      ? "var(--color-bg-tertiary)"
                      : "transparent";
                }}
              >
                <span className="text-sm">{theme.name}</span>
                <div className="flex gap-1">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{
                      background: theme.colors.bgPrimary,
                      borderColor: theme.colors.border,
                    }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{
                      background: theme.colors.accent500,
                      borderColor: theme.colors.border,
                    }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{
                      background: theme.colors.textPrimary,
                      borderColor: theme.colors.border,
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
