import React from "react";
import { Link } from "react-router-dom";
import { useGarage } from "../context/GarageContext";
import SwipeableVehicleCard from "../components/SwipeableVehicleCard";
import {
  Plus,
  LogOut,
} from "lucide-react";

// ── Coming Soon chip ────────────────────────────────────────
function ComingSoonChip({ label, icon }) {
  return (
    <div className="coming-soon-chip">
      <span className="coming-soon-icon">{icon}</span>
      <div>
        <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--text-primary)" }}>
          {label}
        </div>
        <div className="coming-soon-label">Coming Soon</div>
      </div>
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────
export default function GarageDashboard() {
  const { vehicles, user, currentUser, loading, logout } = useGarage();

  const sharedVehiclesCount = (vehicles || []).filter(
    (v) => v.user_id && currentUser?.id && v.user_id !== currentUser.id
  ).length;

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
        }}
      >
        <div className="spinner" />
      </div>
    );

  return (
    <div className="app-container" style={{ paddingTop: 0 }}>
      {/* ── Top bar ─────────────────────────────── */}
      <div className="top-bar">
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "0.68rem",
              color: "var(--text-muted)",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 2,
            }}
          >
            My Garage
          </div>
          <h1
            style={{
              fontSize: "1.3rem",
              fontWeight: 800,
              margin: 0,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            {user?.name ? `Hey, ${user.name.split(" ")[0]} 👋` : "NGINEBREAK"}
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="avatar">{user?.name?.[0]?.toUpperCase() || "G"}</div>
          <button
            title="Sign out"
            onClick={logout}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>

      {/* ── Empty state ─────────────────────────── */}
      {vehicles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚗</div>
          <h5>Your garage is empty</h5>
          <p>Add your first vehicle and invite your co-owners to start tracking maintenance together.</p>
          <Link to="/add-vehicle" className="btn-orange">
            <Plus size={16} /> Add Vehicle
          </Link>
        </div>
      ) : (
        <>
          {/* ── Co-owner Notification Banner ── */}
          {sharedVehiclesCount > 0 && (
            <div
              style={{
                background: "rgba(249, 115, 22, 0.08)",
                border: "1px solid rgba(249, 115, 22, 0.25)",
                borderRadius: 12,
                padding: "10px 14px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>📩</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Shared Co-Owner Access Active
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  You have access to {sharedVehiclesCount} shared vehicle{sharedVehiclesCount > 1 ? "s" : ""}. Track maintenance & odometer updates in sync!
                </div>
              </div>
            </div>
          )}

          {/* ── Vehicles ──────────────────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <h2 style={{ fontSize: "0.9rem", fontWeight: 700, margin: 0, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Shared Garage
            </h2>
            <Link
              to="/add-vehicle"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: "var(--accent-color)",
                fontSize: "0.78rem",
                fontWeight: 600,
              }}
            >
              <Plus size={14} /> Add Vehicle
            </Link>
          </div>

          {vehicles.map((v) => (
            <SwipeableVehicleCard key={v.id} vehicle={v} />
          ))}
        </>
      )}

      {/* ── Coming Soon features ──────────────── */}
      <div style={{ marginTop: 32, marginBottom: 8 }}>
        <div
          style={{
            fontSize: "0.65rem",
            color: "var(--text-muted)",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          More Features
        </div>
        <div className="coming-soon-grid">
          <ComingSoonChip label="Community" icon="🏁" />
          <ComingSoonChip label="Virtual Garage" icon="🏠" />
          <ComingSoonChip label="Builds" icon="🔩" />
          <ComingSoonChip label="Discover" icon="🔍" />
        </div>
      </div>
    </div>
  );
}
