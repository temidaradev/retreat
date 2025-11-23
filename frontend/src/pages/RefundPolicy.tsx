import { ArrowLeft, Receipt } from "lucide-react";
import { Link } from "react-router-dom";
import ThemeSelector from "../components/common/ThemeSelector";

export default function RefundPolicy() {
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
              <Receipt className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <span
              className="text-base md:text-phi-lg font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Refund Policy
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
              Refund Policy
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
              {/* Section 1: Refund Conditions */}
              <section>
                <h2
                  className="text-xl md:text-2xl font-bold mb-4 md:mb-6"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  1. Refund Conditions
                </h2>
                <ul
                  className="list-disc list-inside space-y-3 ml-4"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <li className="text-sm md:text-base">
                    <strong style={{ color: "var(--color-text-primary)" }}>
                      Full refund right within first 7 days:
                    </strong>{" "}
                    If you are not satisfied with your sponsor subscription, you
                    may request a full refund within 7 days of your initial
                    payment. This applies to new sponsor subscriptions only.
                  </li>
                  <li className="text-sm md:text-base">
                    <strong style={{ color: "var(--color-text-primary)" }}>
                      Partial refund for technical issue-related interruptions:
                    </strong>{" "}
                    If you experience significant service interruptions due to
                    technical issues on our end that prevent you from using core
                    features for an extended period, you may be eligible for a
                    partial refund proportional to the downtime.
                  </li>
                  <li className="text-sm md:text-base">
                    <strong style={{ color: "var(--color-text-primary)" }}>
                      Pro-rata refund for unused service period:
                    </strong>{" "}
                    If you cancel your sponsor subscription mid-term due to
                    circumstances beyond your control (such as our service no
                    longer meeting your needs due to significant changes), we
                    may provide a pro-rata refund for the unused portion of your
                    subscription period at our discretion.
                  </li>
                </ul>
              </section>

              {/* Section 2: Refund Process */}
              <section>
                <h2
                  className="text-xl md:text-2xl font-bold mb-4 md:mb-6"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  2. Refund Process
                </h2>
                <ul
                  className="list-disc list-inside space-y-3 ml-4"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <li className="text-sm md:text-base">
                    <strong style={{ color: "var(--color-text-primary)" }}>
                      Refund request must be submitted in writing:
                    </strong>{" "}
                    To request a refund, please contact us through the in-app
                    feedback feature or email us at{" "}
                    <a
                      href="mailto:support@retreat-app.tech"
                      className="underline"
                      style={{ color: "var(--color-accent-400)" }}
                    >
                      support@retreat-app.tech
                    </a>
                    . Include your account email and reason for the refund
                    request.
                  </li>
                  <li className="text-sm md:text-base">
                    <strong style={{ color: "var(--color-text-primary)" }}>
                      Request is evaluated within 5 business days:
                    </strong>{" "}
                    We will review your refund request and respond within 5
                    business days. We may ask for additional information to
                    process your request.
                  </li>
                  <li className="text-sm md:text-base">
                    <strong style={{ color: "var(--color-text-primary)" }}>
                      Approved refunds are processed within 10 business days:
                    </strong>{" "}
                    Once your refund is approved, we will process the payment
                    within 10 business days. The actual time for the refund to
                    appear in your account may vary depending on your payment
                    provider.
                  </li>
                  <li className="text-sm md:text-base">
                    <strong style={{ color: "var(--color-text-primary)" }}>
                      Refund is made to the same payment method and account used
                      by the customer:
                    </strong>{" "}
                    Refunds will be issued to the original payment method used
                    for the purchase. If that payment method is no longer
                    available, we will work with you to find an alternative
                    refund method.
                  </li>
                </ul>
              </section>

              {/* Section 3: Non-Refundable Cases */}
              <section>
                <h2
                  className="text-xl md:text-2xl font-bold mb-4 md:mb-6"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  3. Non-Refundable Cases
                </h2>
                <ul
                  className="list-disc list-inside space-y-3 ml-4"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <li className="text-sm md:text-base">
                    <strong style={{ color: "var(--color-text-primary)" }}>
                      User-caused issues:
                    </strong>{" "}
                    Refunds will not be provided for issues caused by user
                    error, such as incorrect email forwarding, failure to verify
                    email addresses, or misuse of the service. This includes
                    cases where receipt data extraction fails due to the format
                    or quality of forwarded emails.
                  </li>
                  <li className="text-sm md:text-base">
                    <strong style={{ color: "var(--color-text-primary)" }}>
                      Planned maintenance periods:
                    </strong>{" "}
                    Scheduled maintenance and service updates are not grounds
                    for refunds. We will make reasonable efforts to minimize
                    downtime and provide advance notice when possible.
                  </li>
                  <li className="text-sm md:text-base">
                    <strong style={{ color: "var(--color-text-primary)" }}>
                      Force majeure events:
                    </strong>{" "}
                    Refunds will not be provided for service interruptions
                    caused by events beyond our reasonable control, including
                    but not limited to natural disasters, cyber attacks,
                    third-party service outages, or government actions.
                  </li>
                  <li className="text-sm md:text-base">
                    <strong style={{ color: "var(--color-text-primary)" }}>
                      Free tier services:
                    </strong>{" "}
                    The free tier of Retreat is provided at no cost and is not
                    eligible for refunds. Refund policies apply only to paid
                    sponsor subscriptions.
                  </li>
                </ul>
              </section>

              {/* Additional Information */}
              <section>
                <h2
                  className="text-xl md:text-2xl font-bold mb-4 md:mb-6"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  4. Additional Information
                </h2>
                <div
                  className="space-y-3"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <p className="text-sm md:text-base">
                    All refund decisions are made at our sole discretion. We
                    reserve the right to deny refund requests that do not meet
                    the conditions outlined in this policy.
                  </p>
                  <p className="text-sm md:text-base">
                    If you have questions about whether your situation qualifies
                    for a refund, please contact us before making a purchase
                    decision. We're happy to clarify our refund policy and help
                    you understand what to expect from our service.
                  </p>
                  <p className="text-sm md:text-base">
                    Note: As mentioned in our service, we use Buy Me a Coffee
                    for sponsor payments as we cannot receive payments via
                    Stripe yet. Refund processing may be subject to Buy Me a
                    Coffee's refund policies and processing times.
                  </p>
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
                  If you have any questions about this Refund Policy or wish to
                  request a refund, please contact us through the feedback
                  feature in the app or via email at{" "}
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
