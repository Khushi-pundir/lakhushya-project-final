import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
export default function NgoDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  // eslint-disable-next-line no-unused-vars
  const [donations, setDonations] = useState([]);
  const [reqCategory, setReqCategory] = useState("");
  const [reqQuantity, setReqQuantity] = useState("");
  const [reqDate, setReqDate] = useState("");
  const [reqDesc, setReqDesc] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [requests, setRequests] = useState([]);
  const ngoId = localStorage.getItem("userId");
  const navigate = useNavigate();


  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    navigate("/login");
  };
  useEffect(() => {
    fetch(`http://localhost:5000/ngo/donations/${ngoId}`)
      .then(res => res.json())
      .then(data => setDonations(data))

      .catch(err => console.log(err));
  }, [ngoId]);
  useEffect(() => {
    fetch("http://localhost:5000/request/all")
      .then(res => res.json())
      .then(data => setRequests(data))
      .catch(err => console.log(err));
  }, []);
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    console.log({
      reqCategory,
      reqQuantity,
      reqDate,
      reqDesc
    });
    setError("");
    setSuccess("");
    if (!ngoId) {
      setError("User not logged in");
      return;
    }
    if (
      !reqCategory ||
      !reqQuantity ||
      !reqDate ||
      !reqDesc ||
      reqDesc.trim() === ""
    ) {
      setError("All fields required");
      return;
    }

    const quantityNum = Number(reqQuantity);

    if (quantityNum <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    if (quantityNum > 1000) {
      setError("Please enter a realistic quantity");
      return;
    }
    // Category-based validation
    if (reqCategory !== "Food" && !Number.isInteger(quantityNum)) {
      setError("Quantity must be a whole number for this category");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    if (reqDate < today) {
      setError("Date cannot be in past");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/request/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ngoId,
          category: reqCategory,
          quantity: Number(reqQuantity),
          date: reqDate,
          description: reqDesc,
        }),
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server is not returning JSON. Check backend.");
      }



      if (!res.ok) throw new Error(data.message);

      setSuccess("Request published!");
const updated = await fetch("http://localhost:5000/request/all");
const updatedData = await updated.json();
setRequests(updatedData);
      setReqCategory("");
      setReqQuantity("");
      setReqDate("");
      setReqDesc("");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#FBF7F2]">

      {/* ===== NAVBAR ===== */}
      <div className="bg-white px-10 py-4 flex justify-between items-center shadow-sm">
        <h1 className="flex items-center gap-2 text-sm">💚 Lakhushya</h1>

        <div className="flex items-center gap-6 text-sm">
          <span className="cursor-pointer">Home</span>
          <span className="cursor-pointer">Dashboard</span>
          <span className="text-gray-500 hidden sm:inline">
            Welcome, NGO
          </span>
          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* ===== PAGE HEADER ===== */}
      <div className="px-10 py-8">
        <h2 className="text-2xl font-bold text-green-900">
          NGO Dashboard
        </h2>
        <p className="text-gray-600 mt-1">
          Manage donations and community impact
        </p>
      </div>

      {/* ===== TABS ===== */}
      <div className="px-10">
        <div className="bg-[#F2EEE6] rounded-xl p-1 flex gap-2 text-sm w-full overflow-x-auto md:overflow-visible no-scrollbar">
          {[
            "overview",
            "manage donations",
            "schedule pickups",
            "raise requests",
            "analytics",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg capitalize transition text-center whitespace-nowrap md:flex-1 ${activeTab === tab
                ? "bg-white text-green-700 font-semibold shadow"
                : "text-gray-600 hover:bg-white"
                }`}
            >
              {tab}
            </button>
          ))}

        </div>
      </div>


      {/* ===== OVERVIEW ===== */}
      {activeTab === "overview" && (
        <div className="px-10 py-8">

          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Pending Donations", value: "12", icon: "⏳" },
              { label: "People Served", value: "1,240", icon: "❤️" },
              { label: "This Month", value: "320", icon: "📊" },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-xl shadow-sm flex justify-between items-center"
              >
                <div>
                  <p className="text-gray-500 text-sm">{item.label}</p>
                  <h3 className="text-3xl font-bold text-green-600 mt-2">
                    {item.value}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">
                  {item.icon}
                </div>
              </div>
            ))}
          </div>

          {/* RECENT DONATIONS & PICKUPS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">

            {/* RECENT DONATIONS */}
            <div className="bg-white p-6 rounded-xl border">
              <h3 className="font-semibold mb-4">Recent Donations</h3>

              <div className="space-y-3">
                {donations.length === 0 ? (
                  <p className="text-gray-500 text-sm">No donations</p>
                ) : (
                  donations.map((donation) => (
                    <div
                      key={donation._id}
                      className="bg-white p-4 rounded-xl border flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{donation.itemName}</p>
                        <p className="text-xs text-gray-500">
                          Qty: {donation.quantity} · {donation.donorId?.name}
                        </p>
                      </div>

                      <span
                        className={`text-xs px-4 py-1 rounded-full ${donation.status === "pending_ngo"
                          ? "bg-yellow-100 text-yellow-700"
                          : donation.status === "ngo_approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                          }`}
                      >
                        {donation.status.replace("_", " ")}
                      </span>

                    </div>
                  ))
                )}
              </div>
            </div>

            {/* TODAY’S PICKUPS */}
            <div className="bg-white p-6 rounded-xl border">
              <h3 className="font-semibold mb-4">Today’s Pickups</h3>

              <div className="space-y-3">
                <div className="flex justify-between bg-[#F9F7F3] p-3 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Food Donation</p>
                    <p className="text-xs text-gray-500">10:00 AM · Delhi</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                    Confirmed
                  </span>
                </div>

                <div className="flex justify-between bg-[#F9F7F3] p-3 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Clothes</p>
                    <p className="text-xs text-gray-500">1:00 PM · Jaipur</p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                    Pending
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ===== MANAGE DONATIONS ===== */}
      {activeTab === "manage donations" && (
        <div className="px-10 py-8 space-y-4">
          {donations.length === 0 ? (
            <p className="text-gray-500 text-sm">No donations</p>
          ) : (
            donations.map((donation) => (
              <div
                key={donation._id}
                className="bg-white p-6 rounded-xl border flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{donation.itemName}</p>
                  <p className="text-xs text-gray-500">
                    Qty: {donation.quantity} · {donation.donorId?.name}
                  </p>
                </div>

                {/* RIGHT SIDE */}
                <div className="flex gap-3 items-center">
                  {/* PENDING NGO */}
                  {donation.status === "pending_ngo" && (
                    <>
                      <button
                        className="border px-4 py-1 rounded-lg text-sm"
                        onClick={() =>
                          fetch(`http://localhost:5000/ngo/decline/${donation._id}`, {
                            method: "POST",
                          }).then(() => window.location.reload())
                        }
                      >
                        Decline
                      </button>

                      <button
                        className="bg-green-500 text-white px-4 py-1 rounded-lg text-sm"
                        onClick={() =>
                          fetch(`http://localhost:5000/ngo/accept/${donation._id}`, {
                            method: "POST",
                          }).then(() => window.location.reload())
                        }
                      >
                        Accept
                      </button>
                    </>
                  )}

                  {/* NGO APPROVED */}
                  {donation.status === "ngo_approved" && (
                    <span className="text-xs bg-green-100 text-green-700 px-4 py-1 rounded-full">
                      Accepted
                    </span>
                  )}

                  {/* NGO DECLINED */}
                  {donation.status === "ngo_declined" && (
                    <span className="text-xs bg-red-100 text-red-700 px-4 py-1 rounded-full">
                      Declined
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}





      {/* ===== RAISE REQUESTS ===== */}
      {activeTab === "raise requests" && (
        <div className="px-10 py-8 max-w-3xl">
          <div className="bg-white p-6 rounded-xl border">
            <h3 className="font-semibold mb-4">Raise Donation Request</h3>

            <form
              onSubmit={handleRequestSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >

              <select
                value={reqCategory || ""}
                onChange={(e) => {
                  console.log("Selected:", e.target.value); // DEBUG
                  setReqCategory(e.target.value);
                }}
                className="border p-3 rounded-lg"
              >
                <option value="">Select Category</option>
                <option value="Food">Food</option>
                <option value="Clothes">Clothes</option>
                <option value="Books">Books</option>
              </select>

              <input
                type="number"
                step={reqCategory === "Food" ? "0.1" : "1"}
                placeholder={reqCategory === "Food" ? "Quantity (kg)" : "Quantity (units)"}

                value={reqQuantity}
                onChange={(e) => setReqQuantity(e.target.value)}
                className="border p-3 rounded-lg"
              />

              <input
                type="date"
                value={reqDate}
                onChange={(e) => {
                  console.log("DATE SELECTED:", e.target.value); // DEBUG
                  setReqDate(e.target.value);
                }}
                className="border p-3 rounded-lg"
              />

              <textarea
                placeholder="Description"
                value={reqDesc}
                onChange={(e) => setReqDesc(e.target.value)}
                onBlur={() => setReqDesc(reqDesc.trim())}
                className="border p-3 rounded-lg md:col-span-2"
              />

              {error && <p className="text-red-500">{error}</p>}
              {success && <p className="text-green-600">{success}</p>}

              <button
                type="submit"
                disabled={loading}
                className="bg-green-500 text-white px-6 py-2 rounded-lg md:col-span-2"
              >
                {loading ? "Submitting..." : "Publish Request"}
              </button>

            </form>
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Your Requests</h4>

              {requests
                .filter(req => req.ngoId?._id === ngoId)
                .map((req) => (
                  <div key={req._id} className="border p-3 mb-2 rounded">
                    <p>Category: {req.category}</p>
                    <p>Quantity: {req.quantity}</p>
                    <p>Status: {req.status}</p>

                    {req.status === "accepted" && (
                      <>
                        <p>Accepted by: {req.donorId?.name}</p>
                        <p>Pickup Status: {req.pickupStatus}</p>
                      </>
                    )}
                  </div>
                ))}
            </div>

          </div>
        </div>
      )}

      {/* ===== ANALYTICS ===== */}
      {activeTab === "analytics" && (
        <div className="px-10 py-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {["Food", "Clothes", "Books", "Hygiene"].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border">
              <p className="text-sm text-gray-500">{item}</p>
              <h3 className="text-2xl font-bold text-green-600 mt-2">
                {Math.floor(Math.random() * 500) + 100}
              </h3>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}