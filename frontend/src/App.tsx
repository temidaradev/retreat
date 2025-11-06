import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Dashboard from "./components/layout/Dashboard";
import Landing from "./components/layout/Landing";
import Pricing from "./components/layout/Pricing";
import SubscriptionStatus from "./components/common/SubscriptionStatus";
import Admin from "./components/layout/Admin";
import EmailSettings from "./pages/EmailSettings";
import VerifyEmail from "./pages/VerifyEmail";
import { clerk, validateConfig } from "./config";
import "./App.css";

function App() {
  const [configErrors, setConfigErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    // Log environment info for debugging
    console.log("App starting...");

    // Validate configuration on startup
    try {
      const validation = validateConfig();
      console.log("Validation result:", validation);
      setConfigErrors(validation.errors);
    } catch (error) {
      console.error("Config validation error:", error);
      setConfigErrors(["Failed to validate configuration"]);
    } finally {
      setIsValidating(false);
    }
  }, []);

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading Retreat...</p>
        </div>
      </div>
    );
  }

  // Show configuration errors if any
  if (configErrors.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-900/20 border border-red-500/50 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-red-400 mb-4">
            Configuration Error
          </h2>
          <p className="text-gray-300 mb-4">
            The app is not properly configured. Please contact support or check
            the following:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-400">
            {configErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
          <div className="mt-6 text-sm text-gray-500">
            <p>Environment: {import.meta.env.MODE}</p>
            <p>Version: 1.0.0</p>
            <p>Clerk Key: {clerk.publishableKey ? "Present" : "Missing"}</p>
            <p>API URL: {import.meta.env.VITE_API_URL || "Missing"}</p>
          </div>
        </div>
      </div>
    );
  }

  // Only render ClerkProvider if we have a valid key
  if (!clerk.publishableKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">
            Missing Configuration
          </h2>
          <p className="text-gray-300">
            Authentication is not configured. Please set up the required
            environment variables.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            <p>
              VITE_CLERK_PUBLISHABLE_KEY:{" "}
              {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
                ? "Present"
                : "Missing"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerk.publishableKey}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#3b82f6",
        },
      }}
    >
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <SignedOut>
            <Landing />
          </SignedOut>
          <SignedIn>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/subscription" element={<SubscriptionStatus />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/emails" element={<EmailSettings />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </SignedIn>
          {/* Public routes (no auth required) */}
          <Routes>
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
          </Routes>
        </div>
      </Router>
    </ClerkProvider>
  );
}

export default App;
