import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Add error boundary
window.addEventListener("error", (e) => {
  console.error("Global error:", e.error);
  // Show a user-friendly error message
  const root = document.getElementById("root");
  if (root && !root.hasChildNodes()) {
    root.innerHTML = `
      <div style="min-height: 100vh; background: linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a); display: flex; align-items: center; justify-content: center; padding: 1rem;">
        <div style="max-width: 28rem; width: 100%; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.5); border-radius: 0.5rem; padding: 1.5rem;">
          <h2 style="font-size: 1.5rem; font-weight: bold; color: #f87171; margin-bottom: 1rem;">Application Error</h2>
          <p style="color: #d1d5db; margin-bottom: 1rem;">Something went wrong loading the app. Please try again.</p>
          <details style="margin-top: 1rem;">
            <summary style="color: #9ca3af; cursor: pointer; margin-bottom: 0.5rem;">Error Details</summary>
            <pre style="color: #6b7280; font-size: 0.75rem; overflow: auto; padding: 0.5rem; background: rgba(0,0,0,0.2); border-radius: 0.25rem;">${
              e.error?.message || "Unknown error"
            }\n${e.error?.stack || ""}</pre>
          </details>
        </div>
      </div>
    `;
  }
});

window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled promise rejection:", e.reason);
});

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  console.error("Failed to render app:", error);
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="min-height: 100vh; background: linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a); display: flex; align-items: center; justify-content: center; padding: 1rem;">
        <div style="max-width: 28rem; width: 100%; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.5); border-radius: 0.5rem; padding: 1.5rem;">
          <h2 style="font-size: 1.5rem; font-weight: bold; color: #f87171; margin-bottom: 1rem;">Failed to Start</h2>
          <p style="color: #d1d5db;">The application failed to start. Please reinstall the app or contact support.</p>
        </div>
      </div>
    `;
  }
}
