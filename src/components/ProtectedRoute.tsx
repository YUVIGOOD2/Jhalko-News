import type { ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../lib/types';
import Spinner from './Spinner';

export default function ProtectedRoute({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { session, profile, loading, signOut } = useAuth();

  if (loading) return <Spinner full />;
  if (!session) return <Navigate to="/login" replace />;

  if (!profile || !profile.is_active || !roles.includes(profile.role)) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="text-5xl">🔒</div>
        <h1 className="mt-4 text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-gray-600">
          Aapke account ko is panel ki permission nahi hai. Admin se sampark karein.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="btn-outline">Home</Link>
          <button onClick={() => void signOut()} className="btn-primary">Logout</button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
