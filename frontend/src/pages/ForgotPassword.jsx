import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");


  // OTP input handler
  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;

    let newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  // Send OTP
  const sendOtp = async () => {
    try {
      const res = await fetch("http://localhost:5001/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          type: "forgot"
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error sending OTP");
      }

      alert(data.message);

      setOtpSent(true);
      setOtpVerified(false);
      setTimer(30);
      setCanResend(false);

    } catch (err) {
      alert(err.message || "Error sending OTP");
    }
  };

  // Verify OTP
  const verifyOtp = () => {
    const finalOtp = otp.join("");

    if (finalOtp.length !== 6) {
      alert("Enter complete OTP");
      return;
    }

    setOtpVerified(true);
    setTimer(0);
    setCanResend(true);

    alert("OTP verified ✅");
  };

  // Password validation
  const validatePassword = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*\d)[^\s]{8,}$/;
    return regex.test(password);
  };

  // Reset password
  const resetPassword = async () => {
    const finalOtp = otp.join("");

    // ✅ check OTP verified
    if (!otpVerified) {
      alert("Please verify OTP first");
      return;
    }

    // ✅ check all fields
    if (!email || !finalOtp || !password || !confirmPassword) {
      alert("All fields are required");
      return;
    }

    // ✅ password match (BONUS FIX)
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // ✅ strong password validation
    if (!validatePassword(password)) {
      alert(
        "Password must be at least 8 characters, include 1 uppercase letter, 1 digit, and no spaces"
      );
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          otp: finalOtp,
          newPassword: password,
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error resetting password");
      }

      alert(data.message || "Password reset successful");

      navigate("/login");

    } catch (err) {
      alert(err.message || "Error resetting password");
    }
  };

  // Timer logic
  useEffect(() => {
    if (otpSent && !otpVerified && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [timer, otpSent, otpVerified]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF7F2]">
      <div className="bg-white p-8 rounded-2xl shadow-md w-[360px]">

        <h2 className="text-2xl font-bold text-green-700 text-center">
          Forgot Password 🔐
        </h2>

        <p className="text-gray-500 text-center mt-2">
          Enter your email to reset password
        </p>

        {/* EMAIL */}
        <input
          type="email"
          className="w-full mt-6 p-3 border rounded-lg"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          className="w-full mt-3 bg-green-500 text-white py-2 rounded-lg"
          onClick={sendOtp}
        >
          Send OTP
        </button>

        {/* SHOW AFTER OTP SENT */}
        {otpSent && (
          <>
            {/* OTP BOXES */}
            <div className="flex justify-between mt-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) =>
                    handleOtpChange(e.target.value, index)
                  }
                  className="w-10 h-10 text-center border rounded"
                />
              ))}
            </div>

            {!otpVerified && (
              <button
                onClick={verifyOtp}
                className="w-full mt-3 bg-green-600 text-white py-2 rounded-lg"
              >
                Verify OTP
              </button>
            )}

            {/* RESEND BUTTON (GREEN AFTER TIMER) */}
            {!otpVerified && (
              canResend ? (
                <button
                  onClick={sendOtp}
                  className="w-full mt-3 bg-green-500 text-white py-2 rounded-lg"
                >
                  Resend OTP
                </button>
              ) : (
                <p className="text-gray-500 mt-2 text-center">
                  Resend OTP in {timer}s
                </p>
              )
            )}

            {/* PASSWORD FIELDS */}
            {otpVerified && (
              <>

                <input
                  type="password"
                  className="w-full mt-4 p-3 border rounded-lg"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <input
                  type="password"
                  className="w-full mt-4 p-3 border rounded-lg"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                />

                <button
                  className="w-full mt-4 bg-green-500 text-white py-3 rounded-lg"
                  onClick={resetPassword}
                >
                  Reset Password
                </button>
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}
