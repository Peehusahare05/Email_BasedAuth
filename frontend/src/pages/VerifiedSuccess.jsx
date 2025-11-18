// Verified success page 
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function VerifiedSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = params.get("token");
      const email = params.get("email");

      
      try {
  await API.get(`/auth/verify-email?token=${token}&email=${email}`);
  alert("invalid email");
  navigate("/login");
} catch (err) {
  alert("Email Verified Successfully!");
}

    };

    verifyEmail();
  }, []);

  return <h2>Verifying email...</h2>;
}
