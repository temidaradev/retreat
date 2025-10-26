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
        className="flex-1 flex items-center justify-center px-4 md:px-phi-lg py-12 md:py-phi-2xl relative"
        style={{ zIndex: 1 }}
      >
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-phi-2xl">
            {/* Left side - Content */}
            <div className="flex-1 text-center lg:text-left">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 border rounded-full px-3 py-2 mb-6 animate-fade-in"
                style={{
                  background: "var(--color-info-bg)",
                  borderColor: "rgba(96, 165, 250, 0.3)",
                }}
              >
                <Zap
                  className="w-4 h-4"
                  style={{ color: "var(--color-accent-400)" }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--color-accent-400)" }}
                >
                  Automated Receipt Management
                </span>
              </div>

              {/* Headline */}
              <h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 animate-fade-in stagger-1 leading-tight"
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
                className="text-base md:text-lg lg:text-xl mb-8 animate-fade-in stagger-2 leading-relaxed max-w-2xl mx-auto lg:mx-0"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Automatically track warranties, get expiry reminders, and never
                miss a claim. Just forward your receipts and let us handle the
                rest.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8 animate-fade-in stagger-3">
                <SignInButton mode="modal">
                  <button className="group px-8 py-4 rounded-full font-semibold text-base transition-all duration-200 hover-lift bg-accent-gradient shadow-accent-glow text-white flex items-center justify-center gap-2">
                    Get Started Free
                    <TrendingUp className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </SignInButton>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 animate-fade-in stagger-4">
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className="w-5 h-5"
                    style={{ color: "var(--color-success)" }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Free Forever
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className="w-5 h-5"
                    style={{ color: "var(--color-success)" }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    No Credit Card
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className="w-5 h-5"
                    style={{ color: "var(--color-success)" }}
                  />
                  <span
                    className="text-sm"
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
          <div className="mt-20 md:mt-32">
            <div className="text-center mb-12">
              <h2
                className="text-3xl md:text-4xl font-bold mb-4"
                style={{ color: "var(--color-text-primary)" }}
              >
                How It Works
              </h2>
              <p
                className="text-lg max-w-2xl mx-auto"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Three simple steps to never lose track of your warranties again
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connecting line */}
              <div
                className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 opacity-20"
                style={{ background: "var(--color-accent-400)" }}
              />

              {/* Step 1 */}
              <div className="relative">
                <div className="card-modern p-8 text-center hover:scale-105 transition-transform duration-300">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10"
                    style={{ background: "var(--color-accent-500)" }}
                  >
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <div
                    className="absolute top-8 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                    style={{
                      background: "var(--color-accent-500)",
                      color: "white",
                    }}
                  >
                    1
                  </div>
                  <h3
                    className="text-xl font-bold mb-3"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Forward Emails
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Simply forward your purchase emails to{" "}
                    <span
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
                <div className="card-modern p-8 text-center hover:scale-105 transition-transform duration-300">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10"
                    style={{ background: "var(--color-accent-500)" }}
                  >
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <div
                    className="absolute top-8 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                    style={{
                      background: "var(--color-accent-500)",
                      color: "white",
                    }}
                  >
                    2
                  </div>
                  <h3
                    className="text-xl font-bold mb-3"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Auto-Extract Data
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    We automatically extract warranty info, purchase details,
                    and expiry dates
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="card-modern p-8 text-center hover:scale-105 transition-transform duration-300">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10"
                    style={{ background: "var(--color-accent-500)" }}
                  >
                    <Bell className="w-8 h-8 text-white" />
                  </div>
                  <div
                    className="absolute top-8 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                    style={{
                      background: "var(--color-accent-500)",
                      color: "white",
                    }}
                  >
                    3
                  </div>
                  <h3
                    className="text-xl font-bold mb-3"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Get Reminders
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Receive timely notifications before your warranties expire
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-20 md:mt-32">
            <div className="text-center mb-12">
              <h2
                className="text-3xl md:text-4xl font-bold mb-4"
                style={{ color: "var(--color-text-primary)" }}
              >
                Powerful Features
              </h2>
              <p
                className="text-lg max-w-2xl mx-auto"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Everything you need to manage your receipts and warranties
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Free Features */}
              <div className="card-modern p-6 hover:scale-105 transition-transform duration-300">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: "var(--color-info-bg)" }}
                >
                  <Upload
                    className="w-6 h-6"
                    style={{ color: "var(--color-accent-400)" }}
                  />
                </div>
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Email & PDF Upload
                </h3>
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Forward emails or upload PDF receipts. We'll parse them
                  automatically.
                </p>
                <span
                  className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: "var(--color-success-bg)",
                    color: "var(--color-success)",
                  }}
                >
                  Free
                </span>
              </div>

              <div className="card-modern p-6 hover:scale-105 transition-transform duration-300">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: "var(--color-success-bg)" }}
                >
                  <Shield
                    className="w-6 h-6"
                    style={{ color: "var(--color-success)" }}
                  />
                </div>
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Warranty Tracking
                </h3>
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Track all your warranties in one place. Never miss a claim
                  deadline.
                </p>
                <span
                  className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: "var(--color-success-bg)",
                    color: "var(--color-success)",
                  }}
                >
                  Free
                </span>
              </div>

              <div className="card-modern p-6 hover:scale-105 transition-transform duration-300">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: "var(--color-warning-bg)" }}
                >
                  <Bell
                    className="w-6 h-6"
                    style={{ color: "var(--color-warning)" }}
                  />
                </div>
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Smart Reminders
                </h3>
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Get notified before warranties expire so you can claim them in
                  time.
                </p>
                <span
                  className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium"
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
                className="card-modern p-6 hover:scale-105 transition-transform duration-300 relative overflow-hidden border-2"
                style={{ borderColor: "rgba(168, 85, 247, 0.3)" }}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
                  }}
                >
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <h3
                  className="text-lg font-bold mb-2 flex items-center gap-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Unlimited Receipts
                  <Crown
                    className="w-5 h-5"
                    style={{ color: "var(--color-accent-400)" }}
                  />
                </h3>
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Store unlimited receipts. Free plan limited to 10 receipts.
                </p>
                <span
                  className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium shadow-accent-glow"
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
                className="card-modern p-6 hover:scale-105 transition-transform duration-300 relative overflow-hidden border-2"
                style={{ borderColor: "rgba(168, 85, 247, 0.3)" }}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
                  }}
                >
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3
                  className="text-lg font-bold mb-2 flex items-center gap-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Export Data
                  <Crown
                    className="w-5 h-5"
                    style={{ color: "var(--color-accent-400)" }}
                  />
                </h3>
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Export all your receipts and warranty data in multiple
                  formats.
                </p>
                <span
                  className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium shadow-accent-glow"
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
                className="card-modern p-6 hover:scale-105 transition-transform duration-300 relative overflow-hidden border-2"
                style={{ borderColor: "rgba(168, 85, 247, 0.3)" }}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
                  }}
                >
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3
                  className="text-lg font-bold mb-2 flex items-center gap-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Priority Support
                  <Crown
                    className="w-5 h-5"
                    style={{ color: "var(--color-accent-400)" }}
                  />
                </h3>
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Get direct support from the developer. Fast response times
                  guaranteed.
                </p>
                <span
                  className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium shadow-accent-glow"
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
          <div className="mt-20 md:mt-32 text-center">
            <div
              className="card-modern p-12 md:p-16"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
              }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                Ready to Get Started?
              </h2>
              <p className="text-lg mb-8 text-white opacity-90 max-w-2xl mx-auto">
                Free forever with 10 receipts. Need more? Sponsor us for 3
                premium perks!
              </p>

              {/* Premium perks list */}
              <div className="flex flex-wrap justify-center gap-6 mb-8 max-w-2xl mx-auto">
                <div className="flex items-center gap-2 text-white">
                  <Crown className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Unlimited Receipts
                  </span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Crown className="w-5 h-5" />
                  <span className="text-sm font-medium">Export Data</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Crown className="w-5 h-5" />
                  <span className="text-sm font-medium">Priority Support</span>
                </div>
              </div>

              <SignInButton mode="modal">
                <button
                  className="px-10 py-4 rounded-full font-bold text-lg transition-all duration-200 hover-lift bg-white flex items-center justify-center gap-2 mx-auto"
                  style={{ color: "var(--color-accent-500)" }}
                >
                  Get Started Free
                  <TrendingUp className="w-5 h-5" />
                </button>
              </SignInButton>
              <p className="text-sm mt-4 text-white opacity-70">
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="px-4 md:px-phi-lg py-8 md:py-phi-xl border-t relative mt-20"
        style={{ borderColor: "var(--color-border)", zIndex: 1 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo and tagline */}
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--color-accent-500)" }}
                >
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <span
                  className="text-xl font-bold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Retreat
                </span>
              </div>
              <p
                className="text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Never lose your receipts again
              </p>
            </div>

            {/* Trust badges */}
            <div
              className="flex flex-wrap justify-center gap-4 text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle
                  className="w-4 h-4"
                  style={{ color: "var(--color-success)" }}
                />
                <span>Free Forever</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield
                  className="w-4 h-4"
                  style={{ color: "var(--color-success)" }}
                />
                <span>10 Receipts Included</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown
                  className="w-4 h-4"
                  style={{ color: "var(--color-accent-400)" }}
                />
                <span>Sponsor for More</span>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="mt-8 pt-6 border-t text-center"
            style={{ borderColor: "var(--color-border)" }}
          >
            <p
              className="text-sm mb-3"
              style={{ color: "var(--color-text-secondary)" }}
            >
              💙 Built by a young developer. I can't receive payments via Stripe
              yet, so I use Buy Me a Coffee. Thanks for understanding!
            </p>
            <p
              className="text-sm"
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
