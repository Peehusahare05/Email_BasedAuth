// Signup page 
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";



export default function Signup() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/signup", data);
      alert("Signup successful! Please check your email to verify your account.");
      navigate("/login?checkEmail=1");
    } catch (err) {
      alert(err.response?.data?.message || "Signup failed");
    }
  };

  return (
  <div className="container">
    <h2>Signup</h2>

    <form onSubmit={handleSubmit}>
      <input
        name="name"
        placeholder="Name"
        onChange={handleChange}
      />

      <input
        name="email"
        placeholder="Email"
        onChange={handleChange}
      />

      <input
        name="password"
        type="password"
        placeholder="Password"
        onChange={handleChange}
      />

      <button type="submit">Signup</button>
    </form>
  </div>
);

}
