import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(
    localStorage.getItem("activeTab") || "overview"
  );
  // eslint-disable-next-line no-unused-vars
  const [users, setUsers] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [donations, setDonations] = useState([]);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    navigate("/login");
  };
  useEffect(() => {
    fetch("http://localhost:5000/admin/users")
      .then(res => res.json())
      .then(data => setUsers(data));

    fetch("http://localhost:5000/admin/donations")
      .then(res => res.json())
      .then(data => setDonations(data));
  }, []);

  return (
    <div className="min-h-screen bg-[#FBF7F2]">

      {/* ===== NAVBAR ===== */}
      <div className="bg-white px-10 py-4 flex justify-between items-center shadow-sm">
        <h1 className="flex items-center gap-2 text-sm font-semibold text-green-600">
          Lakhushya
        </h1>

        <div className="flex items-center gap-6 text-sm">
          <span className="cursor-pointer">Home</span>
          <span className="cursor-pointer">Dashboard</span>
          <span className="text-gray-500 hidden sm:inline">Welcome, admin</span>
          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* ===== HEADER ===== */}
      <div className="px-10 py-8">
        <h2 className="text-2xl font-bold text-green-900 flex items-center gap-2">
          🛡️ Admin Dashboard
        </h2>
        <p className="text-gray-600 mt-1">
          System administration and monitoring
        </p>
      </div>

      {/* ===== TABS ===== */}
      <div className="px-10">
        <div className="bg-[#F2EEE6] rounded-xl p-3 flex gap-20 text-sm overflow-x-auto">
          {[
            "overview",
            "user verification",
            "manage accounts",
            "monitoring",
            "complaints",
            "reports",
            "analytics",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                localStorage.setItem("activeTab", tab);
              }}
              className={`px-4 py-2 rounded-lg capitalize whitespace-nowrap transition ${activeTab === tab
                ? "bg-white text-green-700 font-semibold shadow"
                : "text-gray-600 hover:bg-white"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ================= OVERVIEW ================= */}
      {activeTab === "overview" && (
        <div className="px-10 py-8 space-y-8">

          {/* METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              ["Total Users", "1,250", "👥"],
              ["Active Donations", "89", "🎁"],
              ["Pending Verifications", "12", "⚠️"],
              ["Active Complaints", "3", "💬"],
            ].map(([title, value, icon]) => (
              <div
                key={title}
                className="bg-white p-6 rounded-xl border border-gray-100 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm text-gray-500">{title}</p>
                  <h3 className="text-2xl font-bold text-green-700 mt-2">
                    {value}
                  </h3>
                </div>
                <div className="text-2xl">{icon}</div>
              </div>
            ))}
          </div>

          {/* CHART PLACEHOLDERS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 h-72">
              <h3 className="font-semibold mb-2">Platform Growth</h3>
              <div className="h-full flex items-center justify-center text-gray-400">
                Line Chart Placeholder
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 h-72">
              <h3 className="font-semibold mb-2">User Distribution</h3>
              <div className="h-full flex items-center justify-center text-gray-400">
                Pie Chart Placeholder
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= USER VERIFICATION ================= */}
      {activeTab === "user verification" && (
        <div className="px-10 py-8">
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <h3 className="text-lg font-semibold mb-1">
              Pending User Verifications
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Review and verify new user registrations
            </p>

            {[
              ["Priya Sharma", "NGO", "priya@example.com", "2024-01-20"],
              ["Green Earth NGO", "NGO", "contact@greenearth.org", "2024-01-19"],
            ].map(([name, role, email, date]) => (
              <div
                key={email}
                className="bg-[#F9F7F3] p-5 rounded-lg flex flex-col md:flex-row md:justify-between gap-4 mb-4"
              >
                <div>
                  <p className="font-medium text-sm">
                    {name} <span className="text-xs bg-gray-200 px-2 py-0.5 rounded ml-2">{role}</span>
                  </p>
                  <p className="text-xs text-gray-500">Email: {email}</p>
                  <p className="text-xs text-gray-500">Registered: {date}</p>
                </div>

                <div className="flex gap-2 items-center">
                  <button className="bg-green-500 text-white px-4 py-1.5 rounded-lg text-xs">
                    Approve
                  </button>
                  <button className="border px-4 py-1.5 rounded-lg text-xs">
                    Reject
                  </button>
                  <button className="border px-4 py-1.5 rounded-lg text-xs">
                    Review Docs
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MANAGE ACCOUNTS ================= */}
      {activeTab === "manage accounts" && (
        <div className="px-10 py-8">
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">User Account Management</h3>

            <input
              type="text"
              placeholder="Search users by name, email, or role..."
              className="w-full mb-6 p-3 border rounded-lg"
            />

            {[
              ["Priya Sharma", "NGO"],
              ["Rajesh Kumar", "Volunteer"],
              ["Green Earth NGO", "NGO"],
            ].map(([name, role]) => (
              <div
                key={name}
                className="flex justify-between items-center bg-[#F9F7F3] p-4 rounded-lg mb-3"
              >
                <div>
                  <p className="font-medium text-sm">{name}</p>
                  <p className="text-xs text-gray-500">{role}</p>
                </div>
                <div className="flex gap-2">
                  <button className="border px-3 py-1.5 rounded-lg text-xs">
                    View Profile
                  </button>
                  <button className="border px-3 py-1.5 rounded-lg text-xs text-red-600">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MONITORING ================= */}
      {activeTab === "monitoring" && (
        <div className="px-10 py-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              ["Total Donors", "971"],
              ["Total NGOs", "45"],
              ["Total Volunteers", "234"],
              ["Completed Pickups", "567"],
            ].map(([label, value]) => (
              <div key={label} className="bg-white p-6 rounded-xl border">
                <p className="text-sm text-gray-500">{label}</p>
                <h3 className="text-2xl font-bold text-green-600 mt-2">
                  {value}
                </h3>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-xl border">
            <h3 className="font-semibold mb-4">NGO Performance Overview</h3>

            {[
              ["Hope Foundation", "4.8"],
              ["Care Trust", "4.6"],
              ["Green Earth", "4.9"],
            ].map(([ngo, rating]) => (
              <div
                key={ngo}
                className="flex justify-between items-center bg-[#F9F7F3] p-4 rounded-lg mb-3"
              >
                <p className="text-sm font-medium">{ngo}</p>
                <span className="text-sm">⭐ {rating}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= COMPLAINTS ================= */}
      {activeTab === "complaints" && (
        <div className="px-10 py-8">
          <div className="bg-white p-6 rounded-xl border">
            <h3 className="font-semibold mb-6">Manage Complaints</h3>

            {[
              ["Pickup not completed", "High", "Open"],
              ["Duplicate donation request", "Medium", "In Progress"],
            ].map(([title, priority, status]) => (
              <div
                key={title}
                className="flex justify-between items-center bg-[#F9F7F3] p-4 rounded-lg mb-4"
              >
                <div>
                  <p className="font-medium text-sm">{title}</p>
                  <p className="text-xs text-gray-500">
                    Priority: {priority} · Status: {status}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="border px-3 py-1.5 rounded-lg text-xs">
                    View Details
                  </button>
                  <button className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs">
                    Take Action
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= REPORTS ================= */}
      {activeTab === "reports" && (
        <div className="px-10 py-8">
          <div className="bg-white p-6 rounded-xl border">
            <h3 className="font-semibold mb-6">Generate Reports</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                "User Registration Report",
                "Donation Summary",
                "Platform Analytics",
                "User Activity Report",
                "Pickup Performance",
                "Complaint Summary",
              ].map((report) => (
                <button
                  key={report}
                  className="bg-[#F9F7F3] p-4 rounded-lg text-sm text-left hover:bg-gray-100"
                >
                  ⬇️ {report}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= ANALYTICS ================= */}
      {activeTab === "analytics" && (
        <div className="px-10 py-8">
          <div className="bg-white p-6 rounded-xl border h-72 flex items-center justify-center text-gray-400">
            Advanced analytics dashboard placeholder
          </div>
        </div>
      )}

    </div>
  );
}