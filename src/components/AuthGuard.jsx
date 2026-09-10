import React from "react";
import { Navigate } from "react-router-dom";
import { useGarage } from "../context/GarageContext";

/**
 * AuthGuard — wraps protected routes.
 * Shows a loading screen while the session is being resolved,
 * then redirects to /login if no user is authenticated.
 */
export default function AuthGuard({ children }) {
  const { currentUser, authLoading } = useGarage();

  if (authLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "var(--bg-page)",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid var(--border-color)",
            borderTop: "3px solid var(--accent-color)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", fontWeight: 500 }}>
          Loading NGINEBREAK…
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
