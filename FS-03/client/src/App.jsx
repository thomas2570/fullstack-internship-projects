import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from './features/authSlice';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';

// Pages
import { HomePage } from './pages/HomePage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { LearnPage } from './pages/LearnPage';
import { LiveSessionsPage } from './pages/LiveSessionsPage';
import { LiveRoomPage } from './pages/LiveRoomPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { InstructorDashboardPage } from './pages/InstructorDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { VerifyCertificatePage } from './pages/VerifyCertificatePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AboutPage } from './pages/AboutPage';
import { SupportPage } from './pages/SupportPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { TeachPage } from './pages/TeachPage';

// Protected Route wrappers
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useSelector((state) => state.auth);

  if (!token && !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const App = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const location = useLocation();

  useEffect(() => {
    if (token) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, token]);

  // Hide large footer on auth screens, video learning player, and live classroom rooms
  const hideFooter =
    location.pathname === '/login' ||
    location.pathname.startsWith('/register') ||
    location.pathname.endsWith('/learn') ||
    (location.pathname.startsWith('/live/') && location.pathname !== '/live');

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:slug" element={<CourseDetailPage />} />
          <Route
            path="/courses/:slug/learn"
            element={
              <ProtectedRoute>
                <LearnPage />
              </ProtectedRoute>
            }
          />
          <Route path="/live" element={<LiveSessionsPage />} />
          <Route path="/live/:roomId" element={<LiveRoomPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <StudentDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/instructor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <InstructorDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/verify-certificate" element={<VerifyCertificatePage />} />
          <Route path="/verify-certificate/:certificateId" element={<VerifyCertificatePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/contact" element={<SupportPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/teach" element={<TeachPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/student" element={<RegisterPage />} />
          <Route path="/register/instructor" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

