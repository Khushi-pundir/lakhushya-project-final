import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [phoneCode, setPhoneCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [aadhaar, setAadhaar] = useState("");

  // ✅ NEW MANUAL ADDRESS FIELDS
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [country, setCountry] = useState("");

  const sendOTP = async () => {
    try {
      await axios.post("http://localhost:5000/send-otp", { email });
      alert("OTP sent successfully");
      setOtpSent(true);
      setTimer(30);
      setCanResend(false);
    } catch (err) {
  alert(err.response?.data?.message || "Error sending OTP");
}
  };

  const verifyOTP = () => {
    if (otp.join("").length !== 6) return alert("Enter complete OTP");
    setOtpVerified(true);
  };

  const handleOtpChange = (val, i) => {
    if (isNaN(val)) return;

    let newOtp = [...otp];
    newOtp[i] = val;
    setOtp(newOtp);

    if (val && i < 5) {
      document.getElementById(`otp-${i + 1}`).focus();
    }
  };

  const handleKeyDown = (e, i) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`).focus();
    }
  };

  useEffect(() => {
    if (otpSent && !otpVerified && timer > 0) {
      const interval = setInterval(() => {
        setTimer((p) => p - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
    if (timer === 0) setCanResend(true);
  }, [timer, otpSent, otpVerified]);

  const validatePassword = (p) =>
    /^(?=.*[A-Z])(?=.*\d)[^\s]{8,}$/.test(p);

  const isAbove18 = (dob) =>
    new Date().getFullYear() - new Date(dob).getFullYear() >= 18;

  return (
    <div className="min-h-screen flex justify-center items-center bg-[#FBF7F2]">
      <div className="bg-white p-8 rounded-xl w-[420px]">

        <h2 className="text-xl font-bold text-center text-green-700">
          Create Account 🌱
        </h2>

        <input
          placeholder="Full Name"
          className="w-full mt-4 p-3 border"
          disabled={otpVerified}
          onChange={(e)=>setName(e.target.value)}
        />

        <input
          placeholder="Email"
          className="w-full mt-4 p-3 border"
          disabled={otpVerified}
          onChange={(e)=>setEmail(e.target.value)}
        />

        {!otpVerified && (
          <button
            className="w-full bg-green-500 text-white mt-4 p-2"
            onClick={sendOTP}
            disabled={!canResend && otpSent}
          >
            {canResend || !otpSent ? "Send OTP" : `Resend in ${timer}s`}
          </button>
        )}

        {otpSent && !otpVerified && (
          <>
            <div className="flex gap-2 mt-4">
              {otp.map((d,i)=>(
                <input
                  key={i}
                  id={`otp-${i}`}
                  maxLength="1"
                  className="w-10 h-10 border text-center"
                  value={d}
                  onChange={(e)=>handleOtpChange(e.target.value,i)}
                  onKeyDown={(e)=>handleKeyDown(e,i)}
                />
              ))}
            </div>

            <button className="w-full bg-green-600 mt-3 text-white p-2" onClick={verifyOTP}>
              Verify OTP
            </button>
          </>
        )}

        {otpVerified && (
          <>
            <select className="w-full mt-4 p-3 border" onChange={(e)=>setRole(e.target.value)}>
              <option value="">Select Role</option>
              <option>Donor</option>
              <option>Volunteer</option>
              <option>NGO</option>
            </select>

            {/* PHONE */}
            <div className="flex mt-4">
              <select className="w-1/3 border p-3" onChange={(e)=>setPhoneCode(e.target.value)}>
                <option>🇮🇳 +91</option>
                <option>🇺🇸 +1</option>
              </select>
              <input className="w-2/3 border p-3" placeholder="Phone Number" onChange={(e)=>setPhone(e.target.value)} />
            </div>

            {/* ADDRESS SECTION */}
            <input placeholder="Address" className="w-full mt-4 p-3 border" onChange={(e)=>setAddress(e.target.value)} />
            <input placeholder="City" className="w-full mt-4 p-3 border" onChange={(e)=>setCity(e.target.value)} />
            <input placeholder="Pincode" className="w-full mt-4 p-3 border" onChange={(e)=>setPincode(e.target.value)} />
            <input placeholder="State" className="w-full mt-4 p-3 border" onChange={(e)=>setStateVal(e.target.value)} />
            <input placeholder="Country" className="w-full mt-4 p-3 border" onChange={(e)=>setCountry(e.target.value)} />

            {/* DOB */}
            <label className="mt-4 block text-sm text-gray-600">
              Date of Birth
            </label>
            <input type="date" className="w-full p-3 border" onChange={(e)=>setDob(e.target.value)} />

            {(role==="Donor"||role==="Volunteer") && (
              <input placeholder="Aadhaar Number" className="w-full mt-4 p-3 border" onChange={(e)=>setAadhaar(e.target.value)} />
            )}

            <input type="password" placeholder="Password" className="w-full mt-4 p-3 border" onChange={(e)=>setPassword(e.target.value)} />
            <input type="password" placeholder="Confirm Password" className="w-full mt-4 p-3 border" onChange={(e)=>setConfirmPassword(e.target.value)} />

            <button className="w-full bg-green-500 mt-4 text-white p-3"
              onClick={()=>{
                const nameRegex = /^[A-Za-z\s]+$/;

if (!nameRegex.test(name)) {
  alert("Name should contain only letters and spaces");
  return;
}
                if (!name || !email || !role || !phone || !address || !city || !pincode || !stateVal || !country || !dob || !password)
                  return alert("All fields are required");

                if (!validatePassword(password))
                  return alert("Password must be 8+ chars, 1 uppercase, 1 digit, no spaces");

                if (password!==confirmPassword)
                  return alert("Passwords do not match");

                if (!isAbove18(dob))
                  return alert("Must be above 18");

                if ((role==="Donor"||role==="Volunteer") && !/^\d{12}$/.test(aadhaar))
                  return alert("Invalid Aadhaar");

                alert("Registered Successfully");
                navigate("/login");
              }}
            >
              Register
            </button>
          </>
        )}

      </div>
    </div>
  );
}