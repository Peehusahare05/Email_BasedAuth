import { useEffect, useState } from "react";
import API from "../api/axios";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await API.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accesToken")}`
          }
        });

        setUser(res.data.user);

      } catch (err) {
        console.log("Error:", err);
      }
    }

    fetchUser();
  }, []);

  if (!user) return <p>Loading...</p>;

  return (
    <div className="container">
      <h1>Dashboard</h1>

      <div className="card">
        <h3>Welcome, {user.name} 👋</h3>
        <p><strong>Email:</strong> {user.email}</p>
        {/* <p><strong>Phone:</strong> {user.number}</p> */}
      </div>
    </div>
  );
}
