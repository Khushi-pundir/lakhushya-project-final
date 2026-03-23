import { useNavigate } from "react-router-dom";
import { useState , useEffect } from "react";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [nationality, setNationality] = useState("");
  const [dob, setDob] = useState("");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [timer, setTimer] = useState(0);
const [canResend, setCanResend] = useState(true);

  const sendOTP = () => {

  const appVerifier = window.recaptchaVerifier;

  signInWithPhoneNumber(auth, "+91" + phone, appVerifier)
    .then((confirmationResult) => {

      window.confirmationResult = confirmationResult;
      setOtpSent(true);

      alert("OTP sent successfully");
      setCanResend(false);
setTimer(30);

    })
    .catch((error) => {
      console.log(error);
      alert(error.message);
    });

};
  const verifyOTP = () => {

    window.confirmationResult.confirm(otp.join(""))
      .then(() => {
        alert("Phone verified successfully");
        setOtpVerified(true);
      })
      .catch(() => {
        alert("Invalid OTP");
      });
  };

const handleOtpChange = (value, index) => {

  if (isNaN(value)) return;

  const newOtp = [...otp];
  newOtp[index] = value;
  setOtp(newOtp);

  if (value && index < 5) {
    document.getElementById(`otp-${index + 1}`).focus();
  }

};
useEffect(() => {

  if (timer > 0) {
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }

  if (timer === 0) {
    setCanResend(true);
  }

}, [timer]);
useEffect(() => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      { size: "invisible" }
    );
  }
}, []);
  return (

    <div className="min-h-screen bg-[#FBF7F2] flex items-center justify-center">

      <div className="bg-white p-8 rounded-2xl shadow-md w-[420px] animate-fade-in">

        <h2 className="text-2xl font-bold text-green-700 text-center">
          Create Account 🌱
        </h2>

        <p className="text-gray-500 text-center mt-1">
          Join Lakhushiya and start making a difference
        </p>

        <input
          className="w-full border p-3 rounded-lg mt-6"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full border p-3 rounded-lg mt-4"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <select
          className="w-full border p-3 rounded-lg mt-4 focus:outline-green-500"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">Select Role</option>
          <option>Donor</option>
          <option>Volunteer</option>
          <option>NGO</option>
        </select>

        {(role === "Donor" || role === "Volunteer") && (
          <>
            <input
              className="w-full border p-3 rounded-lg mt-4"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <button
  type="button"
  className="w-full bg-blue-500 text-white py-2 rounded-lg mt-2 disabled:bg-gray-400"
  onClick={sendOTP}
  disabled={!canResend}
>
  {canResend ? "Send OTP" : `Resend in ${timer}s`}
</button>
            {otpSent && (
  <>
    <div className="flex justify-between mt-4">
  {otp.map((data, index) => (
    <input
      key={index}
      id={`otp-${index}`}
      type="text"
      maxLength="1"
      value={data}
      onChange={(e) => handleOtpChange(e.target.value, index)}
      className="w-10 h-10 border rounded text-center text-lg"
    />
  ))}
</div>

    <button
      type="button"
      className="w-full bg-green-600 text-white py-2 rounded-lg mt-2"
      onClick={verifyOTP}
    >
      Verify OTP
    </button>
  </>
)}

            <input
              className="w-full border p-3 rounded-lg mt-4"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <input
              className="w-full border p-3 rounded-lg mt-4"
              placeholder="Pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
            />

            <input
              className="w-full border p-3 rounded-lg mt-4"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            <input
              className="w-full border p-3 rounded-lg mt-4"
              placeholder="State"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />

            <input
              className="w-full border p-3 rounded-lg mt-4"
              placeholder="Nationality"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
            />

            <input
              type="date"
              className="w-full border p-3 rounded-lg mt-4"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </>
        )}

        <input
          type="password"
          className="w-full border p-3 rounded-lg mt-4"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          className="w-full border p-3 rounded-lg mt-4 focus:outline-green-500"
          placeholder="Confirm Password"
        />

        <button
          className="w-full bg-green-500 text-white py-3 rounded-lg mt-6 font-semibold"
          onClick={() => {
            if ((role === "Donor" || role === "Volunteer") && !otpVerified) {
    alert("Please verify OTP first");
    return;
  }

            fetch("http://localhost:5000/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name,
                email,
                password,
                role,
                phone,
                address,
                pincode,
                city,
                state,
                nationality,
                dob
              })
            })
              .then(res => res.text())
              .then(data => {
                alert(data);
                navigate("/login");
              });
          }}
        >
          Register
        </button>

        <p
          onClick={() => navigate("/login")}
          className="text-sm text-green-600 mt-4 cursor-pointer text-center"
        >
          Already have an account? Login
        </p>
{/* recaptcha container (required for Firebase OTP) */}
        <div id="recaptcha-container"></div>

      </div>
    </div>
  );
}