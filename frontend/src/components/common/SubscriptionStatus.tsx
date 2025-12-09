import { UserButton, useAuth } from "@clerk/clerk-react";
import { Crown, ArrowLeft, Coffee, Mail, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { apiService, type SubscriptionData } from "../../services/api";
import { external } from "../../config";

export default function SubscriptionStatus() {
  const { has, isLoaded, getToken } = useAuth();
  const [hasRetreatPlan, setHasRetreatPlan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      apiService.setAuthToken(token);
      const subscription = await apiService.getUserSubscription();
      setHasRetreatPlan(subscription.is_premium);
      setSubscriptionData({
        is_premium: subscription.is_premium,
        plan: subscription.plan || "free",
        receipt_limit: subscription.receipt_limit || 10,
        receipt_count: subscription.receipt_count || 0,
        expires_at: subscription.expires_at,
      });
    } catch (err) {
      console.error("Error checking subscription status:", err);
      // Fallback to Clerk check if backend check fails
      setHasRetreatPlan(has?.({ plan: "retreat" }) ?? false);
      setSubscriptionData({
        is_premium: false,
        plan: "free",
        receipt_limit: 10,
        receipt_count: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="p-phi-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-phi"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const currentPlan =
    subscriptionData?.plan === "premium"
      ? "Premium"
      : hasRetreatPlan
      ? "Sponsor"
      : "Free";
  const planColor =
    hasRetreatPlan || subscriptionData?.is_premium
      ? "var(--color-accent-500)"
      : "var(--color-text-tertiary)";
  const receiptLimit = subscriptionData?.receipt_limit || 10;
  const receiptLimitText = `${receiptLimit} receipts`;

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
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="px-4 md:px-phi-lg py-6 md:py-phi-xl">
        <div className="max-w-4xl mx-auto w-full">
          {/* Hero Section */}
          <div className="text-center mb-8 md:mb-phi-2xl">
            <div className="flex items-center justify-center gap-2 md:gap-phi mb-4 md:mb-phi-lg animate-fade-in">
              {hasRetreatPlan ? (
                <Crown
                  className="w-5 h-5 md:w-8 md:h-8"
                  style={{ color: "var(--color-accent-500)" }}
                />
              ) : (
                <Coffee
                  className="w-5 h-5 md:w-8 md:h-8"
                  style={{ color: "var(--color-accent-500)" }}
                />
              )}
              <h1
                className="text-xl md:text-phi-3xl font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {hasRetreatPlan ? "Sponsor Status" : "Support Retreat"}
              </h1>
            </div>
            <p
              className="text-xs md:text-phi-lg max-w-2xl mx-auto px-2 md:px-4"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {hasRetreatPlan
                ? "Thank you for being a sponsor!"
                : "Help keep Retreat running by becoming a sponsor"}
            </p>
          </div>

          {/* Current Plan Status */}
          <div className="card-modern mb-6 md:mb-phi-xl animate-fade-in stagger-1">
            <div
              className="p-4 md:p-phi-lg border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 md:gap-phi">
                  <Crown
                    className="w-3 h-3 md:w-5 md:h-5"
                    style={{ color: planColor }}
                  />
                  <h3
                    className="text-sm md:text-phi-lg font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Current Plan
                  </h3>
                </div>
                <span
                  className="px-2 md:px-phi py-1 md:py-phi-sm rounded-full text-xs md:text-phi-sm font-medium"
                  style={{
                    background: hasRetreatPlan
                      ? "var(--color-success-bg)"
                      : "var(--color-bg-tertiary)",
                    color: hasRetreatPlan
                      ? "var(--color-success)"
                      : "var(--color-text-tertiary)",
                  }}
                >
                  {currentPlan}
                </span>
              </div>
            </div>

            <div className="p-4 md:p-phi-lg">
              {/* Features */}
              <div className="space-y-3 md:space-y-phi">
                <h4
                  className="text-sm md:text-phi-base font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {hasRetreatPlan ? "Your Benefits" : "Free Plan Features"}
                </h4>

                <div className="space-y-phi-sm">
                  {[
                    {
                      feature: "Receipt Storage",
                      free: "10 receipts",
                      sponsor: receiptLimitText,
                      highlight: true,
                    },
                    {
                      feature: "Email Forwarding",
                      free: true,
                      sponsor: true,
                      highlight: false,
                    },
                    {
                      feature: "PDF Upload",
                      free: true,
                      sponsor: true,
                      highlight: false,
                    },
                    {
                      feature: "Warranty Tracking",
                      free: true,
                      sponsor: true,
                      highlight: false,
                    },
                    {
                      feature: "Smart Reminders",
                      free: true,
                      sponsor: true,
                      highlight: false,
                    },
                    {
                      feature: "Export Data",
                      free: false,
                      sponsor: true,
                      highlight: true,
                    },
                    {
                      feature: "Priority Support",
                      free: false,
                      sponsor: true,
                      highlight: true,
                    },
                  ].map((item, index) => {
                    const hasAccess =
                      hasRetreatPlan || subscriptionData?.is_premium
                        ? item.sponsor
                        : item.free;
                    const displayValue =
                      typeof hasAccess === "string" ? hasAccess : hasAccess;
                    const isPremiumFeature = item.highlight && !hasRetreatPlan;
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-1 md:gap-phi-sm flex-1 min-w-0">
                          <span
                            className="text-xs md:text-phi-sm truncate"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            {item.feature}
                          </span>
                          {isPremiumFeature && (
                            <Crown
                              className="w-3 h-3 flex-shrink-0"
                              style={{ color: "var(--color-accent-500)" }}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2 md:gap-phi flex-shrink-0">
                          {typeof displayValue === "boolean" ? (
                            displayValue ? (
                              <CheckCircle
                                className="w-4 h-4"
                                style={{ color: "var(--color-success)" }}
                              />
                            ) : (
                              <span
                                className="text-xs md:text-phi-xs"
                                style={{ color: "var(--color-text-tertiary)" }}
                              >
                                —
                              </span>
                            )
                          ) : (
                            <span
                              className="text-xs md:text-phi-sm font-medium"
                              style={{ color: "var(--color-text-primary)" }}
                            >
                              {displayValue}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sponsorship Instructions (only show if not already a sponsor) */}
          {!hasRetreatPlan && (
            <div
              className="rounded-phi-lg border overflow-hidden mb-phi-xl"
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
                      className="icon-phi-md rounded-phi-md flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0"
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
                      className="icon-phi-md rounded-phi-md flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0"
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
                        After purchasing, send an email with your Buy Me a
                        Coffee username and the email you use for Retreat.
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
                      className="icon-phi-md rounded-phi-md flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0"
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
                        Get up to 100 receipts
                      </h4>
                      <p
                        className="text-xs md:text-phi-sm"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        We'll verify your sponsorship and upgrade your account
                        to 100 receipts and premium features within 24 hours!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Thank You Message for Sponsors */}
          {hasRetreatPlan && (
            <div
              className="rounded-phi-lg border overflow-hidden"
              style={{
                background: "var(--color-bg-secondary)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="p-phi-xl text-center">
                <Coffee
                  className="w-16 h-16 mx-auto mb-phi"
                  style={{ color: "var(--color-accent-500)" }}
                />
                <h3
                  className="text-phi-xl font-bold mb-phi"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Thank You for Your Support!
                </h3>
                <p
                  className="text-phi-base max-w-xl mx-auto mb-phi"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Your sponsorship helps keep Retreat running and enables us to
                  continue improving the service. If you need any help or have
                  suggestions, please don't hesitate to reach out for priority
                  support!
                </p>
                {subscriptionData?.expires_at && (
                  <p
                    className="text-phi-sm max-w-xl mx-auto"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    Your {currentPlan} plan expires on{" "}
                    {new Date(subscriptionData.expires_at).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
