import { Routes, Route, useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import SEO from "./components/common/SEO";
import useScrollReveal from "./hooks/useScrollReveal";

import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Skills from "./pages/public/Skills";
import Projects from "./pages/public/Projects";
import Certificates from "./pages/public/Certificates";
import Contact from "./pages/public/Contact";
import System from "./pages/public/System";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";

import ProtectedRoute from "./components/protected/ProtectedRoute";

function NotFound() {
  return (
    <section className="page page-section notfound grid-acid">
      <SEO
        title="Page Not Found (404) | Mayuresh Kasar"
        description="The page you are looking for does not exist. Head back to the portfolio home page."
        path="/404"
        noIndex
      />

      <div className="section__inner">
        <div className="reveal">
          <p className="meta text-ink">Error / Route not found</p>
          <h1 className="display notfound__code">404</h1>
          <h2 className="display notfound__title">Lost in the grid.</h2>
          <p className="notfound__text">
            The page you are looking for doesn&apos;t exist or may have been
            moved. Let&apos;s get you back to the work.
          </p>
          <Link to="/" className="btn btn--black btn--pill">
            <ArrowLeft size={16} />
            Back home
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  useScrollReveal();

  // Start every route at the top instantly. Smooth-scrolling between
  // routes makes the new page appear to drift into place, and can leave
  // the visitor halfway down a page they have never seen.
  useEffect(() => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;

    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previousBehavior;
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      {!isAdminRoute && <Navbar />}

      <main className="site-main" id="main-content" tabIndex={-1}>
        <div key={location.pathname} className="route-enter">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/system" element={<System />} />
            <Route path="/contact" element={<Contact />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLogin />} />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>

      {!isAdminRoute && <Footer />}
    </div>
  );
}
