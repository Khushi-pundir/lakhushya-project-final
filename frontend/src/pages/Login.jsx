import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF7F2]">

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
  fetch("http://localhost:5000/login", {
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
     
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("role", data.role.toLowerCase());

      if (data.role.toLowerCase() === "donor") {
        navigate("/donor-dashboard");
      } else if (data.role.toLowerCase() === "volunteer") {
        navigate("/volunteer-dashboard");
      }  else if (data.role === "NGO") {
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
