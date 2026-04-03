import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import config from "../../config";

const tabs = ["overview", "manage pickups", "otp verification"];

const statusStyles = {
  ngo_approved: "bg-amber-100 text-amber-700",
  accepted: "bg-emerald-100 text-emerald-700",
  picked_up: "bg-blue-100 text-blue-700",
  delivered: "bg-emerald-100 text-emerald-800",
};

function formatStatus(status = "") {
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function badgeStyle(status) {
  return statusStyles[status] || "bg-slate-100 text-slate-700";
}

export default function VolunteerDashboard() {
  const [activeTab, setActiveTab] = useState(localStorage.getItem("activeTab") || "overview");
  const [pickups, setPickups] = useState([]);
  const [message, setMessage] = useState("");
  const [pickupOtp, setPickupOtp] = useState({});
  const [deliveryOtp, setDeliveryOtp] = useState({});
  const volunteerId = localStorage.getItem("userId");
  const navigate = useNavigate();

  const fetchPickups = useCallback(async () => {
    const response = await fetch(`${config.API_URL}/volunteer/pickups/${volunteerId}`);
    const data = await response.json();
    setPickups(Array.isArray(data) ? data : []);
  }, [volunteerId]);

  useEffect(() => {
    fetchPickups().catch(() => setMessage("Unable to load volunteer tasks."));
  }, [fetchPickups]);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const acceptTask = async (id) => {
    const response = await fetch(`${config.API_URL}/volunteer/accept/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ volunteerId }),
    });
    const data = await response.json();
    setMessage(data.message || "Volunteer task updated.");
    await fetchPickups();
  };

  const declineTask = async (id) => {
    const response = await fetch(`${config.API_URL}/volunteer/decline/${id}`, {
      method: "POST",
    });
    const data = await response.json();
    setMessage(data.message || "Volunteer task declined.");
    await fetchPickups();
  };

  const verifyPickupOtp = async (id) => {
    const response = await fetch(`${config.API_URL}/donation/${id}/pickup/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        volunteerId,
        otp: pickupOtp[id] || "",
      }),
    });
    const data = await response.json();
    setMessage(data.message || "Pickup verified.");
    await fetchPickups();
  };

  const verifyDeliveryOtp = async (id) => {
    const response = await fetch(`${config.API_URL}/donation/${id}/ngo-delivery/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        volunteerId,
        otp: deliveryOtp[id] || "",
      }),
    });
    const data = await response.json();
    setMessage(data.message || "Delivery verified.");
    await fetchPickups();
  };

  const stats = useMemo(() => {
    const accepted = pickups.filter((pickup) => pickup.status === "accepted").length;
    const picked = pickups.filter((pickup) => pickup.status === "picked_up").length;
    const delivered = pickups.filter((pickup) => pickup.status === "delivered").length;
    const volunteerPoints = pickups.reduce((total, pickup) => {
      if (pickup.volunteerId?._id === volunteerId) {
        return pickup.volunteerId?.points || total;
      }
      return total;
    }, 0);

    return {
      total: pickups.length,
      accepted,
      picked,
      delivered,
      volunteerPoints,
    };
  }, [pickups, volunteerId]);

  const incomingRequests = pickups.filter((pickup) => !pickup.volunteerId);
  const activeTasks = pickups.filter((pickup) => String(pickup.volunteerId?._id || pickup.volunteerId || "") === String(volunteerId));

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4fbf2_0%,#ffffff_100%)]">
      <div className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-emerald-950">Lakhushya</h1>
            <p className="text-sm text-slate-500">Volunteer Logistics Dashboard</p>
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
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Volunteer Dashboard</p>
          <h2 className="mt-2 text-3xl font-bold text-emerald-950">Accept nearby requests, verify OTPs, and complete deliveries.</h2>
          <p className="mt-3 max-w-3xl text-sm text-slate-500">
            NGO accepts donation, volunteer receives request, accepts or rejects, then verifies donor OTP at pickup and NGO OTP at final delivery.
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
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            <StatCard title="Incoming Requests" value={incomingRequests.length} />
            <StatCard title="Accepted Tasks" value={stats.accepted} />
            <StatCard title="Picked Up" value={stats.picked} />
            <StatCard title="Delivered" value={stats.delivered} />
            <StatCard title="Volunteer Points" value={stats.volunteerPoints} />
          </div>
        ) : null}

        {activeTab === "manage pickups" ? (
          <section className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-emerald-950">Incoming Volunteer Requests</h3>
              <div className="mt-6 space-y-4">
                {incomingRequests.length ? incomingRequests.map((pickup) => (
                  <TaskCard
                    key={pickup._id}
                    title={pickup.itemName || pickup.description}
                    subtitle={`Donor: ${pickup.donorId?.name || "Donor"} • NGO: ${pickup.ngoId?.name || "Assigned NGO"}`}
                    meta={`${pickup.pickupDate} • ${pickup.pickupTime} • ${pickup.address}`}
                    status={pickup.status}
                    actions={
                      <div className="flex gap-2">
                        <button onClick={() => acceptTask(pickup._id)} className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                          Accept
                        </button>
                        <button onClick={() => declineTask(pickup._id)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                          Reject
                        </button>
                      </div>
                    }
                  />
                )) : <EmptyState title="No volunteer requests" description="New NGO-approved donation requests will appear here for you to accept or reject." />}
              </div>
            </div>

            <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-emerald-950">Active Volunteer Tasks</h3>
              <div className="mt-6 space-y-4">
                {activeTasks.length ? activeTasks.map((pickup) => (
                  <TaskCard
                    key={pickup._id}
                    title={pickup.itemName || pickup.description}
                    subtitle={`Donor: ${pickup.donorId?.name || "Donor"} • NGO: ${pickup.ngoId?.name || "Assigned NGO"}`}
                    meta={`${pickup.pickupDate} • ${pickup.pickupTime} • ${pickup.address}`}
                    status={pickup.status}
                  />
                )) : <EmptyState title="No active tasks" description="Accept a request to begin pickup and delivery flow." />}
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "otp verification" ? (
          <section className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-emerald-950">Pickup Verification</h3>
              <p className="mt-1 text-sm text-slate-500">On pickup date, donor gives OTP. Enter it here to mark the donation as picked up.</p>
              <div className="mt-6 space-y-4">
                {activeTasks.filter((pickup) => pickup.status === "accepted").length ? (
                  activeTasks.filter((pickup) => pickup.status === "accepted").map((pickup) => (
                    <OtpCard
                      key={pickup._id}
                      title={pickup.itemName || pickup.description}
                      subtitle={`Pickup from ${pickup.donorId?.name || "Donor"}`}
                      value={pickupOtp[pickup._id] || ""}
                      onChange={(value) => setPickupOtp((previous) => ({ ...previous, [pickup._id]: value }))}
                      buttonLabel="Verify Pickup OTP"
                      onSubmit={() => verifyPickupOtp(pickup._id)}
                    />
                  ))
                ) : (
                  <EmptyState title="No pickup OTP pending" description="Accepted volunteer tasks will appear here for pickup confirmation." />
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-emerald-950">Delivery Verification</h3>
              <p className="mt-1 text-sm text-slate-500">After pickup, NGO gives OTP. Enter it here to mark the donation as delivered.</p>
              <div className="mt-6 space-y-4">
                {activeTasks.filter((pickup) => pickup.status === "picked_up").length ? (
                  activeTasks.filter((pickup) => pickup.status === "picked_up").map((pickup) => (
                    <OtpCard
                      key={pickup._id}
                      title={pickup.itemName || pickup.description}
                      subtitle={`Deliver to ${pickup.ngoId?.name || "NGO"}`}
                      value={deliveryOtp[pickup._id] || ""}
                      onChange={(value) => setDeliveryOtp((previous) => ({ ...previous, [pickup._id]: value }))}
                      buttonLabel="Verify NGO OTP"
                      onSubmit={() => verifyDeliveryOtp(pickup._id)}
                    />
                  ))
                ) : (
                  <EmptyState title="No delivery OTP pending" description="Picked-up donations will appear here for final NGO delivery verification." />
                )}
              </div>
            </div>
          </section>
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

function TaskCard({ title, subtitle, meta, status, actions = null }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-base font-semibold text-slate-800">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <p className="mt-2 text-xs text-slate-400">{meta}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyle(status)}`}>
          {formatStatus(status)}
        </span>
      </div>
      {actions ? <div className="mt-4">{actions}</div> : null}
    </div>
  );
}

function OtpCard({ title, subtitle, value, onChange, buttonLabel, onSubmit }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
      <p className="text-base font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Enter 6-digit OTP"
        className="mt-4 w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 outline-none transition focus:border-emerald-300"
      />
      <button
        onClick={onSubmit}
        className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        {buttonLabel}
      </button>
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
