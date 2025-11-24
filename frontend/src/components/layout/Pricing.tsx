import {
  ArrowLeft,
  Coffee,
  Crown,
  Link as LinkIcon,
  CheckCircle,
  Sparkles,
  Zap,
  Shield,
  Download,
  Mail,
  FileText,
  Clock,
  Bell,
} from "lucide-react";
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
  const [cryptomusLoading, setCryptomusLoading] = useState(false);
  const [cryptomusError, setCryptomusError] = useState<string | null>(null);

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
    } catch (err: unknown) {
      setLinkError(
        err instanceof Error
          ? err.message
          : "Failed to link username. Please try again."
      );
    } finally {
      setLinking(false);
    }
  };

  const handleCryptomusPayment = async () => {
    setCryptomusError(null);
    setCryptomusLoading(true);
    try {
      const token = await getToken();
      apiService.setAuthToken(token);

      const resp = await apiService.createCryptomusSession("sponsor");
      if (
        resp &&
        typeof resp === "object" &&
        "checkout_url" in resp &&
        typeof (resp as Record<string, unknown>).checkout_url === "string"
      ) {
        window.location.href = (resp as Record<string, string>).checkout_url;
      } else {
        setCryptomusError("Payment URL not returned from server");
      }
    } catch (err: unknown) {
      console.error("[Cryptomus] payment error", err);
      setCryptomusError(
        err instanceof Error ? err.message : "Failed to start Cryptomus payment"
      );
    } finally {
      setCryptomusLoading(false);
    }
  };
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-bg-primary)" }}
    >
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
        <div className="max-w-5xl mx-auto w-full">
          <div className="text-center mb-12 md:mb-16 relative">
            <div
              className="absolute inset-0 -top-20 opacity-20 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle at center, var(--color-accent-500) 0%, transparent 70%)",
              }}
            />
            <div className="relative">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 border"
                style={{
                  background: "var(--color-bg-secondary)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-accent-500)",
                }}
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-xs md:text-sm font-medium">
                  Premium Features Unlocked
                </span>
              </div>
              <h1
                className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6"
                style={{ color: "var(--color-text-primary)" }}
              >
                Support Retreat
              </h1>
              <p
                className="text-base md:text-xl max-w-2xl mx-auto px-2 md:px-4 leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Help keep Retreat running and unlock premium features with
                flexible payment options
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div
              className="rounded-xl border overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "var(--color-bg-secondary)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      background: "rgba(255, 221, 0, 0.1)",
                    }}
                  >
                    <Coffee className="w-8 h-8" style={{ color: "#FFDD00" }} />
                  </div>
                  <div
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: "var(--color-accent-500)",
                      color: "white",
                    }}
                  >
                    Popular
                  </div>
                </div>
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Buy Me a Coffee
                </h3>
                <p
                  className="text-sm mb-6"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Support via Buy Me a Coffee membership
                </p>
                <a
                  href={external.buyMeACoffee}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: "#FFDD00",
                    color: "#000000",
                  }}
                >
                  <Coffee className="w-5 h-5" />
                  Visit Buy Me a Coffee
                </a>
              </div>
            </div>

            <div
              className="rounded-xl border overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "var(--color-bg-secondary)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      background: "rgba(11, 116, 222, 0.1)",
                    }}
                  >
                    <Zap className="w-8 h-8" style={{ color: "#0b74de" }} />
                  </div>
                  <div
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: "rgba(11, 116, 222, 0.2)",
                      color: "#0b74de",
                    }}
                  >
                    Crypto
                  </div>
                </div>
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Cryptomus
                </h3>
                <p
                  className="text-sm mb-6"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Pay with cryptocurrency via Cryptomus
                </p>
                <button
                  onClick={handleCryptomusPayment}
                  disabled={cryptomusLoading}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{
                    background: "#0b74de",
                    color: "white",
                  }}
                >
                  {cryptomusLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Pay with Cryptomus
                    </>
                  )}
                </button>
                {cryptomusError && (
                  <div
                    className="mt-3 p-3 rounded-lg text-xs flex items-start gap-2"
                    style={{
                      background: "var(--color-danger-bg)",
                      color: "var(--color-danger)",
                    }}
                  >
                    <span>⚠️</span>
                    <span>{cryptomusError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            className="rounded-xl border overflow-hidden mb-12"
            style={{
              background: "var(--color-bg-secondary)",
              borderColor: "var(--color-border)",
            }}
          >
            <div
              className="p-6 border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div className="flex items-center gap-3">
                <Crown
                  className="w-6 h-6"
                  style={{ color: "var(--color-accent-500)" }}
                />
                <h3
                  className="text-xl font-bold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  How to Activate Your Sponsorship
                </h3>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg"
                    style={{
                      background: "var(--color-accent-500)",
                      color: "white",
                    }}
                  >
                    1
                  </div>
                  <div className="flex-1 pt-1">
                    <h4
                      className="text-lg font-semibold mb-2"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      Choose Your Payment Method
                    </h4>
                    <p
                      className="text-sm mb-4"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Select Buy Me a Coffee for traditional payment or
                      Cryptomus for cryptocurrency. Both methods unlock the same
                      premium features.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg"
                    style={{
                      background: "var(--color-accent-500)",
                      color: "white",
                    }}
                  >
                    2
                  </div>
                  <div className="flex-1 pt-1">
                    <h4
                      className="text-lg font-semibold mb-2"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      Link Your Buy Me a Coffee Username
                    </h4>
                    <p
                      className="text-sm mb-4"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Enter your Buy Me a Coffee username exactly as it appears
                      on your BMC profile (this is your username, not your
                      email).
                    </p>
                    <div
                      className="p-4 rounded-lg mb-4 border-l-4"
                      style={{
                        background: "var(--color-warning-bg)",
                        borderColor: "var(--color-warning)",
                      }}
                    >
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "var(--color-warning)" }}
                      >
                        ⚠️ Important: Your username in Retreat and Buy Me a
                        Coffee MUST match exactly. The system will only grant
                        premium access if the usernames match when your
                        membership webhook is received.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          placeholder="Your BMC username"
                          value={bmcUsername}
                          onChange={(e) => {
                            setBmcUsername(e.target.value);
                            setLinkError(null);
                            setLinkSuccess(false);
                          }}
                          className="flex-1 px-4 py-3 rounded-lg text-sm border focus:outline-none focus:ring-2 transition-all"
                          style={{
                            background: "var(--color-bg-primary)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-text-primary)",
                          }}
                        />
                        <button
                          onClick={handleLinkUsername}
                          disabled={linking || !bmcUsername.trim()}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
                          style={{
                            background: "var(--color-accent-500)",
                            color: "white",
                          }}
                        >
                          {linking ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Linking...
                            </>
                          ) : (
                            <>
                              <LinkIcon className="w-4 h-4" />
                              Link Username
                            </>
                          )}
                        </button>
                      </div>
                      {linkSuccess && (
                        <div
                          className="flex items-start gap-3 p-4 rounded-lg"
                          style={{
                            background: "var(--color-success-bg)",
                            color: "var(--color-success)",
                          }}
                        >
                          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <span className="text-sm font-medium">
                            Username linked successfully! Your membership will
                            be synced automatically.
                          </span>
                        </div>
                      )}
                      {linkError && (
                        <div
                          className="flex items-start gap-3 p-4 rounded-lg"
                          style={{
                            background: "var(--color-danger-bg)",
                            color: "var(--color-danger)",
                          }}
                        >
                          <span className="text-sm">⚠️ {linkError}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg"
                    style={{
                      background: "var(--color-accent-500)",
                      color: "white",
                    }}
                  >
                    3
                  </div>
                  <div className="flex-1 pt-1">
                    <h4
                      className="text-lg font-semibold mb-2"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      Automatic Activation
                    </h4>
                    <p
                      className="text-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Once you've linked your username, our system will
                      automatically detect your Buy Me a Coffee membership and
                      grant you access to 50 receipts and premium features
                      immediately!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div
              className="rounded-xl border overflow-hidden"
              style={{
                background: "var(--color-bg-secondary)",
                borderColor: "var(--color-border)",
              }}
            >
              <div
                className="p-6 border-b"
                style={{ borderColor: "var(--color-border)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      background: "var(--color-accent-500)",
                    }}
                  >
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <h3
                    className="text-lg font-bold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Premium Features
                  </h3>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {[
                    {
                      icon: FileText,
                      title: "50 Receipt Storage",
                      desc: "Store up to 50 receipts securely",
                    },
                    {
                      icon: Download,
                      title: "Multi-Format Export",
                      desc: "Export your data in various formats",
                    },
                    {
                      icon: Shield,
                      title: "Priority Support",
                      desc: "Get direct help from the developer",
                    },
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-lg transition-all hover:scale-[1.02]"
                      style={{
                        background: "var(--color-bg-tertiary)",
                      }}
                    >
                      <div
                        className="p-2.5 rounded-lg flex-shrink-0"
                        style={{
                          backgroundColor:
                            "rgba(var(--color-accent-rgb, 104, 157, 106), 0.15)",
                        }}
                      >
                        <feature.icon
                          className="w-5 h-5"
                          style={{ color: "var(--color-accent-500)" }}
                        />
                      </div>
                      <div>
                        <h4
                          className="font-semibold text-sm mb-1"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {feature.title}
                        </h4>
                        <p
                          className="text-xs"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="rounded-xl border overflow-hidden"
              style={{
                background: "var(--color-bg-secondary)",
                borderColor: "var(--color-border)",
              }}
            >
              <div
                className="p-6 border-b"
                style={{ borderColor: "var(--color-border)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      backgroundColor: "rgba(163, 190, 140, 0.15)",
                    }}
                  >
                    <CheckCircle
                      className="w-5 h-5"
                      style={{ color: "var(--color-success)" }}
                    />
                  </div>
                  <h3
                    className="text-lg font-bold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Always Free
                  </h3>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {[
                    {
                      icon: Mail,
                      title: "Email Forwarding",
                      desc: "Forward receipts directly to your inbox",
                    },
                    {
                      icon: FileText,
                      title: "PDF Upload",
                      desc: "Upload receipts as PDF documents",
                    },
                    {
                      icon: Clock,
                      title: "Warranty Tracking",
                      desc: "Track warranty expiration dates",
                    },
                    {
                      icon: Bell,
                      title: "Smart Reminders",
                      desc: "Get notified before warranties expire",
                    },
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-lg transition-all hover:scale-[1.02]"
                      style={{
                        background: "var(--color-bg-tertiary)",
                      }}
                    >
                      <div
                        className="p-2.5 rounded-lg flex-shrink-0"
                        style={{
                          backgroundColor: "rgba(163, 190, 140, 0.15)",
                        }}
                      >
                        <feature.icon
                          className="w-5 h-5"
                          style={{ color: "var(--color-success)" }}
                        />
                      </div>
                      <div>
                        <h4
                          className="font-semibold text-sm mb-1"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {feature.title}
                        </h4>
                        <p
                          className="text-xs"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl border overflow-hidden text-center p-8 md:p-12"
            style={{
              background:
                "linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%)",
              borderColor: "var(--color-border)",
            }}
          >
            <Sparkles
              className="w-12 h-12 mx-auto mb-4"
              style={{ color: "var(--color-accent-500)" }}
            />
            <h3
              className="text-2xl font-bold mb-3"
              style={{ color: "var(--color-text-primary)" }}
            >
              Ready to Support Retreat?
            </h3>
            <p
              className="text-sm mb-6 max-w-2xl mx-auto"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Choose your preferred payment method above and start enjoying
              premium features today. Thank you for supporting the development
              of Retreat!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
