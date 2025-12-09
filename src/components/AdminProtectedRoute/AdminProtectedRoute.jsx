// src/components/ProtectedRoute/AdminProtectedRoute.jsx
import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { userContext } from '../../Context/userContext'

export default function AdminProtectedRoute({ children }) {
    const { userToken, isAdmin, loading } = useContext(userContext);

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/30 to-teal-50/30">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!userToken) {
        return <Navigate to="/login" replace />;
    }

    // Redirect to home if not admin
    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}