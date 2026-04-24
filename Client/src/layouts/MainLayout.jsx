import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow pt-[64px]">
        <Outlet />   {/* THIS IS THE FIX */}
      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}