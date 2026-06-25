import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth, isAdmin, isDriver } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import EmployeeLayout from './layouts/EmployeeLayout';
import DriverLayout from './layouts/DriverLayout';
import AdminLayout from './layouts/AdminLayout';
import DriverTrips from './pages/DriverTrips';
import Login from './pages/Login';
import BookVehicle from './pages/BookVehicle';
import MyBookings from './pages/MyBookings';
import AdminBookings from './pages/AdminBookings';
import AdminFeedback from './pages/AdminFeedback';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import AdminUsers from './pages/AdminUsers';
import AdminDashboard from './pages/AdminDashboard';
import AdminCalendar from './pages/AdminCalendar';
import AdminVehicles from './pages/AdminVehicles';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';
import AdminDeveloper from './pages/AdminDeveloper';
import ComingSoon from './pages/ComingSoon';

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (isAdmin(user.role)) return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'driver') return <Navigate to="/driver" replace />;
  return <Navigate to="/book" replace />;
}

// Pick the shell by role; the login page renders shell-less.
function Shell({ children }) {
  const { user } = useAuth();
  if (!user) return children;
  if (isAdmin(user.role)) return <AdminLayout>{children}</AdminLayout>;
  if (isDriver(user.role)) return <DriverLayout>{children}</DriverLayout>;
  return <EmployeeLayout>{children}</EmployeeLayout>;
}

const admin = (el) => <ProtectedRoute roles={['admin']}>{el}</ProtectedRoute>;
const auth = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

export default function App() {
  const { loading } = useAuth();
  // While the boot /me request is in flight, hold routing so we don't flash the
  // login page (or a wrong-role view) before the server confirms who this is.
  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  return (
    <Shell>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />

        {/* Employee */}
        <Route path="/book" element={auth(<BookVehicle />)} />
        <Route path="/my-bookings" element={auth(<MyBookings />)} />
        <Route path="/notifications" element={auth(<Notifications />)} />
        <Route path="/profile" element={auth(<Profile />)} />

        {/* Driver */}
        <Route path="/driver" element={auth(<DriverTrips />)} />


        {/* Admin */}
        <Route path="/admin" element={admin(<AdminBookings />)} />
        <Route path="/admin/feedback" element={admin(<AdminFeedback />)} />
        <Route path="/admin/dashboard" element={admin(<AdminDashboard />)} />
        <Route path="/admin/calendar" element={admin(<AdminCalendar />)} />
        <Route path="/admin/vehicles" element={admin(<AdminVehicles />)} />
        <Route path="/admin/users" element={admin(<AdminUsers />)} />
        <Route path="/admin/reports" element={admin(<AdminReports />)} />
        <Route path="/admin/settings" element={admin(<AdminSettings />)} />
        <Route path="/admin/developer" element={admin(<AdminDeveloper />)} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
