import React from "react";
import { Link } from "react-router-dom";
import { useGarage } from "../context/GarageContext";
import { STATUS } from "../services/CalculationEngine";
import {
  Plus,
  Gauge,
  Wrench,
  Clock,
  AlertTriangle,
  Users,
  ChevronRight,
  LogOut,
} from "lucide-react";

// ── Vehicle card for dashboard ──────────────────────────────
function VehicleCard({ vehicle }) {
  const mods = vehicle.maintenance_modules || [];
  const members = vehicle.members || [];
  const overdue = mods.filter((m) => m.status === STATUS.OVERDUE).length;
  const dueSoon = mods.filter((m) => m.status === STATUS.DUE_SOON).length;

  // Pick top-3 urgent maintenance items
  const urgentMods = mods
    .filter(
      (m) => m.status === STATUS.OVERDUE || m.status === STATUS.DUE_SOON
    )
    .slice(0, 3);

  const allUpcoming = mods
    .filter((m) => m.status === STATUS.UPCOMING)
    .slice(0, 3 - urgentMods.length);

  const displayMods = [...urgentMods, ...allUpcoming].slice(0, 3);

  return (
    <div className="garage-card" style={{ marginBottom: 16, padding: 0, overflow: "hidden" }}>
      {/* Vehicle header */}
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border-color)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h3 style={{ fontWeight: 800, fontSize: "1.05rem", margin: 0, color: "var(--text-primary)" }}>
                {vehicle.make} {vehicle.model}
              </h3>
              <span className="shared-badge">
                <Users size={11} /> Shared · {members.length} member{members.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              {vehicle.year} &bull; {vehicle.type}
            </div>
          </div>
          <Link
            to={`/vehicle/${vehicle.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              color: "var(--accent-color)",
              fontSize: "0.78rem",
              fontWeight: 600,
              gap: 2,
            }}
          >
            View <ChevronRight size={14} />
          </Link>
        </div>

        {/* Odometer */}
        <div className="odometer-display">
          <Gauge size={16} style={{ color: "var(--accent-color)", flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--text-primary)", lineHeight: 1 }}>
              {vehicle.current_odometer?.toLocaleString()} km
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 1 }}>
              Current Odometer
            </div>
          </div>
        </div>

        {/* Alert strip */}
        {(overdue > 0 || dueSoon > 0) && (
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 10,
              flexWrap: "wrap",
            }}
          >
            {overdue > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 8px",
                  borderRadius: 20,
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "var(--danger-color)",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                }}
              >
                <AlertTriangle size={11} /> {overdue} overdue
              </span>
            )}
            {dueSoon > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 8px",
                  borderRadius: 20,
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.2)",
                  color: "var(--warning-color)",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                }}
              >
                <Clock size={11} /> {dueSoon} due soon
              </span>
            )}
          </div>
        )}
      </div>

      {/* Next maintenance items */}
      {displayMods.length > 0 && (
        <div style={{ padding: "12px 16px 4px" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>
            Next Maintenance
          </div>
          {displayMods.map((mod) => {
            const isOver = mod.status === STATUS.OVERDUE;
            const isSoon = mod.status === STATUS.DUE_SOON;
            const color = isOver
              ? "var(--danger-color)"
              : isSoon
              ? "var(--warning-color)"
              : "var(--success-color)";
            const remaining =
              mod.remaining_km != null
                ? `${mod.remaining_km > 0 ? mod.remaining_km.toLocaleString() + " km remaining" : "Overdue by " + Math.abs(mod.remaining_km).toLocaleString() + " km"}`
                : mod.remaining_days != null
                ? `${mod.remaining_days > 0 ? mod.remaining_days + " days remaining" : Math.abs(mod.remaining_days) + " days overdue"}`
                : "";
            return (
              <div
                key={mod.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "7px 0",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Wrench size={13} style={{ color, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    {mod.name}
                  </span>
                </div>
                <span style={{ fontSize: "0.75rem", color, fontWeight: 600 }}>
                  {remaining}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, padding: "14px 16px" }}>
        <Link
          to={`/vehicle/${vehicle.id}`}
          className="btn-orange"
          style={{ flex: 1, justifyContent: "center", fontSize: "0.82rem", padding: "9px 12px" }}
          onClick={() => {
            // Trigger odometer modal on vehicle profile
            sessionStorage.setItem("openOdoModal", "1");
          }}
        >
          <Gauge size={14} /> Update Odometer
        </Link>
        <Link
          to={`/vehicle/${vehicle.id}/add-maintenance`}
          className="btn-ghost"
          style={{ flex: 1, justifyContent: "center", fontSize: "0.82rem", padding: "9px 12px" }}
        >
          <Plus size={14} /> Add Maintenance
        </Link>
      </div>

      {/* View History link */}
      <div style={{ padding: "0 16px 14px" }}>
        <Link
          to={`/odometer-history/${vehicle.id}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: "var(--text-secondary)",
            fontSize: "0.78rem",
            fontWeight: 500,
          }}
        >
          <Clock size={13} />
          View Odometer History
          <ChevronRight size={13} style={{ marginLeft: "auto" }} />
        </Link>
      </div>
    </div>
  );
}

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
            <VehicleCard key={v.id} vehicle={v} />
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
