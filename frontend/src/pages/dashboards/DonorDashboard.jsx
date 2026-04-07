import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MapView from "../../components/MapView";
import config from "../../config";
import { clearStoredAuth, getStoredAuth, setStoredName } from "../../utils/auth";

const tabs = [
  "overview",
  "create donation",
  "track donations",
  "view requests",
  "feedback",
];

const statusStyles = {
  pending_ngo: "bg-amber-100 text-amber-700",
  ngo_approved: "bg-sky-100 text-sky-700",
  ngo_declined: "bg-orange-100 text-orange-700",
  pending_volunteer: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-700",
  picked_up: "bg-blue-100 text-blue-700",
  delivered: "bg-emerald-100 text-emerald-800",
  failed: "bg-rose-100 text-rose-700",
};

function formatStatus(status = "") {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getBadgeStyle(status) {
  return statusStyles[status] || "bg-slate-100 text-slate-700";
}

function getQuantityMeta(category) {
  if (category === "Food") {
    return {
      min: "0.1",
      step: "0.1",
      placeholder: "Enter quantity in kg",
      unit: "kg",
      inputMode: "decimal",
      helperText: "Food donations can be entered in kilograms, including decimals.",
    };
  }

  return {
    min: "1",
    step: "1",
    placeholder: "Enter item count",
    unit: "items",
    inputMode: "numeric",
    helperText: "Clothes, books, and other donations must be positive whole numbers.",
  };
}

function toMinutesLabel(value) {
  if (!value && value !== 0) {
    return "ETA unavailable";
  }
  return `Arriving in ${value} min`;
}

async function geocodeAddress(address) {
  const attempts = [...new Set(
    [
      address,
      address.replace(/UttarPradesh/gi, "Uttar Pradesh"),
      address.replace(/Uttarakhand/gi, "Uttarakhand, India"),
      address.replace(/,\s*,/g, ",").replace(/\s+/g, " ").trim(),
      address.split(",").slice(1).join(",").trim(),
      address.split(",").slice(-3).join(",").trim(),
      `${address}, India`,
    ].filter(Boolean)
  )];

  for (const query of attempts) {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(
      query
    )}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      continue;
    }

    const data = await response.json();
    if (data.length) {
      return {
        lat: Number(data[0].lat),
        lng: Number(data[0].lon),
      };
    }
  }

  throw new Error("Could not find that address on the map. Try a shorter address like 'Sector 62, Noida, Uttar Pradesh, 201309'.");
}

function buildTrackingModel(donation) {
  const donor = donation?.liveTracking?.donor || donation?.location?.donor;
  const ngo =
    donation?.liveTracking?.ngo ||
    donation?.location?.ngo ||
    (donation?.ngoId?.location?.latitude && donation?.ngoId?.location?.longitude
      ? {
          lat: donation.ngoId.location.latitude,
          lng: donation.ngoId.location.longitude,
        }
      : null) ||
    (donation?.currentNgoCandidate?.location?.latitude && donation?.currentNgoCandidate?.location?.longitude
      ? {
          lat: donation.currentNgoCandidate.location.latitude,
          lng: donation.currentNgoCandidate.location.longitude,
        }
      : null);
  const volunteer =
    donation?.liveTracking?.volunteer ||
    donation?.location?.volunteer ||
    (donation?.volunteerId?.location?.latitude && donation?.volunteerId?.location?.longitude
      ? {
          lat: donation.volunteerId.location.latitude,
          lng: donation.volunteerId.location.longitude,
        }
      : null);

  const markers = [
    donor
      ? {
          ...donor,
          kind: "donor",
          label: "Donor pickup",
          description: donation.pickupAddress || donation.address,
        }
      : null,
    ngo
      ? {
          ...ngo,
          kind: "ngo",
          label: donation.ngoId?.name || donation.currentNgoCandidate?.name || "Nearest NGO",
          description: donation.ngoId?.address || donation.currentNgoCandidate?.address || "Assigned NGO",
        }
      : null,
    volunteer
      ? {
          ...volunteer,
          kind: "volunteer",
          label: donation.volunteerId?.name || "Volunteer",
          description: "Live volunteer location",
        }
      : null,
  ].filter(Boolean);

  const segments = [];

  if (donor && volunteer && donation.status === "accepted") {
    segments.push({
      from: volunteer,
      to: donor,
      color: "#2563eb",
    });
  }

  if (volunteer && ngo && ["accepted", "picked_up"].includes(donation.status)) {
    segments.push({
      from: volunteer,
      to: ngo,
      color: "#f97316",
    });
  }

  if (!volunteer && donor && ngo) {
    segments.push({
      from: donor,
      to: ngo,
      color: "#2f855a",
    });
  }

  return {
    markers,
    segments,
  };
}

export default function DonorDashboard() {
  const [activeTab, setActiveTab] = useState(localStorage.getItem("activeTab") || "overview");
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedDonationId, setSelectedDonationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [successTone, setSuccessTone] = useState("emerald");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackRating, setFeedbackRating] = useState("5");
  const [feedbackDonationId, setFeedbackDonationId] = useState("");

  const [form, setForm] = useState({
    category: "",
    quantity: "",
    itemName: "",
    pickupDate: "",
    pickupTime: "",
    houseNo: "",
    area: "",
    city: "",
    stateName: "",
    pincode: "",
    mobile: "",
  });

  const { userId: donorId, name: storedDonorName } = getStoredAuth();
  const [donorName, setDonorName] = useState(storedDonorName);
  const navigate = useNavigate();

  const fetchDonations = useCallback(async () => {
    const response = await fetch(`${config.API_URL}/donation/${donorId}`);
    const data = await response.json();
    setDonations(Array.isArray(data) ? data : []);
    if (!selectedDonationId && Array.isArray(data) && data.length) {
      setSelectedDonationId(data[0]._id);
      setFeedbackDonationId(data[0]._id);
    }
  }, [donorId, selectedDonationId]);

  const fetchRequests = useCallback(async () => {
    const response = await fetch(`${config.API_URL}/request/all`);
    const data = await response.json();
    setRequests(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    if (!donorId) {
      navigate("/login");
      return;
    }

    const refreshDashboard = () => {
      fetchDonations().catch(() => setError("Unable to load your donations"));
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
  }, [donorId, fetchDonations, fetchRequests, navigate]);

  useEffect(() => {
    if (!donorId || donorName) {
      return;
    }

    fetch(`${config.API_URL}/user/${donorId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data?.name) {
          setDonorName(data.name);
          setStoredName(data.name);
        }
      })
      .catch(() => {});
  }, [donorId, donorName]);

  const selectedDonation =
    donations.find((donation) => donation._id === selectedDonationId) || donations[0] || null;
  const displayDonorName = donorName || donations[0]?.donorId?.name || "";

  const stats = useMemo(() => {
    const total = donations.length;
    const active = donations.filter((donation) =>
      ["pending_ngo", "ngo_approved", "accepted", "picked_up"].includes(donation.status)
    ).length;
    const delivered = donations.filter((donation) => donation.status === "delivered").length;
    const impact = delivered * 12 + active * 4;

    return {
      total,
      active,
      delivered,
      impact,
    };
  }, [donations]);

  const recentDonations = donations.slice(0, 3);
  const trackingModel = selectedDonation ? buildTrackingModel(selectedDonation) : { markers: [], segments: [] };
  const quantityMeta = useMemo(() => getQuantityMeta(form.category), [form.category]);

  useEffect(() => {
    if (selectedDonation?._id) {
      setFeedbackDonationId(selectedDonation._id);
    }
  }, [selectedDonation]);

  const handleLogout = () => {
    clearStoredAuth();
    navigate("/login");
  };

  const handleInput = (key, value) => {
    if (key === "category") {
      setForm((previous) => ({
        ...previous,
        category: value,
        quantity: value !== "Food" && previous.quantity.includes(".") ? "" : previous.quantity,
      }));
      return;
    }

    if (key === "quantity") {
      const sanitizedValue = value.replace(/[^\d.]/g, "");
      const [wholePart, ...decimalParts] = sanitizedValue.split(".");
      const normalizedValue = decimalParts.length ? `${wholePart}.${decimalParts.join("")}` : wholePart;

      if (form.category !== "Food" && normalizedValue.includes(".")) {
        return;
      }

      setForm((previous) => ({
        ...previous,
        [key]: normalizedValue,
      }));
      return;
    }

    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSuccessTone("emerald");

    const {
      category,
      quantity,
      itemName,
      pickupDate,
      pickupTime,
      houseNo,
      area,
      city,
      stateName,
      pincode,
      mobile,
    } = form;

    if (
      !category ||
      !quantity ||
      !itemName ||
      !pickupDate ||
      !pickupTime ||
      !houseNo ||
      !area ||
      !city ||
      !stateName ||
      !pincode ||
      !mobile
    ) {
      setError("All donation fields are required.");
      return;
    }

    if (!/^\d{6}$/.test(pincode)) {
      setError("Pincode must be 6 digits.");
      return;
    }

    if (!/^\d{10}$/.test(mobile)) {
      setError("Mobile number must be 10 digits.");
      return;
    }

    const quantityNumber = Number(quantity);
    if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    if (category !== "Food" && !Number.isInteger(quantityNumber)) {
      setError("Only food donations can use decimal quantity. Other categories must be whole numbers.");
      return;
    }

    const hour = Number(pickupTime.split(":")[0]);
    if (hour < 9 || hour > 21) {
      setError("Pickup time must be between 9 AM and 9 PM.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    if (pickupDate < today) {
      setError("Pickup date cannot be in the past.");
      return;
    }

    try {
      setLoading(true);
      const fullAddress = `${houseNo}, ${area}, ${city}, ${stateName}, ${pincode}`;
      const point = await geocodeAddress(fullAddress);
      const currentRequestId = localStorage.getItem("currentRequestId");

      const response = await fetch(`${config.API_URL}/donation/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: donorId,
          role: "donor",
          itemName,
          category,
          quantity,
          pickupDate,
          pickupTime,
          address: fullAddress,
          mobile,
          lat: point.lat,
          lng: point.lng,
          requestId: currentRequestId || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || "Unable to create donation");
      }

      const noNgoNearby = data?.donation?.status === "failed";
      setSuccess(
        data.message ||
          (noNgoNearby
            ? "No NGO nearby within 70 km"
            : "Donation created successfully. The nearest NGO has been mapped below.")
      );
      setSuccessTone(noNgoNearby ? "amber" : "emerald");
      setForm({
        category: "",
        quantity: "",
        itemName: "",
        pickupDate: "",
        pickupTime: "",
        houseNo: "",
        area: "",
        city: "",
        stateName: "",
        pincode: "",
        mobile: "",
      });

      await fetchDonations();
      await fetchRequests();
      localStorage.removeItem("currentRequestId");
      localStorage.removeItem("requestDate");
      if (data?.donation?._id && data?.donation?.status !== "failed") {
        setSelectedDonationId(data.donation._id);
        setActiveTab("track donations");
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSuccessTone("emerald");

    if (!feedbackDonationId) {
      setError("Select a delivered donation first.");
      return;
    }

    try {
      const response = await fetch(`${config.API_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          donationId: feedbackDonationId,
          donorId,
          rating: Number(feedbackRating),
          message: feedbackMessage,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Unable to submit feedback");
        return;
      }

      setSuccess("Feedback submitted successfully.");
      setFeedbackMessage("");
      setFeedbackRating("5");
    } catch (submitError) {
      setError(submitError.message || "Unable to submit feedback");
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4fbf2_0%,#f8fafc_48%,#ffffff_100%)] text-slate-800">
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
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Donor Dashboard</p>
              <h2 className="mt-2 text-3xl font-bold text-emerald-950">Donate confidently and track every step.</h2>
              <p className="mt-3 text-base font-medium text-emerald-700">
                Welcome{displayDonorName ? ", " : ""}
                {displayDonorName ? <span className="font-bold uppercase tracking-wide text-emerald-800">{displayDonorName}</span> : null}
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                See the nearest NGO, follow volunteer movement in real time, and watch each donation move from giving to impact.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Total Donations" value={stats.total} tone="emerald" />
              <StatCard label="Impact Score" value={stats.impact} tone="amber" />
              <StatCard label="Active" value={stats.active} tone="sky" />
              <StatCard label="Delivered" value={stats.delivered} tone="emerald" />
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
                activeTab === tab
                  ? "bg-white text-emerald-700 shadow-md"
                  : "text-slate-600 hover:bg-white/70"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {success ? (
          <p
            className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
              successTone === "amber"
                ? "bg-amber-50 text-amber-800"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {success}
          </p>
        ) : null}

        {activeTab === "overview" ? (
          <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-emerald-950">Recent Donations</h3>
                <button
                  onClick={() => setActiveTab("track donations")}
                  className="text-sm font-medium text-emerald-700"
                >
                  View all
                </button>
              </div>
              <div className="mt-5 space-y-4">
                {recentDonations.length ? (
                  recentDonations.map((donation) => (
                    <div
                      key={donation._id}
                      className="rounded-3xl border border-slate-100 bg-slate-50 p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-slate-800">{donation.itemName || donation.description}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {donation.ngoId?.name || donation.currentNgoCandidate?.name || "Finding nearest NGO"}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            {donation.pickupDate} {donation.pickupTime ? `• ${donation.pickupTime}` : ""}
                          </p>
                        </div>
                        <span className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${getBadgeStyle(donation.status)}`}>
                          {formatStatus(donation.status)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState title="No donations yet" description="Create your first donation to see nearest NGOs and live logistics here." />
                )}
              </div>
            </div>

            <MapView
              title="Nearest NGO Preview"
              subtitle="Your selected donation shows the donor source, assigned NGO, and live volunteer route when available."
              markers={trackingModel.markers}
              segments={trackingModel.segments}
              heightClass="h-[26rem]"
            />
          </section>
        ) : null}

        {activeTab === "create donation" ? (
          <section className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm md:p-8">
              <h3 className="text-xl font-semibold text-emerald-950">Create Donation</h3>
              <p className="mt-2 text-sm text-slate-500">
                The donor location will be geocoded from your address and matched to the nearest NGO automatically.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <SelectField
                  value={form.category}
                  onChange={(value) => handleInput("category", value)}
                  options={["Food", "Clothes", "Books", "Other"]}
                  label="Donation Type"
                />
                <TextField
                  label="Quantity"
                  type="number"
                  value={form.quantity}
                  onChange={(value) => handleInput("quantity", value)}
                  placeholder={quantityMeta.placeholder}
                  min={quantityMeta.min}
                  step={quantityMeta.step}
                  inputMode={quantityMeta.inputMode}
                  suffix={quantityMeta.unit}
                  helperText={quantityMeta.helperText}
                />
                <TextAreaField
                  className="md:col-span-2"
                  label="Description"
                  value={form.itemName}
                  onChange={(value) => handleInput("itemName", value)}
                  placeholder="Describe the donation items"
                />
                <TextField
                  label="Pickup Date"
                  type="date"
                  value={form.pickupDate}
                  onChange={(value) => handleInput("pickupDate", value)}
                />
                <TextField
                  label="Pickup Time"
                  type="time"
                  value={form.pickupTime}
                  onChange={(value) => handleInput("pickupTime", value)}
                />
                <TextField
                  className="md:col-span-2"
                  label="House / Flat"
                  value={form.houseNo}
                  onChange={(value) => handleInput("houseNo", value)}
                  placeholder="House number or flat"
                />
                <TextField
                  label="Area"
                  value={form.area}
                  onChange={(value) => handleInput("area", value)}
                  placeholder="Locality / area"
                />
                <TextField
                  label="City"
                  value={form.city}
                  onChange={(value) => handleInput("city", value)}
                  placeholder="City"
                />
                <TextField
                  label="State"
                  value={form.stateName}
                  onChange={(value) => handleInput("stateName", value)}
                  placeholder="State"
                />
                <TextField
                  label="Pincode"
                  value={form.pincode}
                  onChange={(value) => handleInput("pincode", value)}
                  placeholder="6-digit pincode"
                />
                <TextField
                  className="md:col-span-2"
                  label="Mobile Number"
                  value={form.mobile}
                  onChange={(value) => handleInput("mobile", value)}
                  placeholder="10-digit mobile number"
                />
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Creating donation..." : "Create Donation and Find Nearest NGO"}
                  </button>
                </div>
              </form>
            </div>

            <MapView
              title="Donation Route Preview"
              subtitle="After creating a donation, this map shows the donor source and nearest NGO destination."
              markers={trackingModel.markers}
              segments={trackingModel.segments}
              heightClass="h-[38rem]"
            />
          </section>
        ) : null}

        {activeTab === "track donations" ? (
          <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-emerald-950">Track Donations</h3>
                  <p className="mt-1 text-sm text-slate-500">Monitor NGO assignment, volunteer movement, and final delivery.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {donations.length ? (
                  donations.map((donation) => {
                    const isSelected = donation._id === selectedDonation?._id;
                    return (
                      <button
                        key={donation._id}
                        type="button"
                        onClick={() => setSelectedDonationId(donation._id)}
                        className={`w-full rounded-3xl border p-5 text-left transition ${
                          isSelected
                            ? "border-emerald-300 bg-emerald-50 shadow-md"
                            : "border-slate-100 bg-slate-50 hover:border-emerald-200 hover:bg-white"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-base font-semibold text-slate-800">{donation.itemName || donation.description}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {donation.ngoId?.name || donation.currentNgoCandidate?.name || "Nearest NGO is being assigned"}
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                              {donation.pickupDate} {donation.pickupTime ? `• ${donation.pickupTime}` : ""}
                            </p>
                          </div>
                          <span className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${getBadgeStyle(donation.status)}`}>
                            {formatStatus(donation.status)}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <RouteMeta label="Distance" value={donation.routeSummary?.donorToNgoKm ? `${donation.routeSummary.donorToNgoKm} km` : "Pending"} />
                          <RouteMeta
                            label="Pickup ETA"
                            value={donation.routeSummary?.pickupEtaMinutes ? `${donation.routeSummary.pickupEtaMinutes} min` : "Pending"}
                          />
                          <RouteMeta
                            label="Volunteer"
                            value={donation.volunteerId?.name || (donation.noVolunteerAvailable ? "No volunteers available" : "Awaiting assignment")}
                          />
                        </div>

                        {donation.status === "accepted" && donation.liveTracking?.volunteer ? (
                          <div className="mt-4 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
                            <div>
                              <p className="text-sm font-semibold text-slate-700">On The Way</p>
                              <p className="text-xs text-slate-500">{toMinutesLabel(donation.routeSummary?.pickupEtaMinutes)}</p>
                            </div>
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                              Volunteer approaching
                            </span>
                          </div>
                        ) : null}

                        {donation.noVolunteerAvailable ? (
                          <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                            No volunteers available right now.
                          </div>
                        ) : null}
                      </button>
                    );
                  })
                ) : (
                  <EmptyState title="No donations to track" description="Once you create a donation, the nearest NGO and live route will appear here." />
                )}
              </div>
            </div>

            <div className="space-y-6">
              <MapView
                title="Live Route Tracking"
                subtitle="Donor source, NGO destination, and volunteer movement are shown here for the selected donation."
                markers={trackingModel.markers}
                segments={trackingModel.segments}
                heightClass="h-[26rem]"
              />

              <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-emerald-950">Selected Donation Details</h3>
                {selectedDonation ? (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <InfoCard label="Assigned NGO" value={selectedDonation.ngoId?.name || selectedDonation.currentNgoCandidate?.name || "Pending"} />
                    <InfoCard label="Volunteer" value={selectedDonation.volunteerId?.name || "Pending"} />
                    <InfoCard label="Route Distance" value={selectedDonation.routeSummary?.donorToNgoKm ? `${selectedDonation.routeSummary.donorToNgoKm} km` : "Pending"} />
                    <InfoCard label="Delivery ETA" value={selectedDonation.routeSummary?.deliveryEtaMinutes ? `${selectedDonation.routeSummary.deliveryEtaMinutes} min` : "Pending"} />
                  </div>
                ) : (
                  <EmptyState title="Select a donation" description="Choose a donation from the left to inspect its route and live logistics." />
                )}
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "view requests" ? (
          <section className="mt-8 rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-emerald-950">NGO Requests</h3>
            <p className="mt-1 text-sm text-slate-500">Fulfill open NGO requests before they expire.</p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {requests.length ? (
                requests.map((request) => (
                  <div key={request._id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-800">{request.title || request.category}</p>
                        <p className="mt-1 text-sm text-slate-500">{request.ngoId?.name}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getBadgeStyle(request.status)}`}>
                        {formatStatus(request.status)}
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-slate-600">{request.description}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <RouteMeta label="Category" value={request.category} />
                      <RouteMeta label="Quantity" value={request.quantity} />
                      <RouteMeta label="Expiry" value={request.expiryDate || request.date} />
                      <RouteMeta label="Urgency" value={request.urgency || "Medium"} />
                    </div>
                    {request.status === "pending" ? (
                      <button
                        onClick={() => {
                          setActiveTab("create donation");
                          setForm((previous) => ({
                            ...previous,
                            category: request.category,
                            quantity: String(request.quantity),
                            itemName: request.description,
                          }));
                          localStorage.setItem("currentRequestId", request._id);
                          localStorage.setItem("requestDate", request.date);
                        }}
                        className="mt-5 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      >
                        Fulfill Request
                      </button>
                    ) : null}
                  </div>
                ))
              ) : (
                <EmptyState title="No active requests" description="Open NGO requests will appear here as soon as they are raised." />
              )}
            </div>
          </section>
        ) : null}

        {activeTab === "feedback" ? (
          <section className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-emerald-950">Share Feedback</h3>
              <p className="mt-2 text-sm text-slate-500">Rate your latest completed donation experience.</p>

              <form onSubmit={handleFeedbackSubmit} className="mt-6 space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  Delivered Donation
                  <select
                    value={feedbackDonationId}
                    onChange={(event) => setFeedbackDonationId(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-emerald-100 bg-slate-50 px-4 py-3 outline-none ring-0 transition focus:border-emerald-300"
                  >
                    <option value="">Select a donation</option>
                    {donations
                      .filter((donation) => donation.status === "delivered")
                      .map((donation) => (
                        <option key={donation._id} value={donation._id}>
                          {donation.itemName || donation.description}
                        </option>
                      ))}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Rating
                  <select
                    value={feedbackRating}
                    onChange={(event) => setFeedbackRating(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-emerald-100 bg-slate-50 px-4 py-3 outline-none ring-0 transition focus:border-emerald-300"
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Needs work</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </label>

                <TextAreaField
                  label="Message"
                  value={feedbackMessage}
                  onChange={setFeedbackMessage}
                  placeholder="Tell us how the experience felt."
                />

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
                >
                  Submit Feedback
                </button>
              </form>
            </div>

            <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-emerald-950">What you can track</h3>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <InfoCard label="Nearest NGO" value="Shown on map after donation creation" />
                <InfoCard label="Volunteer pickup" value="Live location updates once assigned" />
                <InfoCard label="On The Way button" value="Visible when volunteer is approaching pickup" />
                <InfoCard label="Route details" value="Distance and ETA are shown beside the map" />
              </div>
            </div>
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

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
  min,
  step,
  inputMode,
  suffix,
  helperText,
}) {
  return (
    <label className={`block text-sm font-medium text-slate-700 ${className}`}>
      {label}
      <div className="relative mt-2">
        <input
          type={type}
          value={value}
          min={min}
          step={step}
          inputMode={inputMode}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-2xl border border-emerald-100 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-300 ${
            suffix ? "pr-16" : ""
          }`}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-emerald-700">
            {suffix}
          </span>
        ) : null}
      </div>
      {helperText ? <p className="mt-2 text-xs text-slate-500">{helperText}</p> : null}
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

function RouteMeta({ label, value }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{value}</p>
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

function EmptyState({ title, description }) {
  return (
    <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/70 p-6 text-center">
      <p className="text-base font-semibold text-emerald-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}
