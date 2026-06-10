import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Typography } from 'antd';
import { useAuth, isAdmin } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import BookVehicle from './pages/BookVehicle';
import MyBookings from './pages/MyBookings';
import AdminBookings from './pages/AdminBookings';

const { Header, Content } = Layout;

function Shell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  if (!user) return children;

  const items = isAdmin(user.role)
    ? [{ key: '/admin', label: 'Manage Bookings' }, { key: '/book', label: 'Book' }, { key: '/my-bookings', label: 'My Bookings' }]
    : [{ key: '/book', label: 'Book a Vehicle' }, { key: '/my-bookings', label: 'My Bookings' }];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Typography.Text style={{ color: '#fff', fontWeight: 600 }}>🚗 Car Booking</Typography.Text>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={(e) => navigate(e.key)}
          style={{ flex: 1, minWidth: 0 }}
        />
        <Typography.Text style={{ color: '#fff' }}>
          {user.name} ({user.role})
        </Typography.Text>
        <Button size="small" onClick={() => { logout(); navigate('/login'); }}>Logout</Button>
      </Header>
      <Content style={{ padding: 24, maxWidth: 1100, margin: '0 auto', width: '100%' }}>{children}</Content>
    </Layout>
  );
}

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin(user.role) ? '/admin' : '/book'} replace />;
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/book" element={<ProtectedRoute><BookVehicle /></ProtectedRoute>} />
        <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route
          path="/admin"
          element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminBookings /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
