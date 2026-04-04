import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import config from "../../config";
import { clearStoredAuth, getStoredAuth, setStoredName } from "../../utils/auth";

const tabs = [
  "overview",
  "manage donations",
  "raise requests",
  "analytics",
];

const statusStyles = {
  pending_ngo: "bg-amber-100 text-amber-700",
  ngo_approved: "bg-sky-100 text-sky-700",
  accepted: "bg-emerald-100 text-emerald-700",
  picked_up: "bg-blue-100 text-blue-700",
  delivered: "bg-emerald-100 text-emerald-800",
  ngo_declined: "bg-rose-100 text-rose-700",
};

function formatStatus(status = "") {
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function badgeStyle(status) {
  return statusStyles[status] || "bg-slate-100 text-slate-700";
}

export default function NgoDashboard() {
  const [activeTab, setActiveTab] = useState(localStorage.getItem("activeTab") || "overview");
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    category: "",
    quantity: "",
    date: "",
    description: "",
  });

  const { userId: ngoId, name: storedNgoName } = getStoredAuth();
  const [ngoName, setNgoName] = useState(storedNgoName);
  const navigate = useNavigate();

  const fetchDonations = useCallback(async () => {
    const response = await fetch(`${config.API_URL}/ngo/donations/${ngoId}`);
    const data = await response.json();
    setDonations(Array.isArray(data) ? data : []);
  }, [ngoId]);

  const fetchRequests = useCallback(async () => {
    const response = await fetch(`${config.API_URL}/request/all`);
    const data = await response.json();
    setRequests(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    if (!ngoId) {
      navigate("/login");
      return;
    }

    const refreshDashboard = () => {
      fetchDonations().catch(() => setError("Unable to load NGO donations."));
      fetchRequests().catch(() => {});
    };

    refreshDashboard();

    const handleFocus = () => refreshDashboard();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshDashboard();
      }
    };

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshDashboard();
      }
    }, 15000);

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchDonations, fetchRequests, navigate, ngoId]);

  useEffect(() => {
    if (!ngoId || ngoName) {
      return;
    }

    fetch(`${config.API_URL}/user/${ngoId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data?.name) {
          setNgoName(data.name);
          setStoredName(data.name);
        }
      })
      .catch(() => {});
  }, [ngoId, ngoName]);

  const stats = useMemo(() => {
    const pending = donations.filter((donation) => donation.status === "pending_ngo").length;
    const active = donations.filter((donation) =>
      ["ngo_approved", "accepted", "picked_up"].includes(donation.status)
    ).length;
    const completed = donations.filter((donation) => donation.status === "delivered").length;
    const openRequests = requests.filter(
      (request) => request.ngoId?._id === ngoId && ["pending", "accepted"].includes(request.status)
    ).length;

    return {
      pending,
      active,
      completed,
      openRequests,
    };
  }, [donations, requests, ngoId]);

  const recentDonations = donations.slice(0, 3);
  const ngoRequests = requests.filter((request) => request.ngoId?._id === ngoId);
  const displayNgoName = ngoName || donations[0]?.ngoId?.name || ngoRequests[0]?.ngoId?.name || "";

  const handleLogout = () => {
    clearStoredAuth();
    navigate("/login");
  };

  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const quantityNum = Number(form.quantity);
    if (!form.category || !form.quantity || !form.date || !form.description.trim()) {
      setError("All fields are required.");
      return;
    }
    if (quantityNum <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    if (form.date < today) {
      setError("Date cannot be in the past.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${config.API_URL}/request/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ngoId,
          category: form.category,
          quantity: quantityNum,
          date: form.date,
          description: form.description.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to publish request");
      }

      setSuccess("Request published successfully.");
      setForm({
        category: "",
        quantity: "",
        date: "",
        description: "",
      });
      await fetchRequests();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDonationAction = async (donationId, action) => {
    const endpoint = action === "accept" ? "accept" : "decline";
    const response = await fetch(`${config.API_URL}/ngo/${endpoint}/${donationId}`, {
      method: "POST",
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Unable to update donation");
      return;
    }

    setSuccess(data.message || "Donation updated.");
    await fetchDonations();
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4fbf2_0%,#ffffff_100%)] text-slate-800">
      <header className="border-b border-emerald-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-950">Lakhushya</h1>
            <p className="text-sm text-slate-500">Connecting Donations with Purpose</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-emerald-700">From Giving to Impact</span>
            <button
              onClick={handleLogout}
              className="rounded-full border border-emerald-200 px-4 py-2 text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[32px] bg-white p-6 shadow-lg shadow-emerald-100/50 ring-1 ring-emerald-100 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">NGO Dashboard</p>
              <h2 className="mt-2 text-3xl font-bold text-emerald-950">Review donations, coordinate volunteers, and raise focused needs.</h2>
              <p className="mt-3 text-base font-medium text-emerald-700">
                Welcome{displayNgoName ? ", " : ""}
                {displayNgoName ? <span className="font-bold uppercase tracking-wide text-emerald-800">{displayNgoName}</span> : null}
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Keep the same calm green experience as donors while managing approvals, open requests, and final impact on the ground.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Pending Donations" value={stats.pending} tone="amber" />
              <StatCard label="Active Logistics" value={stats.active} tone="sky" />
              <StatCard label="Completed" value={stats.completed} tone="emerald" />
              <StatCard label="Open Requests" value={stats.openRequests} tone="emerald" />
            </div>
          </div>
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
                activeTab === tab ? "bg-white text-emerald-700 shadow-md" : "text-slate-600 hover:bg-white/70"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

        {activeTab === "overview" ? (
          <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-emerald-950">Recent Donations</h3>
                <button onClick={() => setActiveTab("manage donations")} className="text-sm font-medium text-emerald-700">
                  Manage all
                </button>
              </div>
              <div className="mt-5 space-y-4">
                {recentDonations.length ? recentDonations.map((donation) => (
                  <div key={donation._id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-slate-800">{donation.itemName || donation.description}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Donor: {donation.donorId?.name || "Donor"} • Qty: {donation.quantity}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">{donation.pickupDate} {donation.pickupTime ? `• ${donation.pickupTime}` : ""}</p>
                      </div>
                      <span className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${badgeStyle(donation.status)}`}>
                        {formatStatus(donation.status)}
                      </span>
                    </div>
                  </div>
                )) : <EmptyState title="No donations yet" description="Incoming assigned donations will appear here once donors start contributing." />}
              </div>
            </div>

            <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-emerald-950">Operations Snapshot</h3>
              <div className="mt-5 space-y-4">
                <InfoCard label="Need Requests" value={`${stats.openRequests} active`} />
                <InfoCard label="Volunteer Coordination" value={stats.active ? "In progress" : "No live logistics"} />
                <InfoCard label="Community Served" value={`${stats.completed * 12} impact points`} />
                <InfoCard
                  label="Volunteer Availability"
                  value={donations.some((donation) => donation.noVolunteerAvailable) ? "No volunteers found on some donations" : "Volunteers available"}
                />
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "manage donations" ? (
          <section className="mt-8 rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-emerald-950">Manage Donations</h3>
            <p className="mt-1 text-sm text-slate-500">Accept or decline incoming donations and monitor volunteer availability.</p>

            <div className="mt-6 space-y-4">
              {donations.length ? donations.map((donation) => (
                <div key={donation._id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-800">{donation.itemName || donation.description}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Donor: {donation.donorId?.name || "Donor"} • Qty: {donation.quantity} • {donation.category}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">{donation.address}</p>
                      <p className="mt-1 text-xs text-slate-400">{donation.pickupDate} {donation.pickupTime ? `• ${donation.pickupTime}` : ""}</p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyle(donation.status)}`}>
                        {formatStatus(donation.status)}
                      </span>

                      {donation.status === "pending_ngo" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDonationAction(donation._id, "decline")}
                            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleDonationAction(donation._id, "accept")}
                            className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                          >
                            Accept
                          </button>
                        </div>
                      ) : null}

                      {donation.status === "ngo_approved" && donation.noVolunteerAvailable ? (
                        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                          No volunteers found
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              )) : <EmptyState title="No donation requests" description="Assigned donor donations will appear here for approval." />}
            </div>
          </section>
        ) : null}

        {activeTab === "raise requests" ? (
          <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm md:p-8">
              <h3 className="text-xl font-semibold text-emerald-950">Raise a Need Request</h3>
              <p className="mt-2 text-sm text-slate-500">Publish current needs so donors can fulfill them directly.</p>

              <form onSubmit={handleRequestSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <SelectField
                  label="Category"
                  value={form.category}
                  onChange={(value) => setForm((previous) => ({ ...previous, category: value }))}
                  options={["Food", "Clothes", "Books"]}
                />
                <TextField
                  label="Quantity"
                  type="number"
                  value={form.quantity}
                  onChange={(value) => setForm((previous) => ({ ...previous, quantity: value }))}
                  placeholder="Required quantity"
                />
                <TextField
                  label="Expiry Date"
                  type="date"
                  value={form.date}
                  onChange={(value) => setForm((previous) => ({ ...previous, date: value }))}
                />
                <TextAreaField
                  className="md:col-span-2"
                  label="Description"
                  value={form.description}
                  onChange={(value) => setForm((previous) => ({ ...previous, description: value }))}
                  placeholder="Describe what is needed and why"
                />
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Publishing..." : "Publish Request"}
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-emerald-950">Your Requests</h3>
              <div className="mt-6 space-y-4">
                {ngoRequests.length ? ngoRequests.map((request) => (
                  <div key={request._id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-slate-800">{request.category}</p>
                        <p className="mt-1 text-sm text-slate-500">{request.description}</p>
                        <p className="mt-2 text-xs text-slate-400">Qty: {request.quantity} • Expires: {request.date}</p>
                      </div>
                      <span className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${badgeStyle(request.status)}`}>
                        {formatStatus(request.status)}
                      </span>
                    </div>
                    {request.status === "accepted" ? (
                      <p className="mt-3 text-sm text-emerald-700">
                        Accepted by {request.donorId?.name || "a donor"} • Pickup status: {request.pickupStatus}
                      </p>
                    ) : null}
                  </div>
                )) : <EmptyState title="No requests yet" description="Publish a need request to make it visible to donors." />}
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "analytics" ? (
          <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatPanel title="Food Donations" value={donations.filter((donation) => donation.category === "Food").length} />
            <StatPanel title="Clothes Donations" value={donations.filter((donation) => donation.category === "Clothes").length} />
            <StatPanel title="Books Donations" value={donations.filter((donation) => donation.category === "Books").length} />
            <StatPanel title="Volunteer Delays" value={donations.filter((donation) => donation.noVolunteerAvailable).length} />
          </section>
        ) : null}
      </main>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  const toneClasses = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    sky: "bg-sky-50 text-sky-700",
  };

  return (
    <div className={`rounded-2xl px-4 py-3 ${toneClasses[tone] || toneClasses.emerald}`}>
      <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function StatPanel({ title, value }) {
  return (
    <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-emerald-700">{value}</p>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-emerald-100 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-300"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-emerald-100 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-300"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder, className = "" }) {
  return (
    <label className={`block text-sm font-medium text-slate-700 ${className}`}>
      {label}
      <textarea
        rows="4"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-emerald-100 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-300"
      />
    </label>
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
