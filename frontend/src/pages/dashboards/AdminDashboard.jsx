import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import config from "../../config";

const tabs = [
  "overview",
  "user verification",
  "manage accounts",
  "monitoring",
  "feedback",
  "analytics",
];

function formatDate(value) {
  if (!value) {
    return "N/A";
  }
  return new Date(value).toLocaleDateString();
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(localStorage.getItem("activeTab") || "overview");
  const [users, setUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [pendingNgos, setPendingNgos] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const adminId = localStorage.getItem("userId");

  const fetchDashboardData = useCallback(async () => {
    const [usersRes, donationsRes, feedbackRes, pendingRes, analyticsRes] = await Promise.all([
      fetch(`${config.API_URL}/admin/users`),
      fetch(`${config.API_URL}/admin/donations`),
      fetch(`${config.API_URL}/admin/feedback`),
      fetch(`${config.API_URL}/admin/pending-ngos`),
      fetch(`${config.API_URL}/admin/analytics`),
    ]);

    const [usersData, donationsData, feedbackData, pendingData, analyticsData] = await Promise.all([
      usersRes.json(),
      donationsRes.json(),
      feedbackRes.json(),
      pendingRes.json(),
      analyticsRes.json(),
    ]);

    setUsers(Array.isArray(usersData) ? usersData : []);
    setDonations(Array.isArray(donationsData) ? donationsData : []);
    setFeedback(Array.isArray(feedbackData) ? feedbackData : []);
    setPendingNgos(Array.isArray(pendingData) ? pendingData : []);
    setAnalytics(analyticsData || null);
  }, []);

  useEffect(() => {
    fetchDashboardData().catch(() => setMessage("Unable to load admin dashboard data."));
  }, [fetchDashboardData]);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const handleVerification = async (userId, action) => {
    const endpoint = action === "approve" ? "verify-ngo" : "reject-ngo";
    const response = await fetch(`${config.API_URL}/admin/${endpoint}/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ adminId }),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Unable to update NGO verification");
      return;
    }

    setMessage(data.message);
    await fetchDashboardData();
  };

  const totals = useMemo(() => {
    const donors = users.filter((user) => user.role === "Donor").length;
    const ngos = users.filter((user) => user.role === "NGO").length;
    const volunteers = users.filter((user) => user.role === "Volunteer").length;

    return {
      donors,
      ngos,
      volunteers,
    };
  }, [users]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5fbf3_0%,#ffffff_100%)]">
      <div className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-emerald-900">Lakhushya</h1>
            <p className="text-sm text-slate-500">From Giving to Impact</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
          >
            Logout
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-emerald-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Admin Dashboard</p>
          <h2 className="mt-2 text-3xl font-bold text-emerald-950">Verify NGOs, monitor feedback, and run platform operations.</h2>
          <p className="mt-3 max-w-3xl text-sm text-slate-500">
            NGOs are now stored in the database at registration with a pending verification state. Only admin-approved NGOs can be treated as verified.
          </p>
        </section>

        <div className="mt-8 flex gap-2 overflow-x-auto rounded-2xl bg-emerald-50 p-2 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                localStorage.setItem("activeTab", tab);
              }}
              className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium capitalize transition ${
                activeTab === tab ? "bg-white text-emerald-700 shadow" : "text-slate-600 hover:bg-white/70"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {message ? (
          <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
        ) : null}

        {activeTab === "overview" ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-4">
            <StatCard title="Total Users" value={users.length} />
            <StatCard title="Total Donations" value={analytics?.totalDonations || donations.length} />
            <StatCard title="Pending NGO Verifications" value={pendingNgos.length} />
            <StatCard title="Feedback Entries" value={feedback.length} />
          </div>
        ) : null}

        {activeTab === "user verification" ? (
          <section className="mt-8 rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-emerald-950">Pending NGO Verification</h3>
            <p className="mt-1 text-sm text-slate-500">After an NGO registers, approve it here to store it as verified in the database and allow platform use.</p>

            <div className="mt-6 space-y-4">
              {pendingNgos.length ? (
                pendingNgos.map((ngo) => (
                  <div key={ngo._id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-base font-semibold text-slate-800">{ngo.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{ngo.email}</p>
                        <p className="mt-1 text-sm text-slate-500">{ngo.address}, {ngo.city}, {ngo.state}</p>
                        <p className="mt-1 text-xs text-slate-400">Registered: {formatDate(ngo.createdAt)}</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleVerification(ngo._id, "approve")}
                          className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Approve NGO
                        </button>
                        <button
                          onClick={() => handleVerification(ngo._id, "reject")}
                          className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="No pending NGOs" description="All NGO registrations have been reviewed." />
              )}
            </div>
          </section>
        ) : null}

        {activeTab === "manage accounts" ? (
          <section className="mt-8 rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-emerald-950">All Users</h3>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {users.map((user) => (
                <div key={user._id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-800">{user.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{user.role}</p>
                  <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    Verification: {user.verificationStatus || (user.verified ? "approved" : "pending")}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === "monitoring" ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-4">
            <StatCard title="Donors" value={totals.donors} />
            <StatCard title="NGOs" value={totals.ngos} />
            <StatCard title="Volunteers" value={totals.volunteers} />
            <StatCard title="Active Deliveries" value={analytics?.activeDeliveries || 0} />
          </div>
        ) : null}

        {activeTab === "feedback" ? (
          <section className="mt-8 rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-emerald-950">Donor Feedback</h3>
            <p className="mt-1 text-sm text-slate-500">Feedback submitted by donors is stored in MongoDB and surfaced here for admin review.</p>
            <div className="mt-6 space-y-4">
              {feedback.length ? (
                feedback.map((entry) => (
                  <div key={entry._id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-base font-semibold text-slate-800">{entry.donorId?.name || "Donor feedback"}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          NGO: {entry.ngoId?.name || "N/A"} • Volunteer: {entry.volunteerId?.name || "N/A"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">Submitted: {formatDate(entry.createdAt)}</p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                        {entry.rating}/5
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-slate-600">{entry.message || "No written message provided."}</p>
                  </div>
                ))
              ) : (
                <EmptyState title="No feedback yet" description="Submitted donor feedback will appear here." />
              )}
            </div>
          </section>
        ) : null}

        {activeTab === "analytics" ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <StatCard title="Users by Role" value={`${totals.donors} D / ${totals.ngos} N / ${totals.volunteers} V`} />
            <StatCard title="Active Deliveries" value={analytics?.activeDeliveries || 0} />
          </div>
        ) : null}
      </main>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-emerald-700">{value}</p>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/70 p-6 text-center">
      <p className="text-base font-semibold text-emerald-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}
