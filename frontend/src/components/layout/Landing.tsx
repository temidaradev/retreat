import { SignInButton } from "@clerk/clerk-react";
import {
  Receipt,
  Shield,
  Clock,
  Upload,
  Zap,
  TrendingUp,
  CheckCircle,
  Mail,
  FileText,
  Bell,
  Crown,
} from "lucide-react";
import ThemeSelector from "../common/ThemeSelector";

export default function Landing() {
  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "var(--color-bg-primary)" }}
    >
      {/* Header - Clean and minimal */}
      <header
        className="px-4 md:px-phi-lg py-3 md:py-phi flex justify-between items-center relative border-b backdrop-blur-modern"
        style={{ borderColor: "var(--color-border)", zIndex: 50 }}
      >
        <div className="flex items-center gap-2 md:gap-phi">
          <div
            className="w-8 h-8 md:icon-phi-md rounded-lg md:rounded-phi-md flex items-center justify-center"
            style={{ background: "var(--color-accent-500)" }}
          >
            <Receipt className="w-4 h-4 md:w-6 md:h-6 text-white" />
          </div>
          <span
            className="text-base md:text-phi-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Retreat
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSelector />
          <SignInButton mode="modal">
            <button
              className="px-4 md:px-phi py-2 md:py-phi-sm text-sm md:text-phi-sm rounded-full md:rounded-phi-md font-medium transition-all duration-200 border hover-lift"
              style={{
                background: "var(--color-bg-secondary)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            >
              Sign In
            </button>
          </SignInButton>
        </div>
      </header>

      {/* Hero Section */}
      <main
        className="flex-1 flex items-center justify-center px-4 md:px-8 lg:px-phi-lg py-8 sm:py-12 md:py-16 lg:py-phi-2xl relative"
        style={{ zIndex: 1 }}
      >
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12 lg:gap-phi-2xl">
            {/* Left side - Content */}
            <div className="flex-1 text-center lg:text-left">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 border rounded-full px-3 py-1.5 mb-4 sm:mb-6 animate-fade-in text-xs sm:text-sm"
                style={{
                  background: "var(--color-info-bg)",
                  borderColor: "rgba(96, 165, 250, 0.3)",
                }}
              >
                <Zap
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                  style={{ color: "var(--color-accent-400)" }}
                />
                <span
                  className="font-medium whitespace-nowrap"
                  style={{ color: "var(--color-accent-400)" }}
                >
                  Automated Receipt Management
                </span>
              </div>

              {/* Headline */}
              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-4 sm:mb-6 animate-fade-in stagger-1 leading-tight px-2 sm:px-0"
                style={{ color: "var(--color-text-primary)" }}
              >
                Never Lose
                <br />
                <span style={{ color: "var(--color-accent-400)" }}>
                  Your Receipts
                </span>
                <br />
                Again
              </h1>

              {/* Subtitle */}
              <p
                className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 animate-fade-in stagger-2 leading-relaxed max-w-2xl mx-auto lg:mx-0 px-2 sm:px-0"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Automatically track warranties, get expiry reminders, and never
                miss a claim. Just forward your receipts and let us handle the
                rest.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-6 sm:mb-8 animate-fade-in stagger-3 px-4 sm:px-0">
                <SignInButton mode="modal">
                  <button className="group px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-sm sm:text-base transition-all duration-200 hover-lift bg-accent-gradient shadow-accent-glow text-white flex items-center justify-center gap-2 w-full sm:w-auto">
                    Get Started Free
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </SignInButton>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 md:gap-6 animate-fade-in stagger-4 px-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle
                    className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                    style={{ color: "var(--color-success)" }}
                  />
                  <span
                    className="text-xs sm:text-sm whitespace-nowrap"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Free Forever
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle
                    className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                    style={{ color: "var(--color-success)" }}
                  />
                  <span
                    className="text-xs sm:text-sm whitespace-nowrap"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    No Credit Card
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle
                    className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                    style={{ color: "var(--color-success)" }}
                  />
                  <span
                    className="text-xs sm:text-sm whitespace-nowrap"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    10 Receipts Included
                  </span>
                </div>
              </div>
            </div>

            {/* Right side - Visual element */}
            <div className="flex-1 relative animate-fade-in stagger-2 hidden lg:block">
              <div className="relative">
                {/* Floating receipt cards mockup */}
                <div
                  className="card-modern p-6 mb-4 animate-float"
                  style={{
                    animationDelay: "0s",
                    animationDuration: "3s",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ background: "var(--color-success-bg)" }}
                    >
                      <Receipt
                        className="w-6 h-6"
                        style={{ color: "var(--color-success)" }}
                      />
                    </div>
                    <div className="flex-1">
                      <div
                        className="h-3 rounded"
                        style={{
                          background: "var(--color-text-primary)",
                          width: "60%",
                          marginBottom: "8px",
                        }}
                      />
                      <div
                        className="h-2 rounded"
                        style={{
                          background: "var(--color-text-tertiary)",
                          width: "40%",
                        }}
                      />
                    </div>
                    <div
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: "var(--color-success-bg)",
                        color: "var(--color-success)",
                      }}
                    >
                      Active
                    </div>
                  </div>
                </div>

                <div
                  className="card-modern p-6 mb-4 animate-float"
                  style={{
                    animationDelay: "1s",
                    animationDuration: "3.5s",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ background: "var(--color-warning-bg)" }}
                    >
                      <Clock
                        className="w-6 h-6"
                        style={{ color: "var(--color-warning)" }}
                      />
                    </div>
                    <div className="flex-1">
                      <div
                        className="h-3 rounded"
                        style={{
                          background: "var(--color-text-primary)",
                          width: "70%",
                          marginBottom: "8px",
                        }}
                      />
                      <div
                        className="h-2 rounded"
                        style={{
                          background: "var(--color-text-tertiary)",
                          width: "50%",
                        }}
                      />
                    </div>
                    <div
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: "var(--color-warning-bg)",
                        color: "var(--color-warning)",
                      }}
                    >
                      Expiring
                    </div>
                  </div>
                </div>

                <div
                  className="card-modern p-6 animate-float"
                  style={{
                    animationDelay: "2s",
                    animationDuration: "4s",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ background: "var(--color-info-bg)" }}
                    >
                      <Shield
                        className="w-6 h-6"
                        style={{ color: "var(--color-accent-400)" }}
                      />
                    </div>
                    <div className="flex-1">
                      <div
                        className="h-3 rounded"
                        style={{
                          background: "var(--color-text-primary)",
                          width: "55%",
                          marginBottom: "8px",
                        }}
                      />
                      <div
                        className="h-2 rounded"
                        style={{
                          background: "var(--color-text-tertiary)",
                          width: "35%",
                        }}
                      />
                    </div>
                    <div
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: "var(--color-info-bg)",
                        color: "var(--color-accent-400)",
                      }}
                    >
                      Protected
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="mt-12 sm:mt-16 md:mt-24 lg:mt-32">
            <div className="text-center mb-8 sm:mb-10 md:mb-12 px-4">
              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4"
                style={{ color: "var(--color-text-primary)" }}
              >
                How It Works
              </h2>
              <p
                className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-2"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Three simple steps to never lose track of your warranties again
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative px-4 sm:px-0">
              {/* Connecting line */}
              <div
                className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 opacity-20"
                style={{ background: "var(--color-accent-400)" }}
              />

              {/* Step 1 */}
              <div className="relative">
                <div className="card-modern p-6 sm:p-8 text-center hover:scale-105 transition-transform duration-300">
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10"
                    style={{ background: "var(--color-accent-500)" }}
                  >
                    <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div
                    className="absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-base sm:text-lg"
                    style={{
                      background: "var(--color-accent-500)",
                      color: "white",
                    }}
                  >
                    1
                  </div>
                  <h3
                    className="text-lg sm:text-xl font-bold mb-2 sm:mb-3"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Forward Emails
                  </h3>
                  <p
                    className="text-xs sm:text-sm leading-relaxed"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Simply forward your purchase emails to{" "}
                    <span
                      className="break-all"
                      style={{
                        color: "var(--color-accent-400)",
                        fontWeight: 600,
                      }}
                    >
                      save@receiptlocker.com
                    </span>
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="card-modern p-6 sm:p-8 text-center hover:scale-105 transition-transform duration-300">
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10"
                    style={{ background: "var(--color-accent-500)" }}
                  >
                    <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div
                    className="absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-base sm:text-lg"
                    style={{
                      background: "var(--color-accent-500)",
                      color: "white",
                    }}
                  >
                    2
                  </div>
                  <h3
                    className="text-lg sm:text-xl font-bold mb-2 sm:mb-3"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Auto-Extract Data
                  </h3>
                  <p
                    className="text-xs sm:text-sm leading-relaxed"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    We automatically extract warranty info, purchase details,
                    and expiry dates
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="card-modern p-6 sm:p-8 text-center hover:scale-105 transition-transform duration-300">
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative z-10"
                    style={{ background: "var(--color-accent-500)" }}
                  >
                    <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div
                    className="absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-base sm:text-lg"
                    style={{
                      background: "var(--color-accent-500)",
                      color: "white",
                    }}
                  >
                    3
                  </div>
                  <h3
                    className="text-lg sm:text-xl font-bold mb-2 sm:mb-3"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Get Reminders
                  </h3>
                  <p
                    className="text-xs sm:text-sm leading-relaxed"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Receive timely notifications before your warranties expire
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-12 sm:mt-16 md:mt-24 lg:mt-32">
            <div className="text-center mb-8 sm:mb-10 md:mb-12 px-4">
              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4"
                style={{ color: "var(--color-text-primary)" }}
              >
                Powerful Features
              </h2>
              <p
                className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-2"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Everything you need to manage your receipts and warranties
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-0">
              {/* Free Features */}
              <div className="card-modern p-5 sm:p-6 hover:scale-105 transition-transform duration-300">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-4"
                  style={{ background: "var(--color-info-bg)" }}
                >
                  <Upload
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    style={{ color: "var(--color-accent-400)" }}
                  />
                </div>
                <h3
                  className="text-base sm:text-lg font-bold mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Email & PDF Upload
                </h3>
                <p
                  className="text-xs sm:text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Forward emails or upload PDF receipts. We'll parse them
                  automatically.
                </p>
                <span
                  className="inline-block mt-3 px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: "var(--color-success-bg)",
                    color: "var(--color-success)",
                  }}
                >
                  Free
                </span>
              </div>

              <div className="card-modern p-5 sm:p-6 hover:scale-105 transition-transform duration-300">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-4"
                  style={{ background: "var(--color-success-bg)" }}
                >
                  <Shield
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    style={{ color: "var(--color-success)" }}
                  />
                </div>
                <h3
                  className="text-base sm:text-lg font-bold mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Warranty Tracking
                </h3>
                <p
                  className="text-xs sm:text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Track all your warranties in one place. Never miss a claim
                  deadline.
                </p>
                <span
                  className="inline-block mt-3 px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: "var(--color-success-bg)",
                    color: "var(--color-success)",
                  }}
                >
                  Free
                </span>
              </div>

              <div className="card-modern p-5 sm:p-6 hover:scale-105 transition-transform duration-300">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-4"
                  style={{ background: "var(--color-warning-bg)" }}
                >
                  <Bell
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    style={{ color: "var(--color-warning)" }}
                  />
                </div>
                <h3
                  className="text-base sm:text-lg font-bold mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Smart Reminders
                </h3>
                <p
                  className="text-xs sm:text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Get notified before warranties expire so you can claim them in
                  time.
                </p>
                <span
                  className="inline-block mt-3 px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: "var(--color-success-bg)",
                    color: "var(--color-success)",
                  }}
                >
                  Free
                </span>
              </div>

              {/* Premium Features */}
              <div
                className="card-modern p-5 sm:p-6 hover:scale-105 transition-transform duration-300 relative overflow-hidden border-2"
                style={{ borderColor: "rgba(168, 85, 247, 0.3)" }}
              >
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-4"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
                  }}
                >
                  <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3
                  className="text-base sm:text-lg font-bold mb-2 flex items-center gap-1.5 sm:gap-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Unlimited Receipts
                  <Crown
                    className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                    style={{ color: "var(--color-accent-400)" }}
                  />
                </h3>
                <p
                  className="text-xs sm:text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Store unlimited receipts. Free plan limited to 10 receipts.
                </p>
                <span
                  className="inline-block mt-3 px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium shadow-accent-glow"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
                    color: "white",
                    fontWeight: "600",
                  }}
                >
                  ⭐ Sponsor Only
                </span>
              </div>

              <div
                className="card-modern p-5 sm:p-6 hover:scale-105 transition-transform duration-300 relative overflow-hidden border-2"
                style={{ borderColor: "rgba(168, 85, 247, 0.3)" }}
              >
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-4"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
                  }}
                >
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3
                  className="text-base sm:text-lg font-bold mb-2 flex items-center gap-1.5 sm:gap-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Export Data
                  <Crown
                    className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                    style={{ color: "var(--color-accent-400)" }}
                  />
                </h3>
                <p
                  className="text-xs sm:text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Export all your receipts and warranty data in multiple
                  formats.
                </p>
                <span
                  className="inline-block mt-3 px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium shadow-accent-glow"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
                    color: "white",
                    fontWeight: "600",
                  }}
                >
                  ⭐ Sponsor Only
                </span>
              </div>

              <div
                className="card-modern p-5 sm:p-6 hover:scale-105 transition-transform duration-300 relative overflow-hidden border-2"
                style={{ borderColor: "rgba(168, 85, 247, 0.3)" }}
              >
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-4"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
                  }}
                >
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3
                  className="text-base sm:text-lg font-bold mb-2 flex items-center gap-1.5 sm:gap-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Priority Support
                  <Crown
                    className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                    style={{ color: "var(--color-accent-400)" }}
                  />
                </h3>
                <p
                  className="text-xs sm:text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Get direct support from the developer. Fast response times
                  guaranteed.
                </p>
                <span
                  className="inline-block mt-3 px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium shadow-accent-glow"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
                    color: "white",
                    fontWeight: "600",
                  }}
                >
                  ⭐ Sponsor Only
                </span>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="mt-12 sm:mt-16 md:mt-24 lg:mt-32 text-center px-4 sm:px-0">
            <div
              className="card-modern p-8 sm:p-10 md:p-12 lg:p-16"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
              }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-white px-2">
                Ready to Get Started?
              </h2>
              <p className="text-sm sm:text-base md:text-lg mb-6 sm:mb-8 text-white opacity-90 max-w-2xl mx-auto px-2">
                Free forever with 10 receipts. Need more? Sponsor us for 3
                premium perks!
              </p>

              {/* Premium perks list */}
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
                <div className="flex items-center gap-1.5 sm:gap-2 text-white">
                  <Crown className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                    Unlimited Receipts
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-white">
                  <Crown className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                    Export Data
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-white">
                  <Crown className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                    Priority Support
                  </span>
                </div>
              </div>

              <SignInButton mode="modal">
                <button
                  className="px-8 sm:px-10 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg transition-all duration-200 hover-lift bg-white flex items-center justify-center gap-2 mx-auto w-full sm:w-auto max-w-xs"
                  style={{ color: "var(--color-accent-500)" }}
                >
                  Get Started Free
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </SignInButton>
              <p className="text-xs sm:text-sm mt-3 sm:mt-4 text-white opacity-70">
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="px-4 md:px-8 lg:px-phi-lg py-6 sm:py-8 md:py-phi-xl border-t relative mt-12 sm:mt-16 md:mt-20"
        style={{ borderColor: "var(--color-border)", zIndex: 1 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
            {/* Logo and tagline */}
            <div className="flex flex-col items-center md:items-start gap-1.5 sm:gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--color-accent-500)" }}
                >
                  <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span
                  className="text-lg sm:text-xl font-bold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Retreat
                </span>
              </div>
              <p
                className="text-xs sm:text-sm text-center md:text-left"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Never lose your receipts again
              </p>
            </div>

            {/* Trust badges */}
            <div
              className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
                  style={{ color: "var(--color-success)" }}
                />
                <span className="whitespace-nowrap">Free Forever</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Shield
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
                  style={{ color: "var(--color-success)" }}
                />
                <span className="whitespace-nowrap">10 Receipts Included</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Crown
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
                  style={{ color: "var(--color-accent-400)" }}
                />
                <span className="whitespace-nowrap">Sponsor for More</span>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t text-center"
            style={{ borderColor: "var(--color-border)" }}
          >
            <p
              className="text-xs sm:text-sm mb-2 sm:mb-3 px-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              💙 Built by a young developer. I can't receive payments via Stripe
              yet, so I use Buy Me a Coffee. Thanks for understanding!
            </p>
            <p
              className="text-xs sm:text-sm"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              © {new Date().getFullYear()} Retreat. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
