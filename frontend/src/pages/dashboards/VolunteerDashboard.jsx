import { useEffect, useState ,useCallback} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
export default function VolunteerDashboard() {
  const [activeTab, setActiveTab] = useState("events");
  const [pickups, setPickups] = useState([]);
  const [events, setEvents] = useState([]);
  // TEMP – replace later with logged-in volunteer ID
  const volunteerId = localStorage.getItem("userId");
  const navigate = useNavigate();
  
    const handleLogout = () => {
      localStorage.removeItem("userId");
      localStorage.removeItem("role");
      navigate("/login");
    };
const fetchPickups = useCallback(async () => {
  try {
    const res = await axios.get(
      `http://localhost:5000/volunteer/pickups/${volunteerId}`
    );
    setPickups(res.data);
  } catch (err) {
    console.error(err);
  }
}, [volunteerId]);
  useEffect(() => {
    fetchPickups();
  }, [fetchPickups]);  //THIS LINE CONFLICTED


const fetchEvents = async () => {
  try {
    const res = await fetch("http://localhost:5000/events");
    const data = await res.json();
    setEvents(data);
  } catch (err) {
    console.error(err);
  }
};
useEffect(() => {
  fetchEvents();
}, []);
  const acceptPickup = async (id) => {
    try {
      await axios.post(
        `http://localhost:5000/volunteer/accept/${id}`,
        { volunteerId }
      );
      fetchPickups();
    } catch (err) {
      console.error(err);
    }
  };

  const declinePickup = async (id) => {
    try {
      await axios.post(
        `http://localhost:5000/volunteer/decline/${id}`
      );
      fetchPickups();
    } catch (err) {
      console.error(err);
    }
  };
  // eslint-disable-next-line
  const isRegistered = (event) => {
  return event.registeredUsers?.some(
    (u) => u.userId === volunteerId && u.role === "Volunteer"
  );
};
  return (
    <div className="min-h-screen bg-[#FBF7F2]">

      {/* NAVBAR */}
      <div className="bg-white px-10 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-sm font-semibold">💚 Lakhushya</h1>
        <div className="flex items-center gap-6 text-sm">
          <span className="cursor-pointer">Home</span>
          <span className="cursor-pointer">Dashboard</span>
          <span className="text-gray-500 hidden sm:inline">
            Welcome, Volunteer
          </span>
          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* HEADER */}
      <div className="px-10 py-8">
        <h2 className="text-2xl font-bold text-green-900">
          Volunteer Dashboard
        </h2>
        <p className="text-gray-600">
          Manage your volunteer activities and see your impact
        </p>
      </div>

      {/* TABS */}
      <div className="px-10">
        <div className="bg-[#F2EEE6] rounded-xl p-1 text-sm w-full flex md:grid md:grid-cols-6 overflow-x-auto md:overflow-visible no-scrollbar">
          {[
            "overview",
            "manage pickups",
            "events",
            "analytics",
            "certificates",
            "feedback",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg capitalize transition text-center whitespace-nowrap w-full ${
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

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div className="px-10 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Stat title="Total Pickups" value={pickups.length} icon="🚚" />
            <Stat title="Events Joined" value="15" icon="🎉" />
            <Stat title="Volunteer Points" value="1450" icon="⭐" />
            <Stat title="Active Tasks" value={pickups.filter(p => p.status === "pending").length} icon="📋" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
            <Box title="Upcoming Pickups">
              {pickups.slice(0, 2).map((pickup) => (
                <Pickup
                  key={pickup._id}
                  name={
                    pickup.requestedBy === "volunteer"
                      ? pickup.volunteerId?.name
                      : pickup.ngoId?.name
                  }
                  date={`${pickup.pickupDate} · ${pickup.pickupTime}`}
                  location={pickup.address}
                  status={pickup.status === "accepted" ? "Confirmed" : "Pending"}
                  color={pickup.status === "accepted" ? "green" : "yellow"}
                />
              ))}
            </Box>

            <Box title="Available Events">
              <Event
                title="Community Food Drive"
                date="2024-02-15 · 10:00 AM"
                location="Central Park, Delhi"
                action="Register"
              />
            </Box>
          </div>
        </div>
      )}

      {/* MANAGE PICKUPS */}
      {activeTab === "manage pickups" && (
        <div className="px-10 py-8">
          <Box title="Assigned Pickups">
            {pickups.map((pickup) => (
              <PickupManage
                key={pickup._id}
                volunteer={
                  pickup.requestedBy === "volunteer"
                    ? pickup.volunteerId?.name
                    : pickup.ngoId?.name
                }
                category={pickup.category}
                date={`${pickup.pickupDate} · ${pickup.pickupTime}`}
                location={pickup.address}
                status={pickup.status === "accepted" ? "Confirmed" : "Pending"}
                actions={pickup.status === "ngo_approved"}
                onAccept={() => acceptPickup(pickup._id)}
                onDecline={() => declinePickup(pickup._id)}
              />
            ))}
          </Box>
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
    u => u.userId === volunteerId
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
                userId: volunteerId,
                role: "Volunteer"
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
    </div>
  );
}

/* ========= REUSABLE COMPONENTS (UNCHANGED UI) ========= */

const Stat = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-xl flex justify-between items-center">
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="text-3xl font-bold text-green-600">{value}</h3>
    </div>
    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
      {icon}
    </div>
  </div>
);

const Box = ({ title, children }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-4">
    <h3 className="font-semibold text-gray-800">{title}</h3>
    {children}
  </div>
);

const Pickup = ({ name, date, location, status, color }) => (
  <div className="bg-[#F9F7F3] p-4 rounded-lg flex justify-between items-center">
    <div>
      <p className="font-medium text-sm">{name}</p>
      <p className="text-xs text-gray-500">{date}</p>
      <p className="text-xs text-gray-500">{location}</p>
    </div>
    <span className={`text-xs bg-${color}-100 text-${color}-700 px-3 py-1 rounded-full`}>
      {status}
    </span>
  </div>
);

const PickupManage = ({
  volunteer,
  category,
  date,
  location,
  status,
  actions,
  onAccept,
  onDecline
}) => (
  <div className="bg-[#F9F7F3] p-5 rounded-lg flex justify-between items-center">
    <div>
      <p className="font-medium text-sm">Pickup from {volunteer}</p>
      <p className="text-xs text-gray-500">Category: {category}</p>
      <p className="text-xs text-gray-500">{date}</p>
      <p className="text-xs text-gray-500">{location}</p>
    </div>
    {actions ? (
      <div className="flex gap-2">
        <button onClick={onAccept} className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs">
          Accept
        </button>
        <button onClick={onDecline} className="border px-3 py-1 rounded-lg text-xs">
          Decline
        </button>
      </div>
    ) : (
      <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
        {status}
      </span>
    )}
  </div>
);

const Event = ({ title, date, location, action }) => (
  <div className="bg-[#F9F7F3] p-4 rounded-lg flex justify-between items-center">
    <div>
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-gray-500">{date}</p>
      <p className="text-xs text-gray-500">{location}</p>
    </div>
    <button className="text-xs bg-green-500 text-white px-4 py-1.5 rounded-lg">
      {action}
    </button>
  </div>
);
