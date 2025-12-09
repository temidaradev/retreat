import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import ThemeSelector from "../components/common/ThemeSelector";

export default function TermsOfUse() {
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
              <FileText className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <span
              className="text-base md:text-phi-lg font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Terms of Use
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
              Terms of Use
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
              {/* Section 1: General Terms */}
              <section>
                <h2
                  className="text-xl md:text-2xl font-bold mb-4 md:mb-6"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  1. General Terms
                </h2>

                <div className="space-y-4 md:space-y-6">
                  <div>
                    <h3
                      className="text-lg md:text-xl font-semibold mb-3"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      1.1. Service Agreement
                    </h3>
                    <ul
                      className="list-disc list-inside space-y-2 ml-4"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <li className="text-sm md:text-base">
                        These terms govern your use of Retreat receipt
                        management services
                      </li>
                      <li className="text-sm md:text-base">
                        By using our services, you agree to these terms
                      </li>
                      <li className="text-sm md:text-base">
                        We reserve the right to modify these terms at any time.
                        We will notify users of significant changes via email or
                        in-app notification
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3
                      className="text-lg md:text-xl font-semibold mb-3"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      1.2. Service Description
                    </h3>
                    <ul
                      className="list-disc list-inside space-y-2 ml-4"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <li className="text-sm md:text-base">
                        Receipt management services (automatic extraction and
                        storage of receipt data)
                      </li>
                      <li className="text-sm md:text-base">
                        Warranty tracking services (monitoring warranty expiry
                        dates and sending reminders)
                      </li>
                      <li className="text-sm md:text-base">
                        Email forwarding services (receiving and processing
                        forwarded receipt emails)
                      </li>
                      <li className="text-sm md:text-base">
                        Notification services (sending warranty expiry reminders
                        and service updates)
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 2: User Obligations */}
              <section>
                <h2
                  className="text-xl md:text-2xl font-bold mb-4 md:mb-6"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  2. User Obligations
                </h2>

                <div className="space-y-4 md:space-y-6">
                  <div>
                    <h3
                      className="text-lg md:text-xl font-semibold mb-3"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      2.1. Account Security
                    </h3>
                    <ul
                      className="list-disc list-inside space-y-2 ml-4"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <li className="text-sm md:text-base">
                        Maintain account security by using a strong password and
                        enabling two-factor authentication when available
                      </li>
                      <li className="text-sm md:text-base">
                        Report unauthorized access immediately if you suspect
                        your account has been compromised
                      </li>
                      <li className="text-sm md:text-base">
                        Keep credentials confidential and do not share your
                        account with others
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3
                      className="text-lg md:text-xl font-semibold mb-3"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      2.2. Acceptable Use
                    </h3>
                    <ul
                      className="list-disc list-inside space-y-2 ml-4"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <li className="text-sm md:text-base">
                        Legal and ethical use only. Use the service only for
                        managing your own legitimate receipts and warranties
                      </li>
                      <li className="text-sm md:text-base">
                        No malicious activities. Do not attempt to abuse, hack,
                        or disrupt the service
                      </li>
                      <li className="text-sm md:text-base">
                        Resource usage limits. Free accounts are limited to 10
                        receipts. Sponsor accounts may store up to 100 receipts.
                        Excessive usage or abuse may result in account
                        suspension
                      </li>
                      <li className="text-sm md:text-base">
                        Only forward legitimate receipt emails. Do not forward
                        spam, malicious content, or unrelated emails to our
                        receipt processing address
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 3: Service Level Agreement */}
              <section>
                <h2
                  className="text-xl md:text-2xl font-bold mb-4 md:mb-6"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  3. Service Level Agreement
                </h2>

                <div className="space-y-4 md:space-y-6">
                  <div>
                    <h3
                      className="text-lg md:text-xl font-semibold mb-3"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      3.1. Availability
                    </h3>
                    <ul
                      className="list-disc list-inside space-y-2 ml-4"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <li className="text-sm md:text-base">
                        We strive to maintain high availability, but do not
                        guarantee specific uptime percentages
                      </li>
                      <li className="text-sm md:text-base">
                        Scheduled maintenance windows will be announced in
                        advance when possible
                      </li>
                      <li className="text-sm md:text-base">
                        Emergency maintenance may be performed without prior
                        notice to address critical issues
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3
                      className="text-lg md:text-xl font-semibold mb-3"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      3.2. Support
                    </h3>
                    <ul
                      className="list-disc list-inside space-y-2 ml-4"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <li className="text-sm md:text-base">
                        Support is provided through the in-app feedback feature
                        and email
                      </li>
                      <li className="text-sm md:text-base">
                        We aim to respond to support requests in a timely
                        manner, but response times may vary
                      </li>
                      <li className="text-sm md:text-base">
                        Sponsor accounts receive priority support with faster
                        response times
                      </li>
                      <li className="text-sm md:text-base">
                        Issue resolution process: We will work to resolve
                        reported issues, but cannot guarantee resolution of all
                        issues, especially those related to third-party services
                        or user error
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section>
                <h2
                  className="text-xl md:text-2xl font-bold mb-4 md:mb-6"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  4. Limitation of Liability
                </h2>
                <p
                  className="text-sm md:text-base mb-4"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Retreat is provided "as is" without warranties of any kind. We
                  are not responsible for any loss of data, missed warranty
                  claims, or other damages resulting from the use of our
                  service. While we strive for accuracy in receipt data
                  extraction, we cannot guarantee 100% accuracy and recommend
                  verifying important warranty information independently.
                </p>
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
                  If you have any questions about these Terms of Use, please
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
