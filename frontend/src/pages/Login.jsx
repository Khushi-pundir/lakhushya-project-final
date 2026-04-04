import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { setStoredAuth } from "../utils/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#FBF7F2]">

      <button
        type="button"
        onClick={() => navigate("/")}
        className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 9.75V21h13.5V9.75" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 21v-6h4.5v6" />
          </svg>
        </span>
        Home
      </button>

      <div className="bg-white p-8 rounded-2xl shadow-md w-[360px] animate-fade-in">

        <h2 className="text-2xl font-bold text-green-700 text-center">
          Welcome Back 💚
        </h2>

        <p className="text-gray-500 text-center mt-2">
          Login to continue
        </p>

        <input
  type="email"
  className="w-full mt-6 p-3 border rounded-lg"
  placeholder="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

        <input
  type="password"
  className="w-full mt-4 p-3 border rounded-lg"
  placeholder="Password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>

        <button
  className="w-full mt-6 bg-green-500 text-white py-3 rounded-lg"
  onClick={() => {
  fetch("http://localhost:5001/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
    .then(async (res) => {
      const text = await res.text();

      if (!res.ok) {
        alert(text); // shows "Invalid email or password"
        return;
      }

      const data = JSON.parse(text);
      alert("Login successful");
     
      setStoredAuth({
        userId: data.userId,
        name: data.name,
        role: data.role.toLowerCase(),
      });

      if (data.role.toLowerCase() === "donor") {
        navigate("/donor-dashboard");
      } else if (data.role.toLowerCase() === "volunteer") {
        navigate("/volunteer-dashboard");
      }  else if (data.role === "NGO") {
        navigate("/ngo-dashboard");
      } else if (data.role === "Admin") {
        navigate("/admin-dashboard");
      }else {
        alert("Unknown role");
      }
    })
    .catch(() => {
      alert("Server not reachable");
    });
}}
>
  Login
</button>
<p className="text-right text-sm mt-2">
  <span
    className="text-green-600 cursor-pointer"
    onClick={() => navigate("/forgot")}
  >
    Forgot Password?
  </span>
</p>
        <p className="text-center text-sm mt-4">
          Don’t have an account?{" "}
          <span
            className="text-green-600 cursor-pointer"
            onClick={() => navigate("/register")}
          >
            Register
          </span>
        </p>

      </div>

    </div>
  );
}
