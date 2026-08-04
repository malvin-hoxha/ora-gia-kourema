import { Navigate, Route, Routes,} from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { BookingPage } from "./pages/BookingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { StaffRoute } from "./auth/StaffRoute";
import { StaffDashboardPage } from "./pages/StaffDashboardPage";
import { AdminRoute } from "./auth/AdminRoute";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { PaymentSuccessPage, } from "./pages/PaymentSuccessPage";
import { PaymentCancelledPage, } from "./pages/PaymentCancelledPage";


const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/login"
        element={<LoginPage />}
      />
      <Route
        path="/register"
        element={<RegisterPage />}
      />

      <Route
        path="/booking"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER"]}>
            <BookingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/booking/payment-success"
        element={
          <ProtectedRoute
            allowedRoles={["CUSTOMER"]}
          >
            <PaymentSuccessPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/booking/payment-cancelled"
        element={
          <ProtectedRoute
            allowedRoles={["CUSTOMER"]}
          >
            <PaymentCancelledPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff"
        element={
          <StaffRoute>
            <StaffDashboardPage />
          </StaffRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  )
}

export default App