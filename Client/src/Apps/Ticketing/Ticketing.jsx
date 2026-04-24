import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";

export default function Ticketing() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // TEMP data (replace later)
    setEvents([
      { id: 1, name: "Music Fest", price: 500 },
      { id: 2, name: "Tech Conference", price: 1200 },
      { id: 3, name: "Food Carnival", price: 300 },
    ]);
  }, []);

  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        <h2>Ticketing</h2>

        <div style={grid}>
          {events.map((e) => (
            <div key={e.id} style={card}>
              <h3>{e.name}</h3>
              <p>₹{e.price}</p>
              <button style={btn}>Book Now</button>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: 16,
};

const card = {
  border: "1px solid #ddd",
  padding: 15,
  borderRadius: 8,
};

const btn = {
  marginTop: 10,
  padding: "8px 12px",
  background: "#28a745",
  color: "#fff",
  border: "none",
  borderRadius: 5,
};