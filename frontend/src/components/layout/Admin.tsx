import { useAuth } from "@clerk/clerk-react";
import {
  Receipt,
  Users,
  Crown,
  TrendingUp,
  Database,
  Settings,
  ArrowLeft,
  Plus,
  RefreshCw,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../../services/api";
import ThemeSelector from "../common/ThemeSelector";

interface DashboardStats {
  total_receipts: number;
  active_subscriptions: number;
  bmc_linked_users: number;
  receipts_by_status: Record<string, number>;
}

interface Subscription {
  id: string;
  user_id?: string;
  clerk_user_id?: string;
  plan: string;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
  updated_at: string;
}

interface BMCUser {
  clerk_user_id: string;
  bmc_username: string;
  created_at: string;
  updated_at: string;
}

interface EnhancedError {
  message?: string;
  user_id?: string;
  email?: string;
  config_help?: string;
}

export default function Admin() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<"dashboard" | "subscriptions" | "bmc" | "system">("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enhancedError, setEnhancedError] = useState<EnhancedError | null>(null);
  const [copied, setCopied] = useState(false);

  // Dashboard state
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState<string>("");
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [durationMonths, setDurationMonths] = useState(1);
  const [processing, setProcessing] = useState(false);

  // BMC state
  const [bmcUsers, setBmcUsers] = useState<BMCUser[]>([]);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkClerkId, setLinkClerkId] = useState("");
  const [linkBmcUsername, setLinkBmcUsername] = useState("");

  // System info state
  const [systemInfo, setSystemInfo] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [activeTab, subscriptionStatusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      setEnhancedError(null);
      const token = await getToken();
      apiService.setAuthToken(token);

      if (activeTab === "dashboard") {
        const response = await apiService.getAdminDashboard();
        setStats(response.data);
      } else if (activeTab === "subscriptions") {
        const response = await apiService.getAdminSubscriptions(subscriptionStatusFilter || undefined);
        setSubscriptions(response.data);
      } else if (activeTab === "bmc") {
        const response = await apiService.getBMCUsers();
        setBmcUsers(response.data);
      } else if (activeTab === "system") {
        const response = await apiService.getSystemInfo();
        setSystemInfo(response.data);
      }
    } catch (err: any) {
      console.error("Failed to load admin data:", err);
      const errorMessage = err.message || "Failed to load data";
      
      if (err.status === 403 || err.status === 401 || errorMessage.includes("Admin access required") || errorMessage.includes("admin") || errorMessage.includes("Admin")) {
        // Enhanced error handling - extract additional info from API response
        const enhanced: EnhancedError = {
          message: err.message || errorMessage,
          user_id: err.user_id,
          email: err.email,
          config_help: err.config_help,
        };
        
        setEnhancedError(enhanced);
        setError(errorMessage || "Admin access required");
      } else {
        setEnhancedError(null);
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGrantSubscription = async () => {
    if (!selectedUserId.trim()) {
      alert("Please enter a Clerk User ID");
      return;
    }

    // Validate Clerk User ID format
    if (!selectedUserId.startsWith("user_")) {
      alert("Invalid Clerk User ID format. It should start with 'user_'");
      return;
    }

    try {
      setProcessing(true);
      const token = await getToken();
      apiService.setAuthToken(token);
      const response = await apiService.grantSubscription(selectedUserId, durationMonths);
      
      // Close modal and reset form
      setGrantModalOpen(false);
      setSelectedUserId("");
      setDurationMonths(1);
      
      // Refresh the subscriptions list
      await loadData();
      
      // Show success message with details
      const expiresAt = response.data?.expires_at 
        ? new Date(response.data.expires_at).toLocaleDateString()
        : 'N/A';
      alert(`✅ Premium subscription granted successfully!\n\nUser: ${selectedUserId}\nDuration: ${durationMonths} month(s)\nExpires: ${expiresAt}`);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to grant subscription";
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleRevokeSubscription = async () => {
    if (!selectedUserId.trim()) {
      alert("Please enter a Clerk User ID");
      return;
    }

    if (!confirm(`Are you sure you want to revoke the subscription for ${selectedUserId}?`)) {
      return;
    }

    try {
      setProcessing(true);
      const token = await getToken();
      apiService.setAuthToken(token);
      await apiService.revokeSubscription(selectedUserId);
      setRevokeModalOpen(false);
      setSelectedUserId("");
      await loadData();
      alert("Subscription revoked successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to revoke subscription");
    } finally {
      setProcessing(false);
    }
  };

  const handleLinkBMC = async () => {
    if (!linkClerkId.trim() || !linkBmcUsername.trim()) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setProcessing(true);
      const token = await getToken();
      apiService.setAuthToken(token);
      await apiService.linkBMCUsername(linkClerkId, linkBmcUsername);
      setLinkModalOpen(false);
      setLinkClerkId("");
      setLinkBmcUsername("");
      await loadData();
      alert("BMC username linked successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to link BMC username");
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const copyConfigHelp = async () => {
    if (enhancedError?.config_help) {
      await navigator.clipboard.writeText(enhancedError.config_help);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (error && (error.includes("Access denied") || error.includes("Admin access required") || error.includes("admin"))) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--color-bg-primary)" }}>
        <div className="max-w-2xl w-full">
          <div
            className="rounded-phi-lg border p-6 md:p-8"
            style={{
              background: "var(--color-bg-secondary)",
              borderColor: "var(--color-danger)",
            }}
          >
            <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--color-danger)" }} />
            <h1 className="text-2xl font-bold mb-4 text-center" style={{ color: "var(--color-text-primary)" }}>
              Access Denied
            </h1>
            
            {/* Main error message */}
            <div className="mb-6">
              <p className="text-base mb-2 text-center" style={{ color: "var(--color-text-secondary)" }}>
                {enhancedError?.message || error}
              </p>
            </div>

            {/* Enhanced error details */}
            {enhancedError && (
              <div className="space-y-4 mb-6">
                {/* User ID */}
                {enhancedError.user_id && (
                  <div
                    className="rounded-lg p-3 border"
                    style={{
                      background: "var(--color-bg-primary)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <p className="text-xs mb-1 font-medium" style={{ color: "var(--color-text-tertiary)" }}>
                      Your Clerk User ID:
                    </p>
                    <code className="text-sm font-mono" style={{ color: "var(--color-text-primary)" }}>
                      {enhancedError.user_id}
                    </code>
                  </div>
                )}

                {/* Email */}
                {enhancedError.email && (
                  <div
                    className="rounded-lg p-3 border"
                    style={{
                      background: "var(--color-bg-primary)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <p className="text-xs mb-1 font-medium" style={{ color: "var(--color-text-tertiary)" }}>
                      Your Email:
                    </p>
                    <code className="text-sm font-mono" style={{ color: "var(--color-text-primary)" }}>
                      {enhancedError.email}
                    </code>
                  </div>
                )}

                {/* Config Help */}
                {enhancedError.config_help && (
                  <div
                    className="rounded-lg p-4 border"
                    style={{
                      background: "var(--color-warning-bg)",
                      borderColor: "var(--color-warning)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-sm font-semibold mb-2" style={{ color: "var(--color-warning)" }}>
                          Configuration Required
                        </p>
                        <p className="text-xs mb-3" style={{ color: "var(--color-text-secondary)" }}>
                          A backend administrator needs to add your user ID to the admin list. Use the following configuration:
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <code
                        className="block p-3 rounded-md text-xs font-mono overflow-x-auto"
                        style={{
                          background: "var(--color-bg-primary)",
                          color: "var(--color-text-primary)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        {enhancedError.config_help}
                      </code>
                      <button
                        onClick={copyConfigHelp}
                        className="absolute top-2 right-2 p-2 rounded transition-all duration-200 hover-lift"
                        style={{
                          background: copied ? "var(--color-success-bg)" : "var(--color-bg-secondary)",
                          borderColor: copied ? "var(--color-success)" : "var(--color-border)",
                          border: "1px solid",
                        }}
                        title="Copy configuration"
                      >
                        {copied ? (
                          <Check className="w-4 h-4" style={{ color: "var(--color-success)" }} />
                        ) : (
                          <Copy className="w-4 h-4" style={{ color: "var(--color-text-tertiary)" }} />
                        )}
                      </button>
                    </div>
                    <p className="text-xs mt-3" style={{ color: "var(--color-text-tertiary)" }}>
                      Contact your backend administrator to add this to your environment variables.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover-lift"
                style={{ background: "var(--color-accent-500)", color: "white" }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-primary)" }}>
      {/* Header */}
      <header
        className="border-b sticky top-0 z-40 backdrop-blur-modern"
        style={{ borderColor: "var(--color-border)" }}
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
            <span className="text-gray-400 mx-2">|</span>
            <h1 className="text-base md:text-phi-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
              Admin Panel
            </h1>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <main className="px-4 md:px-phi-lg py-6 md:py-phi-xl">
        <div className="max-w-7xl mx-auto">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b" style={{ borderColor: "var(--color-border)" }}>
            {[
              { id: "dashboard", label: "Dashboard", icon: TrendingUp },
              { id: "subscriptions", label: "Subscriptions", icon: Crown },
              { id: "bmc", label: "BMC Users", icon: Users },
              { id: "system", label: "System Info", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === tab.id ? "font-semibold" : ""
                  }`}
                  style={{
                    borderBottomColor: activeTab === tab.id ? "var(--color-accent-500)" : "transparent",
                    color: activeTab === tab.id ? "var(--color-accent-500)" : "var(--color-text-secondary)",
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: "var(--color-accent-500)" }} />
              <p style={{ color: "var(--color-text-secondary)" }}>Loading...</p>
            </div>
          ) : error ? (
            <div className="card-modern p-6 text-center">
              <XCircle className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--color-danger)" }} />
              <p className="mb-4" style={{ color: "var(--color-danger)" }}>{error}</p>
              <button
                onClick={loadData}
                className="px-4 py-2 rounded-lg"
                style={{ background: "var(--color-accent-500)", color: "white" }}
              >
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Dashboard Tab */}
              {activeTab === "dashboard" && stats && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="card-modern p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm mb-1" style={{ color: "var(--color-text-tertiary)" }}>
                            Total Receipts
                          </p>
                          <p className="text-2xl md:text-3xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                            {stats.total_receipts}
                          </p>
                        </div>
                        <Receipt className="w-10 h-10 md:w-12 md:h-12" style={{ color: "var(--color-accent-400)" }} />
                      </div>
                    </div>

                    <div className="card-modern p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm mb-1" style={{ color: "var(--color-text-tertiary)" }}>
                            Active Subscriptions
                          </p>
                          <p className="text-2xl md:text-3xl font-bold" style={{ color: "var(--color-success)" }}>
                            {stats.active_subscriptions}
                          </p>
                        </div>
                        <Crown className="w-10 h-10 md:w-12 md:h-12" style={{ color: "var(--color-success)" }} />
                      </div>
                    </div>

                    <div className="card-modern p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm mb-1" style={{ color: "var(--color-text-tertiary)" }}>
                            BMC Linked Users
                          </p>
                          <p className="text-2xl md:text-3xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                            {stats.bmc_linked_users}
                          </p>
                        </div>
                        <Users className="w-10 h-10 md:w-12 md:h-12" style={{ color: "var(--color-accent-400)" }} />
                      </div>
                    </div>

                    <div className="card-modern p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm mb-1" style={{ color: "var(--color-text-tertiary)" }}>
                            Receipts by Status
                          </p>
                          <div className="mt-2 space-y-1">
                            {stats.receipts_by_status && Object.entries(stats.receipts_by_status).map(([status, count]) => (
                              <div key={status} className="flex items-center justify-between text-xs">
                                <span className="capitalize" style={{ color: "var(--color-text-secondary)" }}>
                                  {status}:
                                </span>
                                <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                                  {count}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Subscriptions Tab */}
              {activeTab === "subscriptions" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSubscriptionStatusFilter("")}
                        className={`px-3 py-1.5 rounded-lg text-sm ${
                          subscriptionStatusFilter === "" ? "font-semibold" : ""
                        }`}
                        style={{
                          background: subscriptionStatusFilter === "" ? "var(--color-accent-500)" : "var(--color-bg-secondary)",
                          color: subscriptionStatusFilter === "" ? "white" : "var(--color-text-primary)",
                        }}
                      >
                        All
                      </button>
                      {["active", "cancelled", "expired"].map((status) => (
                        <button
                          key={status}
                          onClick={() => setSubscriptionStatusFilter(status)}
                          className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                            subscriptionStatusFilter === status ? "font-semibold" : ""
                          }`}
                          style={{
                            background: subscriptionStatusFilter === status ? "var(--color-accent-500)" : "var(--color-bg-secondary)",
                            color: subscriptionStatusFilter === status ? "white" : "var(--color-text-primary)",
                          }}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedUserId("");
                          setDurationMonths(1);
                          setGrantModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover-lift"
                        style={{ background: "var(--color-success)", color: "white", boxShadow: "0 2px 8px rgba(34, 197, 94, 0.3)" }}
                      >
                        <Plus className="w-4 h-4" />
                        Grant Subscription
                      </button>
                    </div>
                  </div>

                  <div className="card-modern overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                            <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                              Clerk User ID
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                              Plan
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                              Period End
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {!subscriptions || subscriptions.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
                                No subscriptions found
                              </td>
                            </tr>
                          ) : (
                            subscriptions.map((sub) => (
                              <tr
                                key={sub.id}
                                className="border-b hover:bg-opacity-50 transition-colors"
                                style={{ borderColor: "var(--color-border)" }}
                              >
                                <td className="px-4 py-3 text-sm font-mono" style={{ color: "var(--color-text-primary)" }}>
                                  {sub.clerk_user_id || sub.user_id || "N/A"}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                                  {sub.plan === "premium" ? "Premium" : sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                      sub.status === "active"
                                        ? "bg-green-900/30 text-green-400"
                                        : sub.status === "cancelled"
                                        ? "bg-red-900/30 text-red-400"
                                        : "bg-gray-700 text-gray-400"
                                    }`}
                                  >
                                    {sub.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                                  {sub.current_period_end ? formatDate(sub.current_period_end) : "N/A"}
                                </td>
                                <td className="px-4 py-3">
                                  {sub.status === "active" && sub.clerk_user_id && (
                                    <button
                                      onClick={() => {
                                        setSelectedUserId(sub.clerk_user_id!);
                                        setRevokeModalOpen(true);
                                      }}
                                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                                      style={{ background: "var(--color-danger)", color: "white" }}
                                    >
                                      Revoke
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* BMC Users Tab */}
              {activeTab === "bmc" && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setLinkClerkId("");
                        setLinkBmcUsername("");
                        setLinkModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ background: "var(--color-accent-500)", color: "white" }}
                    >
                      <LinkIcon className="w-4 h-4" />
                      Link BMC Username
                    </button>
                  </div>

                  <div className="card-modern overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                            <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                              Clerk User ID
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                              BMC Username
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                              Linked At
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                              Last Updated
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {!bmcUsers || bmcUsers.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
                                No BMC linked users found
                              </td>
                            </tr>
                          ) : (
                            bmcUsers.map((user) => (
                              <tr
                                key={user.clerk_user_id}
                                className="border-b hover:bg-opacity-50 transition-colors"
                                style={{ borderColor: "var(--color-border)" }}
                              >
                                <td className="px-4 py-3 text-sm font-mono" style={{ color: "var(--color-text-primary)" }}>
                                  {user.clerk_user_id}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold" style={{ color: "var(--color-accent-400)" }}>
                                  {user.bmc_username}
                                </td>
                                <td className="px-4 py-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                                  {formatDate(user.created_at)}
                                </td>
                                <td className="px-4 py-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                                  {formatDate(user.updated_at)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* System Info Tab */}
              {activeTab === "system" && systemInfo && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Database Status */}
                    <div className="card-modern p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Database className="w-6 h-6" style={{ color: "var(--color-accent-400)" }} />
                        <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                          Database
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                            Status:
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              systemInfo.database.status === "connected"
                                ? "bg-green-900/30 text-green-400"
                                : "bg-red-900/30 text-red-400"
                            }`}
                          >
                            {systemInfo.database.status}
                          </span>
                        </div>
                        {systemInfo.database.version && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                              Version:
                            </span>
                            <span className="text-sm font-mono" style={{ color: "var(--color-text-primary)" }}>
                              {systemInfo.database.version.split(" ")[0]}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Configuration Status */}
                    <div className="card-modern p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Settings className="w-6 h-6" style={{ color: "var(--color-accent-400)" }} />
                        <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                          Configuration
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                            BMC Webhook:
                          </span>
                          {systemInfo.config.bmc_webhook_configured ? (
                            <CheckCircle className="w-5 h-5" style={{ color: "var(--color-success)" }} />
                          ) : (
                            <XCircle className="w-5 h-5" style={{ color: "var(--color-danger)" }} />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                            SMTP:
                          </span>
                          {systemInfo.config.smtp_configured ? (
                            <CheckCircle className="w-5 h-5" style={{ color: "var(--color-success)" }} />
                          ) : (
                            <XCircle className="w-5 h-5" style={{ color: "var(--color-danger)" }} />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                            Environment:
                          </span>
                          <span className="text-sm capitalize" style={{ color: "var(--color-text-primary)" }}>
                            {systemInfo.config.env}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Server Info */}
                  <div className="card-modern p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
                      Server Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                          Port:
                        </span>
                        <p className="text-sm font-mono mt-1" style={{ color: "var(--color-text-primary)" }}>
                          {systemInfo.server.port}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                          Environment:
                        </span>
                        <p className="text-sm capitalize mt-1" style={{ color: "var(--color-text-primary)" }}>
                          {systemInfo.server.env}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                          Dev Mode:
                        </span>
                        <p className="text-sm mt-1" style={{ color: "var(--color-text-primary)" }}>
                          {systemInfo.server.dev_mode ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Grant Subscription Modal */}
      {grantModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setGrantModalOpen(false)}
        >
          <div 
            className="card-modern max-w-md w-full p-6 animate-scale-in" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-bg-secondary)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-6 h-6" style={{ color: "var(--color-success)" }} />
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Grant Premium Subscription
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
                  Clerk User ID <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus-ring transition-all duration-200"
                  style={{
                    background: "var(--color-bg-primary)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                  placeholder="user_xxxxxxxx"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !processing && selectedUserId.trim()) {
                      handleGrantSubscription();
                    }
                  }}
                />
                <p className="text-xs mt-1" style={{ color: "var(--color-text-tertiary)" }}>
                  Enter the Clerk User ID of the user you want to grant premium access to
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
                  Duration (months) <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={durationMonths}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setDurationMonths(Math.max(1, Math.min(12, val)));
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus-ring transition-all duration-200"
                  style={{
                    background: "var(--color-bg-primary)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                />
                <p className="text-xs mt-1" style={{ color: "var(--color-text-tertiary)" }}>
                  Subscription will be active for {durationMonths} month{durationMonths !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setGrantModalOpen(false)}
                disabled={processing}
                className="flex-1 px-4 py-2 border rounded-lg font-medium transition-all duration-200 hover-lift disabled:opacity-50"
                style={{
                  borderColor: "var(--color-border)",
                  background: "transparent",
                  color: "var(--color-text-primary)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGrantSubscription}
                disabled={processing || !selectedUserId.trim()}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  background: "var(--color-success)", 
                  color: "white",
                  boxShadow: processing ? "none" : "0 2px 8px rgba(34, 197, 94, 0.3)",
                }}
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Grant Premium Access
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Subscription Modal */}
      {revokeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setRevokeModalOpen(false)}
        >
          <div className="card-modern max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
              Revoke Subscription
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
                Clerk User ID
              </label>
              <input
                type="text"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                style={{
                  background: "var(--color-bg-primary)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
                placeholder="user_xxxxxxxx"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRevokeModalOpen(false)}
                className="flex-1 px-4 py-2 border rounded-lg font-medium"
                style={{
                  borderColor: "var(--color-border)",
                  background: "transparent",
                  color: "var(--color-text-primary)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeSubscription}
                disabled={processing}
                className="flex-1 px-4 py-2 rounded-lg font-medium"
                style={{ background: "var(--color-danger)", color: "white" }}
              >
                {processing ? "Processing..." : "Revoke"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link BMC Username Modal */}
      {linkModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setLinkModalOpen(false)}
        >
          <div className="card-modern max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
              Link BMC Username
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
                  Clerk User ID
                </label>
                <input
                  type="text"
                  value={linkClerkId}
                  onChange={(e) => setLinkClerkId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{
                    background: "var(--color-bg-primary)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                  placeholder="user_xxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
                  BMC Username
                </label>
                <input
                  type="text"
                  value={linkBmcUsername}
                  onChange={(e) => setLinkBmcUsername(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{
                    background: "var(--color-bg-primary)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                  placeholder="username"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setLinkModalOpen(false)}
                className="flex-1 px-4 py-2 border rounded-lg font-medium"
                style={{
                  borderColor: "var(--color-border)",
                  background: "transparent",
                  color: "var(--color-text-primary)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLinkBMC}
                disabled={processing}
                className="flex-1 px-4 py-2 rounded-lg font-medium"
                style={{ background: "var(--color-accent-500)", color: "white" }}
              >
                {processing ? "Processing..." : "Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

