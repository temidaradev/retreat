import { ArrowLeft, Coffee, Crown, Link as LinkIcon, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { external } from "../../config";
import { apiService } from "../../services/api";
import ThemeSelector from "../common/ThemeSelector";

export default function Pricing() {
  const { getToken } = useAuth();
  const [bmcUsername, setBmcUsername] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const handleLinkUsername = async () => {
    if (!bmcUsername.trim()) {
      setLinkError("Please enter your Buy Me a Coffee username");
      return;
    }

    setLinking(true);
    setLinkError(null);
    setLinkSuccess(false);

    try {
      const token = await getToken();
      apiService.setAuthToken(token);
      
      await apiService.linkBMCUsernameUser(bmcUsername.trim());
      setLinkSuccess(true);
      setBmcUsername("");
    } catch (err: any) {
      setLinkError(err.message || "Failed to link username. Please try again.");
    } finally {
      setLinking(false);
    }
  };
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-bg-primary)" }}
    >
      {/* Header */}
      <header
        className="border-b sticky top-0 z-40 backdrop-blur-modern"
        style={{
          borderColor: "var(--color-border)",
        }}
      >
        <div className="px-4 md:px-phi-lg py-3 md:py-phi flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-phi">
            <Link
              to="/"
              className="flex items-center gap-2 md:gap-phi text-sm md:text-phi-base hover:opacity-80 transition-opacity"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <main className="px-4 md:px-phi-lg py-6 md:py-phi-xl">
        <div className="max-w-4xl mx-auto w-full">
          {/* Hero Section */}
          <div className="text-center mb-8 md:mb-phi-2xl">
            <h1
              className="text-xl md:text-4xl font-bold mb-4 md:mb-phi-lg flex items-center justify-center gap-2 md:gap-phi"
              style={{ color: "var(--color-text-primary)" }}
            >
              <Coffee
                className="w-5 h-5 md:w-8 md:h-8 hidden sm:inline-block flex-shrink-0"
                style={{ color: "var(--color-accent-500)" }}
              />
              <span>Support Retreat</span>
            </h1>
            <p
              className="text-xs md:text-phi-lg max-w-2xl mx-auto px-2 md:px-4"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Help keep Retreat running by becoming a sponsor
            </p>
          </div>

          {/* Sponsorship Instructions */}
          <div
            className="rounded-phi-lg border overflow-hidden mb-6 md:mb-phi-xl"
            style={{
              background: "var(--color-bg-secondary)",
              borderColor: "var(--color-border)",
            }}
          >
            <div
              className="p-4 md:p-phi-lg border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div className="flex items-center gap-2 md:gap-phi">
                <Crown
                  className="w-4 h-4 md:w-5 md:h-5"
                  style={{ color: "var(--color-accent-500)" }}
                />
                <h3
                  className="text-sm md:text-phi-lg font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Become a Sponsor
                </h3>
              </div>
            </div>

            <div className="p-4 md:p-phi-xl">
              <div className="space-y-4 md:space-y-phi-xl">
                {/* Step 1 */}
                <div className="flex flex-col sm:flex-row gap-3 md:gap-phi">
                  <div
                    className="w-10 h-10 md:icon-phi-md rounded-phi-md flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0"
                    style={{ background: "var(--color-accent-500)" }}
                  >
                    <span className="text-base md:text-phi-lg font-bold text-white">
                      1
                    </span>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4
                      className="text-sm md:text-phi-base font-semibold mb-2 md:mb-phi"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      Buy the Retreat Sponsor on Buy Me a Coffee
                    </h4>
                    <p
                      className="text-xs md:text-phi-sm mb-3 md:mb-phi"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Visit our Buy Me a Coffee page and purchase the "Retreat
                      Sponsor" membership to support the app.
                    </p>
                    <a
                      href={external.buyMeACoffee}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 md:gap-phi px-3 md:px-phi py-2 md:py-phi-sm rounded-phi-md text-xs md:text-phi-sm font-medium transition-all duration-200 hover-lift"
                      style={{
                        background: "#FFDD00",
                        color: "#000000",
                      }}
                    >
                      <Coffee className="w-4 h-4" />
                      Visit Buy Me a Coffee
                    </a>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col sm:flex-row gap-3 md:gap-phi">
                  <div
                    className="w-10 h-10 md:icon-phi-md rounded-phi-md flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0"
                    style={{ background: "var(--color-accent-500)" }}
                  >
                    <span className="text-base md:text-phi-lg font-bold text-white">
                      2
                    </span>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4
                      className="text-sm md:text-phi-base font-semibold mb-2 md:mb-phi"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      Link your Buy Me a Coffee username
                    </h4>
                    <p
                      className="text-xs md:text-phi-sm mb-3 md:mb-phi font-semibold"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Enter your Buy Me a Coffee username exactly as it appears on your BMC profile (this is your username, not your email).
                    </p>
                    <p
                      className="text-xs md:text-phi-sm mb-3 md:mb-phi font-semibold"
                      style={{ color: "var(--color-error, #ef4444)" }}
                    >
                      ⚠️ Important: Your username in retreat-app and Buy Me a Coffee MUST match exactly. The system will only grant premium access if the usernames match when your membership webhook is received.
                    </p>
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Your BMC username"
                          value={bmcUsername}
                          onChange={(e) => {
                            setBmcUsername(e.target.value);
                            setLinkError(null);
                            setLinkSuccess(false);
                          }}
                          className="flex-1 px-3 py-2 rounded-phi-md text-xs md:text-phi-sm border"
                          style={{
                            background: "var(--color-bg-primary)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-text-primary)",
                          }}
                        />
                        <button
                          onClick={handleLinkUsername}
                          disabled={linking || !bmcUsername.trim()}
                          className="inline-flex items-center justify-center gap-2 px-3 md:px-phi py-2 md:py-phi-sm rounded-phi-md text-xs md:text-phi-sm font-medium transition-all duration-200 hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            background: "var(--color-accent-500)",
                            color: "white",
                          }}
                        >
                          {linking ? (
                            "Linking..."
                          ) : (
                            <>
                              <LinkIcon className="w-4 h-4" />
                              Link Username
                            </>
                          )}
                        </button>
                      </div>
                      {linkSuccess && (
                        <div className="flex items-center gap-2 text-xs text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span>Username linked! Your membership will be synced automatically.</span>
                        </div>
                      )}
                      {linkError && (
                        <div className="text-xs text-red-400">
                          {linkError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col sm:flex-row gap-3 md:gap-phi">
                  <div
                    className="w-10 h-10 md:icon-phi-md rounded-phi-md flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0"
                    style={{ background: "var(--color-accent-500)" }}
                  >
                    <span className="text-base md:text-phi-lg font-bold text-white">
                      3
                    </span>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4
                      className="text-sm md:text-phi-base font-semibold mb-2 md:mb-phi"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      Automatic activation
                    </h4>
                    <p
                      className="text-xs md:text-phi-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Once you've linked your username, our system will automatically detect your Buy Me a Coffee membership and grant you access to 50 receipts and premium features immediately!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div
            className="rounded-phi-lg border overflow-hidden"
            style={{
              background: "var(--color-bg-secondary)",
              borderColor: "var(--color-border)",
            }}
          >
            <div
              className="p-4 md:p-phi-lg border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
              <h3
                className="text-sm md:text-phi-lg font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Sponsor Benefits
              </h3>
            </div>

            <div className="p-4 md:p-phi-lg">
              <div className="space-y-4 md:space-y-phi-lg">
                <div>
                  <h4
                    className="text-xs md:text-phi-base font-semibold mb-3 md:mb-phi"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Sponsor-Only Features
                  </h4>
                  <div className="space-y-2 md:space-y-phi-sm">
                    {[
                      "Up to 50 receipt storage",
                      "Export data in multiple formats",
                      "Priority support from the developer",
                    ].map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 md:gap-phi"
                      >
                        <Crown
                          className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0"
                          style={{ color: "var(--color-accent-500)" }}
                        />
                        <span
                          className="text-xs md:text-phi-sm font-medium"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4
                    className="text-xs md:text-phi-base font-semibold mb-3 md:mb-phi"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Available on All Plans
                  </h4>
                  <div className="space-y-2 md:space-y-phi-sm">
                    {[
                      "Email forwarding",
                      "PDF upload",
                      "Warranty tracking",
                      "Smart reminders",
                    ].map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 md:gap-phi"
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: "var(--color-success)" }}
                        />
                        <span
                          className="text-xs md:text-phi-sm"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
