import { ArrowLeft, Coffee, Mail, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { external } from "../../config";
import ThemeSelector from "../common/ThemeSelector";

export default function Pricing() {
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
            <div className="flex items-center justify-center gap-2 md:gap-phi mb-4 md:mb-phi-lg">
              <Coffee
                className="w-5 h-5 md:w-8 md:h-8"
                style={{ color: "var(--color-accent-500)" }}
              />
              <h1
                className="text-xl md:text-4xl font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Support Retreat
              </h1>
            </div>
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
                      Email us your details
                    </h4>
                    <p
                      className="text-xs md:text-phi-sm mb-3 md:mb-phi"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      After purchasing, send an email with your Buy Me a Coffee
                      username and the email you use for Retreat.
                    </p>
                    <a
                      href="mailto:support@retreat-app.tech?subject=Retreat Sponsor Activation&body=Buy Me a Coffee Username: %0D%0ARetreat Email: "
                      className="inline-flex items-center justify-center gap-2 md:gap-phi px-3 md:px-phi py-2 md:py-phi-sm rounded-phi-md text-xs md:text-phi-sm font-medium transition-all duration-200 hover-lift"
                      style={{
                        background: "var(--color-accent-500)",
                        color: "white",
                      }}
                    >
                      <Mail className="w-4 h-4" />
                      Send Email
                    </a>
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
                      Get up to 50 receipts
                    </h4>
                    <p
                      className="text-xs md:text-phi-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      We'll verify your sponsorship and upgrade your account to
                      50 receipts and premium features within 24 hours!
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
