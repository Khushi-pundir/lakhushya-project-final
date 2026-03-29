import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function DonorDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [donations, setDonations] = useState([]);
  const donorId = localStorage.getItem("userId");
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    navigate("/login");
  };

  useEffect(() => {
    fetch(`http://localhost:5000/donation/${donorId}`)
      .then((res) => res.json())
      .then((data) => {
        setDonations(data);
      });
  }, [donorId]);
  useEffect(() => {
    fetch("http://localhost:5000/request/all")
      .then(res => res.json())
      .then(data => setRequests(data));
  }, []);

  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [itemName, setItemName] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [houseNo, setHouseNo] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // eslint-disable-next-line

  const getStatusBadge = (status) => {
    switch (status) {
      // NGO stage
      case "pending_ngo":
        return "bg-yellow-100 text-yellow-700";
      case "ngo_approved":
        return "bg-blue-100 text-blue-700";
      case "ngo_declined":
        return "bg-orange-100 text-orange-700";

      // Volunteer stage
      case "pending_volunteer":
        return "bg-yellow-200 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-700";
      case "declined":
      case "declined_by_volunteer":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  const formatStatus = (status) => {
    return status
      .replace(/_/g, " ")
      .replace(/\bngo\b/i, "NGO")
      .replace(/\bvolunteer\b/i, "Volunteer")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("form submitted");
    setError("");
    setSuccess("");

    // ✅ Validation (Problem 1, 8, 9)
    if (
      !category || !quantity || !itemName ||
      !pickupDate || !pickupTime ||
      !houseNo || !area || !city || !stateName || !pincode || !mobile
    ) {
      setError("All fields are required");
      return;
    }

    if (!donorId) {
      setError("User not logged in");
      return;
    }

    if (quantity <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    if (quantity > 200) {
      setError("Please enter a realistic quantity");
      return;
    }
    // ✅ Category-based validation
    if (category === "Food") {
      if (isNaN(quantity)) {
        setError("Food quantity must be a number (kg)");
        return;
      }
    } else {
      if (!Number.isInteger(Number(quantity))) {
        setError("Quantity must be a whole number for this category");
        return;
      }
    }
    // ✅ Pickup time validation (9 AM – 9 PM)
    const hour = parseInt(pickupTime.split(":")[0]);
    if (hour < 9 || hour > 21) {
      setError("Pickup time must be between 9 AM and 9 PM");
      return;
    }

    // ✅ Word limit check
    const wordCount = itemName.trim().split(/\s+/).length;
    if (wordCount > 50) {
      setError("Description should not exceed 50 words");
      return;
    }

    // ✅ Pincode validation (6 digits)
    if (!/^\d{6}$/.test(pincode)) {
      setError("Pincode must be 6 digits");
      return;
    }

    // ✅ Mobile validation (10 digits)
    if (!/^\d{10}$/.test(mobile)) {
      setError("Mobile number must be 10 digits");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const requestDate = localStorage.getItem("requestDate");

    if (requestDate && pickupDate > requestDate) {
      setError("Pickup date must be before NGO required date");
      return;
    }
    if (pickupDate < today) {
      setError("Pickup date cannot be in the past");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/donation/create", {
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
          address: `${houseNo}, ${area}, ${city}, ${stateName}, ${pincode}`,
          mobile
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      // ✅ Success (Problem 4)
      setSuccess("Donation created successfully!");
      const requestId = localStorage.getItem("currentRequestId");

      if (requestId) {
        await fetch(`http://localhost:5000/request/accept/${requestId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            donorId,
            pickupDate
          })
        });

        localStorage.removeItem("currentRequestId");
        localStorage.removeItem("requestDate");
      }
      setActiveTab("view requests");
      // ✅ Reset fields safely
      setItemName("");
      setCategory("");
      setQuantity("");
      setPickupDate("");
      setPickupTime("");
      setHouseNo("");
      setArea("");
      setCity("");
      setStateName("");
      setPincode("");
      setMobile("");

    } catch (err) {
      // ✅ Error handling (Problem 2)
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#FBF7F2]">

      {/* ===== NAVBAR ===== */}
      <div className="bg-white px-10 py-4 flex justify-between items-center shadow-sm">
        <h1 className="flex flex-wrap items-center gap-4 text-sm">💚 Lakhushya</h1>

        <div className="flex items-center gap-6 text-sm">
          <span className="cursor-pointer">Home</span>
          <span className="cursor-pointer">Dashboard</span>
          <span className="text-gray-500 hidden sm:inline">Welcome, Donor</span>
          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* ===== PAGE HEADER ===== */}
      <div className="px-10 py-8">
        <h2 className="text-2xl font-bold text-green-900">
          Welcome back!
        </h2>
        <p className="text-gray-600 mt-1">
          Manage your donations and see your impact
        </p>
      </div>

      {/* ===== TABS ===== */}
      <div className="px-10">
        <div className="bg-[#F2EEE6] rounded-xl p-1 flex gap-2 text-sm w-full overflow-x-auto md:overflow-visible no-scrollbar">
          {[
            "overview",
            "create donation",
            "track donations",
            "view requests",
            "analytics",
            "certificates",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg capitalize transition text-center whitespace-nowrap md:flex-1  ${activeTab === tab
                ? "bg-white text-green-700 font-semibold shadow"
                : "text-gray-600 hover:bg-white"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === "overview" && (
        <div className="px-10 py-8">

          {/* ===== STAT CARDS ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Total Donations</p>
                <h3 className="text-3xl font-bold text-green-600 mt-2">24</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">
                🎁
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">People Helped</p>
                <h3 className="text-3xl font-bold text-green-600 mt-2">320</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl">
                ❤️
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Active Donations</p>
                <h3 className="text-3xl font-bold text-green-600 mt-2">5</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                🚚
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Impact Score</p>
                <h3 className="text-3xl font-bold text-green-600 mt-2">92%</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-2xl">
                ⭐
              </div>
            </div>

          </div>

          {/* ===== RECENT DONATIONS ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">

            {/* RECENT DONATIONS */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="text-base font-semibold text-gray-800 mb-4">
                Recent Donations
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center bg-[#F9F7F3] px-4 py-3 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Fresh vegetables and fruits</p>
                    <p className="text-xs text-gray-500">
                      Hope Foundation · 2024-01-15
                    </p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                    Delivered
                  </span>
                </div>

                <div className="flex justify-between items-center bg-[#F9F7F3] px-4 py-3 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Winter clothing collection</p>
                    <p className="text-xs text-gray-500">
                      Care Trust · 2024-01-18
                    </p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                    In Transit
                  </span>
                </div>

                <div className="flex justify-between items-center bg-[#F9F7F3] px-4 py-3 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Educational textbooks</p>
                    <p className="text-xs text-gray-500">
                      Learning Circle · 2024-01-20
                    </p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                    Picked Up
                  </span>
                </div>
              </div>
            </div>



          </div>

        </div>
      )}
      {activeTab === "create donation" && (
        <div className="px-10 py-8 flex justify-center">

          <div className="bg-white rounded-xl p-8 border border-gray-100 max-w-3xl w-full">

            <h3 className="text-xl font-semibold text-green-900 mb-2">
              Create a Donation
            </h3>
            <p className="text-gray-600 mb-6">
              Fill in the details below to schedule a donation pickup.
            </p>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >

              {/* Donation Type */}
              <select
                className="w-full mt-1 p-3 border rounded-lg"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={!!localStorage.getItem("currentRequestId")}
              >
                <option value="">Select Donation Type</option>
                <option value="Food">Food</option>
                <option value="Clothes">Clothes</option>
                <option value="Books">Books</option>
                <option value="Other">Other</option>
              </select>


              {/* Quantity */}
              <input
                type="number"
                min="0.1"
                step="any"
                className="w-full mt-1 p-3 border rounded-lg"
                placeholder={category === "Food" ? "Enter Quantity (kg)" : "Enter Quantity (units)"}
                value={quantity}
                disabled={!!localStorage.getItem("currentRequestId")}
                onChange={(e) => {
                  if (category === "Food") {
                    // allow decimal
                    setQuantity(e.target.value);
                  } else {
                    // only integer
                    const value = e.target.value;
                    if (/^\d*$/.test(value)) {
                      setQuantity(value);
                    }
                  }
                }}
              />


              {/* Item Description */}
              <textarea
                rows="3"
                className="w-full mt-1 p-3 border rounded-lg"
                placeholder="Describe the donation items (max 50 words)"
                value={itemName}
                onChange={(e) => {
                  const words = e.target.value.trim().split(/\s+/);
                  if (words.length <= 50) {
                    setItemName(e.target.value);
                  }
                }}
              />


              {/* Pickup Date */}
              <div>
                <label className="text-sm text-gray-600">Pickup Date</label>
                <input
                  type="date"
                  className="w-full mt-1 p-3 border rounded-lg"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                />

              </div>

              {/* Pickup Time */}
              <div>
                <label className="text-sm text-gray-600">Pickup Time</label>
                <input
                  type="time"
                  className="w-full mt-1 p-3 border rounded-lg"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                />

              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Pickup Location</label>
                <input placeholder="House No / Flat No"
                  className="w-full p-3 border rounded-lg"
                  value={houseNo}
                  onChange={(e) => setHouseNo(e.target.value)}
                />

                <input placeholder="Area"
                  className="w-full p-3 border rounded-lg"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />

                <input placeholder="City"
                  className="w-full p-3 border rounded-lg"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />

                <input placeholder="State"
                  className="w-full p-3 border rounded-lg"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                />

                <input placeholder="Pincode"
                  className="w-full p-3 border rounded-lg"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                />



              </div>
              {/*Mobile*/}
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Mobile Number</label>
                <input
                  className="w-full p-3 border rounded-lg"
                  placeholder="Enter mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>
              {/* ERROR MESSAGE */}
              {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

              {/* SUCCESS MESSAGE */}
              {success && <p className="text-green-600 text-sm mb-2">{success}</p>}

              {/* SUBMIT BUTTON */}
              <div className="mt-6 md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg disabled:opacity-50 w-full"
                >
                  {loading ? "Submitting..." : "Submit Donation"}
                </button>
              </div>
            </form>



          </div>

        </div>
      )}
      {activeTab === "track donations" && (
        <div className="px-10 py-8">

          <h3 className="text-xl font-semibold text-green-900 mb-1">
            Track Donations
          </h3>

          <p className="text-gray-600 mb-6">
            View and track all your donation requests
          </p>

          {donations.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No donations found
            </p>
          ) : (
            <div className="space-y-4">
              {donations.map((donation) => (
                <div
                  key={donation._id}
                  className="bg-[#F9F7F3] p-5 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {donation.itemName}
                    </p>

                    <p className="text-xs text-gray-500">
                      Category: {donation.category} | Quantity: {donation.quantity}
                    </p>

                    <p className="text-xs text-gray-500">
                      Pickup: {donation.pickupDate} · {donation.pickupTime}
                    </p>
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full ${getStatusBadge(donation.status)} ${donation.status === "accepted"
                      ? "bg-green-100 text-green-700"
                      : donation.status === "declined"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                      }`}
                  >
                    {formatStatus(donation.status)}
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {activeTab === "view requests" && (
        <div className="px-10 py-8">
          <h3 className="text-xl font-semibold mb-4">NGO Requests</h3>

          {requests.length === 0 ? (
            <p>No requests</p>
          ) : (
            requests.map((req) => (
              <div key={req._id} className="bg-white p-5 rounded-lg mb-4">
                <p><b>NGO:</b> {req.ngoId?.name}</p>
                <p><b>Category:</b> {req.category}</p>
                <p><b>Quantity:</b> {req.quantity}</p>
                <p><b>Description:</b> {req.description}</p>
                <p><b>Status:</b> {req.status}</p>
                {req.status === "pending" && (
                  <button
                    className="bg-green-500 text-white px-4 py-2 mt-2 rounded"
                    onClick={() => {
                      setActiveTab("create donation");

                      setCategory(req.category);
                      setQuantity(req.quantity);
                      setItemName(req.description);

                      localStorage.setItem("currentRequestId", req._id);
                      localStorage.setItem("requestDate", req.date);
                    }}
                  >
                    Fulfill Request
                  </button>
                )}

                {req.status === "accepted" && req.donorId?._id !== donorId && (
                  <span className="text-red-500 font-semibold">
                    Accepted by another donor
                  </span>
                )}

                {req.status === "accepted" && req.donorId?._id === donorId && (
                  <span className="text-green-600 font-semibold">
                    Accepted by you
                  </span>
                )}

                {req.status === "expired" && (
                  <span className="text-gray-500">Expired</span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="px-10 py-8">

          <h3 className="text-xl font-semibold text-green-900 mb-1">
            Analytics
          </h3>
          <p className="text-gray-600 mb-6">
            Overview of your donation impact and activity
          </p>

          <div className="space-y-6">

            {/* ===== TOP METRICS ===== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              <div className="bg-white p-6 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500">Total Donations</p>
                <h3 className="text-2xl font-bold text-green-600 mt-2">
                  24
                </h3>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500">Completed Donations</p>
                <h3 className="text-2xl font-bold text-green-600 mt-2">
                  19
                </h3>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500">People Helped</p>
                <h3 className="text-2xl font-bold text-green-600 mt-2">
                  320
                </h3>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500">NGOs Supported</p>
                <h3 className="text-2xl font-bold text-green-600 mt-2">
                  8
                </h3>
              </div>

            </div>

            {/* ===== COMPLETION RATE ===== */}
            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-600 mb-2">
                Donation Completion Rate
              </p>

              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{ width: "80%" }}
                ></div>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                80% of your donations have been successfully delivered
              </p>
            </div>

            {/* ===== MONTHLY CONTRIBUTION ===== */}
            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-600 mb-2">
                Monthly Contribution (January)
              </p>

              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{ width: "65%" }}
                ></div>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                13 out of 20 donations completed this month
              </p>
            </div>

          </div>

        </div>
      )}
      {activeTab === "certificates" && (
        <div className="px-10 py-8">

          <h3 className="text-xl font-semibold text-green-900 mb-1">
            Certificates
          </h3>
          <p className="text-gray-600 mb-6">
            View and download your contribution certificates
          </p>

          <div className="space-y-4">

            {/* CERTIFICATE 1 */}
            <div className="bg-[#F9F7F3] p-5 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              {/* LEFT INFO */}
              <div>
                <p className="font-medium text-sm">
                  Food Donation Appreciation Certificate
                </p>
                <p className="text-xs text-gray-500">
                  Issued on: 15 Jan 2024
                </p>
              </div>

              {/* RIGHT ACTIONS */}
              <div className="flex items-center gap-3">

                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  Available
                </span>

                <button className="text-xs border border-green-500 text-green-600 px-4 py-1.5 rounded-lg hover:bg-green-50 transition">
                  View
                </button>

                <button className="text-xs bg-green-500 text-white px-4 py-1.5 rounded-lg hover:bg-green-600 transition">
                  Download
                </button>

              </div>
            </div>

            {/* CERTIFICATE 2 */}
            <div className="bg-[#F9F7F3] p-5 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>
                <p className="font-medium text-sm">
                  Winter Clothing Drive Certificate
                </p>
                <p className="text-xs text-gray-500">
                  Issued on: 20 Jan 2024
                </p>
              </div>

              <div className="flex items-center gap-3">

                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  Available
                </span>

                <button className="text-xs border border-green-500 text-green-600 px-4 py-1.5 rounded-lg hover:bg-green-50 transition">
                  View
                </button>

                <button className="text-xs bg-green-500 text-white px-4 py-1.5 rounded-lg hover:bg-green-600 transition">
                  Download
                </button>

              </div>
            </div>

            {/* CERTIFICATE 3 */}
            <div className="bg-[#F9F7F3] p-5 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>
                <p className="font-medium text-sm">
                  Education Support Program Certificate
                </p>
                <p className="text-xs text-gray-500">
                  Issued on: 25 Jan 2024
                </p>
              </div>

              <div className="flex items-center gap-3">

                <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                  Pending
                </span>

                <button
                  disabled
                  className="text-xs border border-gray-300 text-gray-400 px-4 py-1.5 rounded-lg cursor-not-allowed"
                >
                  View
                </button>

                <button
                  disabled
                  className="text-xs bg-gray-300 text-gray-500 px-4 py-1.5 rounded-lg cursor-not-allowed"
                >
                  Download
                </button>

              </div>
            </div>

          </div>

        </div>
      )}


    </div>
  );
}
