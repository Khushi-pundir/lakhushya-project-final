import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function DonorDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [donations, setDonations] = useState([]);
  const [events, setEvents] = useState([]);
  const donorId = localStorage.getItem("userId");
  const navigate = useNavigate();

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
  fetch("http://localhost:5000/events")
    .then(res => res.json())
    .then(data => setEvents(data))
    .catch(err => console.log(err));
}, []);
const fetchEvents = () => {
  fetch("http://localhost:5000/events")
    .then(res => res.json())
    .then(data => setEvents(data))
    .catch(err => console.log(err));
};
useEffect(() => {
  fetchEvents();
}, []);

  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [itemName, setItemName] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [address, setAddress] = useState("");
  // eslint-disable-next-line
  const isRegistered = (event) => {
  return event.registeredUsers?.some(
    (u) => u.userId === donorId && u.role === "Donor"
  );
};
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
            "events",
            "analytics",
            "certificates",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg capitalize transition text-center whitespace-nowrap md:flex-1  ${
                activeTab === tab
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

          {/* ===== RECENT DONATIONS & UPCOMING EVENTS ===== */}
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

            {/* UPCOMING EVENTS */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h3 className="text-base font-semibold text-gray-800 mb-4">
                Upcoming Events
              </h3>

              <div className="space-y-3">
                <div className="bg-[#F9F7F3] p-4 rounded-lg flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">Community Food Drive</p>
                    <p className="text-xs text-gray-500 mt-1">📅 2024-02-15</p>
                    <p className="text-xs text-gray-500">📍 Central Park</p>
                  </div>
                  <button className="text-xs bg-green-500 text-white px-4 py-1.5 rounded-lg hover:bg-green-600 transition">
                    Register
                  </button>
                </div>

                <div className="bg-[#F9F7F3] p-4 rounded-lg flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">Winter Clothing Distribution</p>
                    <p className="text-xs text-gray-500 mt-1">📅 2024-02-20</p>
                    <p className="text-xs text-gray-500">📍 City Center</p>
                  </div>
                  <button className="text-xs bg-green-500 text-white px-4 py-1.5 rounded-lg hover:bg-green-600 transition">
                    Register
                  </button>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Donation Type */}
       <select
  className="w-full mt-1 p-3 border rounded-lg"
  value={category}
  onChange={(e) => setCategory(e.target.value)}
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
  className="w-full mt-1 p-3 border rounded-lg"
  placeholder="Enter Quantity"
  value={quantity}
  onChange={(e) => setQuantity(e.target.value)}
/>


        {/* Item Description */}
        <textarea
  rows="3"
  className="w-full mt-1 p-3 border rounded-lg"
  placeholder="Describe the donation items"
  value={itemName}
  onChange={(e) => setItemName(e.target.value)}
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
          <label className="text-sm text-gray-600">Pickup Address</label>
          <textarea
  rows="2"
  className="w-full mt-1 p-3 border rounded-lg"
  value={address}
  onChange={(e) => setAddress(e.target.value)}
/>

        </div>

      </div>

      {/* SUBMIT BUTTON */}
      <div className="mt-6">
        <button
  className="bg-green-500 text-white px-6 py-3 rounded-lg"
  onClick={() => {
    fetch("http://localhost:5000/donation/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: donorId,
        role: "donor", 
        itemName,
        category,
        quantity,
        pickupDate,
        pickupTime,
        address
      })
    })
        .then((res) => res.json())
        .then((data) => {
        alert(data?.message);


        setItemName("");
        setCategory("");
        setQuantity("");
        setPickupDate("");
        setPickupTime("");
        setAddress("");
      });
  }}
>
  Submit Donation
</button>

      </div>

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
              className={`text-xs px-3 py-1 rounded-full ${getStatusBadge(donation.status)} ${
                donation.status === "accepted"
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


{activeTab === "events" && (
  <div className="px-10 py-8">

    <h3 className="text-xl font-semibold text-green-900 mb-1">
      Events
    </h3>
    <p className="text-gray-600 mb-6">
      Participate in upcoming community initiatives
    </p>

    <div className="space-y-6">

   {events.map(event => {
  const isRegistered = event.registeredUsers?.some(
    u => u.userId === donorId
  );
  

  return (
    <div key={event._id} className="bg-white p-6 rounded-xl border mb-4">
      <p className="font-semibold text-lg">{event.title}</p>

      <p className="text-sm text-gray-500">
        🏢 NGO: {event.ngoId?.name || "Unknown NGO"}
      </p>

      <p className="text-sm text-gray-500">📍 {event.location}</p>
      <p className="text-sm text-gray-500">📅 {event.date}</p>

      <p className="text-sm mt-2">{event.description}</p>

      <p className="text-xs mt-2 text-gray-500">
        Status: <b>{event.status}</b>
      </p>

      {isRegistered ? (
        <button
          disabled
          className="mt-3 bg-gray-300 text-gray-600 px-4 py-1 rounded-lg text-sm cursor-not-allowed"
        >
          Registered
        </button>
      ) : (
        <button
          className="mt-3 bg-green-500 text-white px-4 py-1 rounded-lg text-sm"
          onClick={() => {
            fetch(`http://localhost:5000/events/register/${event._id}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: donorId,
                role: "Donor"
              })
            })
              .then(res => res.json())
              .then(data => {
                alert(data.message);
                fetchEvents();
              });
          }}
        >
          Register
        </button>
      )}
    </div>
  );
})}



    </div>

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
