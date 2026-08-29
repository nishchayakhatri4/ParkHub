import { Routes, Route } from "react-router-dom"

import Login from "./pages/Login"
import Register from "./pages/Register"
import Home from "./pages/Home"
import Search from "./pages/Search"
import ParkingDetails from "./pages/ParkingDetails"
import PaymentPage from "./pages/PaymentPage"
import UserDashboard from "./pages/UserDashboard"
import OwnerDashboard from "./pages/OwnerDashboard"
import NotFound from "./pages/NotFound"

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/home"
        element={<Home />}
      />

      <Route
        path="/search"
        element={<Search />}
      />

      <Route
        path="/parking/:parkingId"
        element={<ParkingDetails />}
      />

      <Route
        path="/payment/:bookingId"
        element={<PaymentPage />}
      />

      <Route
        path="/dashboard"
        element={<UserDashboard />}
      />

      <Route
        path="/owner"
        element={<OwnerDashboard />}
      />

      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  )
}
