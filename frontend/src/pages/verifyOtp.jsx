import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "../api/axios";
import "./Otp.css";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  // Handle single digit typing
  const handleChange = (value, index) => {
    if (/[^0-9]/.test(value)) return; // only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next box automatically
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle backspace (go back)
  const handleBackspace = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Submit OTP
  const handleVerify = async (e) => {
    e.preventDefault();

    const finalOtp = otp.join("");
    if (finalOtp.length !== 6) {
      alert("Please enter complete 6-digit OTP");
      return;
    }

    try {
      await axios.post("/auth/verify-otp", { email, otp: finalOtp });

      alert("OTP Verified Successfully!");
      navigate("/login");

    } catch (err) {
      alert(err.response?.data?.message || "Error verifying OTP");
    }
  };

  return (
    <div className="otp-container">
      <h2>Verify OTP</h2>
      <p>OTP sent to: {email}</p>

      <form
        onSubmit={handleVerify}
        className="otp-box-group"

        // ⭐ FULL OTP PASTE SUPPORT
        onPaste={(e) => {
          e.preventDefault();
          const pasteData = e.clipboardData.getData("text").slice(0, 6);

          if (!/^[0-9]+$/.test(pasteData)) return;

          const newOtp = pasteData.split("");
          setOtp(newOtp);

          inputRefs.current[newOtp.length - 1].focus();
        }}
      >
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            maxLength="1"
            value={digit}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleBackspace(e, index)}
            className="otp-input"
          />
        ))}

        <button type="submit" className="verify-btn">Verify OTP</button>
      </form>
    </div>
  );
}
