import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import MyCourses from './pages/MyCourses';
import MyLearning from './pages/MyLearning';
import Analytics from './pages/Analytics';
import './App.css';

function Nav() {
  const { user, logout, loading } = useAuth();

  if (loading) return null;

  return (
    <nav className="nav">
        <Link to="/courses" className="brand">
        <img src="/javlearn-icon.png" alt="" className="brand-icon" />
        Javlearn
      </Link>
      <div className="nav-links">
        <Link to="/courses">Browse</Link>
        {user && <Link to="/my-learning">My Learning</Link>}
               {user && (user.role === 'instructor' || user.role === 'admin') && (
          <>
            <Link to="/my-courses">My Courses</Link>
            <Link to="/analytics">Analytics</Link>
          </>
        )}
        {user ? (
          <>
            <span className="nav-user">
              {user.name} ({user.role})
            </span>
            <button onClick={logout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/signup">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

// Redirects to login if there's no logged-in user yet (after the initial
// token check has finished).
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Nav />
      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/courses" replace />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
                    <Route
            path="/my-courses"
            element={
              <RequireAuth>
                <MyCourses />
              </RequireAuth>
            }
          />
                    <Route
            path="/my-learning"
            element={
              <RequireAuth>
                <MyLearning />
              </RequireAuth>
            }
          />
          <Route
            path="/analytics"
            element={
              <RequireAuth>
                <Analytics />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
