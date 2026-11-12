import { HashRouter, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { isConfigured } from './lib/supabase';
import Home from './pages/Home';
import ArticlePage from './pages/ArticlePage';
import { CategoryPage, SearchPage, VideosPage } from './pages/ListPages';
import { AboutPage, ContactPage, NotFound, PrivacyPage } from './pages/InfoPages';
import Login from './pages/Login';
import StaffDashboard from './pages/staff/StaffDashboard';
import ArticleEditor from './pages/staff/ArticleEditor';
import { AdminDashboard, AllArticles, CategoriesManager, MessagesPage, ReviewQueue, TeamManager } from './pages/admin/AdminPages';

function PublicLayout() {
  return (
    <>
      {!isConfigured && (
        <div className="bg-yellow-300 py-1 text-center text-xs font-semibold text-ink">
          DEMO MODE – Supabase keys अभी नहीं लगी हैं (README देखें)
        </div>
      )}
      <Header />
      <main className="min-h-[60vh]"><Outlet /></main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      {/* HashRouter: GitHub Pages par refresh karne par 404 nahi aata */}
      <HashRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/news/:slug" element={<ArticlePage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Staff (reporter) + Admin */}
          <Route path="/staff" element={<ProtectedRoute roles={['staff', 'admin']}><StaffDashboard /></ProtectedRoute>} />
          <Route path="/staff/new" element={<ProtectedRoute roles={['staff', 'admin']}><ArticleEditor /></ProtectedRoute>} />
          <Route path="/staff/edit/:id" element={<ProtectedRoute roles={['staff', 'admin']}><ArticleEditor /></ProtectedRoute>} />

          {/* Sirf Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/review" element={<ProtectedRoute roles={['admin']}><ReviewQueue /></ProtectedRoute>} />
          <Route path="/admin/articles" element={<ProtectedRoute roles={['admin']}><AllArticles /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute roles={['admin']}><CategoriesManager /></ProtectedRoute>} />
          <Route path="/admin/team" element={<ProtectedRoute roles={['admin']}><TeamManager /></ProtectedRoute>} />
          <Route path="/admin/messages" element={<ProtectedRoute roles={['admin']}><MessagesPage /></ProtectedRoute>} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
