import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import ThemeSelector from "../components/common/ThemeSelector";

export default function PrivacyPolicy() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-bg-primary)" }}
    >
      {/* Header */}
      <header
        className="border-b sticky top-0 z-40 backdrop-blur-modern"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="px-4 md:px-phi-lg py-3 md:py-phi flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-phi">
            <Link
              to="/"
              className="p-2 rounded-lg hover-lift transition-all duration-200"
              style={{
                background: "var(--color-bg-tertiary)",
                color: "var(--color-text-primary)",
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div
              className="w-8 h-8 md:icon-phi-md rounded-lg md:rounded-phi-md flex items-center justify-center"
              style={{ background: "var(--color-accent-500)" }}
            >
              <Shield className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <span
              className="text-base md:text-phi-lg font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Privacy Policy
            </span>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <main className="px-4 md:px-phi-lg py-6 md:py-phi-xl">
        <div className="max-w-4xl mx-auto w-full">
          <div className="card-modern p-6 md:p-8 lg:p-10">
            <h1
              className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8"
              style={{ color: "var(--color-text-primary)" }}
            >
              Privacy Policy
            </h1>
            <p
              className="text-sm md:text-base mb-6 md:mb-8"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            <div className="space-y-6 md:space-y-8">
              {/* Section 1: Data Collection */}
              <section>
                <h2
                  className="text-xl md:text-2xl font-bold mb-4 md:mb-6"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  1. Data Collection
                </h2>

                <div className="space-y-4 md:space-y-6">
                  <div>
                    <h3
                      className="text-lg md:text-xl font-semibold mb-3"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      1.1. Types of Data Collected
                    </h3>
                    <ul
                      className="list-disc list-inside space-y-2 ml-4"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <li className="text-sm md:text-base">
                        Personal identification information (name, email
                        address)
                      </li>
                      <li className="text-sm md:text-base">
                        Contact information (email addresses for receipt
                        forwarding)
                      </li>
                      <li className="text-sm md:text-base">
                        Payment information (processed securely through
                        third-party payment processors)
                      </li>
                      <li className="text-sm md:text-base">
                        Usage data (how you interact with our receipt management
                        services)
                      </li>
                      <li className="text-sm md:text-base">
                        Technical data (device information, browser type, IP
                        address)
                      </li>
                      <li className="text-sm md:text-base">
                        Receipt data (purchase information, warranty details,
                        expiry dates extracted from forwarded emails)
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3
                      className="text-lg md:text-xl font-semibold mb-3"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      1.2. Collection Methods
                    </h3>
                    <ul
                      className="list-disc list-inside space-y-2 ml-4"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <li className="text-sm md:text-base">
                        Direct user input (account registration, email address
                        configuration)
                      </li>
                      <li className="text-sm md:text-base">
                        Automated collection (receipt data extraction from
                        forwarded emails, usage analytics)
                      </li>
                      <li className="text-sm md:text-base">
                        Third-party sources (authentication via Clerk, payment
                        processing data)
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 2: Data Usage */}
              <section>
                <h2
                  className="text-xl md:text-2xl font-bold mb-4 md:mb-6"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  2. Data Usage
                </h2>

                <div className="space-y-4 md:space-y-6">
                  <div>
                    <h3
                      className="text-lg md:text-xl font-semibold mb-3"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      2.1. Purpose of Data Collection
                    </h3>
                    <ul
                      className="list-disc list-inside space-y-2 ml-4"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <li className="text-sm md:text-base">
                        Service provision (receipt storage, warranty tracking,
                        expiry reminders)
                      </li>
                      <li className="text-sm md:text-base">
                        Account management (user authentication, email
                        verification, subscription management)
                      </li>
                      <li className="text-sm md:text-base">
                        Communication (sending warranty expiry notifications,
                        service updates)
                      </li>
                      <li className="text-sm md:text-base">
                        Service improvement (analyzing usage patterns to enhance
                        receipt extraction accuracy and user experience)
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3
                      className="text-lg md:text-xl font-semibold mb-3"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      2.2. Data Processing
                    </h3>
                    <ul
                      className="list-disc list-inside space-y-2 ml-4"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <li className="text-sm md:text-base">
                        Legal basis for processing: Contractual necessity
                        (service delivery), legitimate interest (service
                        improvement), and user consent (optional features)
                      </li>
                      <li className="text-sm md:text-base">
                        Processing methods: Automated receipt parsing, data
                        storage in secure databases, encrypted data transmission
                      </li>
                      <li className="text-sm md:text-base">
                        Data retention period: Receipt data is retained for as
                        long as your account is active. You may delete your
                        account and all associated data at any time.
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 3: Data Protection */}
              <section>
                <h2
                  className="text-xl md:text-2xl font-bold mb-4 md:mb-6"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  3. Data Protection
                </h2>

                <div className="space-y-4 md:space-y-6">
                  <div>
                    <h3
                      className="text-lg md:text-xl font-semibold mb-3"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      3.1. Security Measures
                    </h3>
                    <ul
                      className="list-disc list-inside space-y-2 ml-4"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <li className="text-sm md:text-base">
                        Encryption protocols: All data is encrypted in transit
                        (TLS/SSL) and at rest
                      </li>
                      <li className="text-sm md:text-base">
                        Access controls: Role-based access control, secure
                        authentication via Clerk
                      </li>
                      <li className="text-sm md:text-base">
                        Regular security audits: We conduct periodic security
                        reviews and updates to protect your data
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3
                      className="text-lg md:text-xl font-semibold mb-3"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      3.2. Data Sharing
                    </h3>
                    <ul
                      className="list-disc list-inside space-y-2 ml-4"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <li className="text-sm md:text-base">
                        Third-party processors: We use trusted third-party
                        services for authentication (Clerk), payment processing,
                        and hosting. These services are bound by their own
                        privacy policies and data protection agreements.
                      </li>
                      <li className="text-sm md:text-base">
                        Legal requirements: We may disclose data if required by
                        law or to protect our rights and the safety of our users
                      </li>
                      <li className="text-sm md:text-base">
                        User consent: We will not sell or share your personal
                        data with third parties for marketing purposes without
                        your explicit consent
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Contact Information */}
              <section
                className="mt-8 md:mt-10 pt-6 md:pt-8 border-t"
                style={{ borderColor: "var(--color-border)" }}
              >
                <h2
                  className="text-xl md:text-2xl font-bold mb-4"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Contact Us
                </h2>
                <p
                  className="text-sm md:text-base"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  If you have any questions about this Privacy Policy, please
                  contact us through the feedback feature in the app or via
                  email at{" "}
                  <a
                    href="mailto:support@retreat-app.tech"
                    className="underline"
                    style={{ color: "var(--color-accent-400)" }}
                  >
                    support@retreat-app.tech
                  </a>
                  .
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
