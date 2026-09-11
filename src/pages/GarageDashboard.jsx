import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useGarage } from "../context/GarageContext";
import SwipeableVehicleCard from "../components/SwipeableVehicleCard";
import {
  isUserAdmin,
  isRealAdmin,
  getAdminViewMode,
  setAdminViewMode,
  getAdminSettings,
  saveAdminSettings,
} from "../utils/adminAuth";
import { isSupabaseConfigured } from "../services/supabaseClient";
import {
  Plus,
  LogOut,
  Shield,
  Zap,
  Download,
  Sliders,
  Database,
  CheckCircle2,
  AlertCircle,
  Eye,
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

  const [isRealAdminUser, setIsRealAdminUser] = useState(() => isRealAdmin(currentUser));
  const [isAdmin, setIsAdmin] = useState(() => isUserAdmin(currentUser));
  const [adminViewMode, setAdminViewModeState] = useState(() => getAdminViewMode());
  const [adminSettings, setAdminSettings] = useState(() => getAdminSettings());
  const [backupExported, setBackupExported] = useState(false);

  useEffect(() => {
    setIsRealAdminUser(isRealAdmin(currentUser));
    setIsAdmin(isUserAdmin(currentUser));
    setAdminViewModeState(getAdminViewMode());

    const handleSync = () => {
      setIsRealAdminUser(isRealAdmin(currentUser));
      setIsAdmin(isUserAdmin(currentUser));
      setAdminViewModeState(getAdminViewMode());
      setAdminSettings(getAdminSettings());
    };
    window.addEventListener("admin_state_changed", handleSync);
    window.addEventListener("admin_settings_changed", handleSync);
    return () => {
      window.removeEventListener("admin_state_changed", handleSync);
      window.removeEventListener("admin_settings_changed", handleSync);
    };
  }, [currentUser]);

  const sharedVehiclesCount = (vehicles || []).filter(
    (v) => v.user_id && currentUser?.id && v.user_id !== currentUser.id
  ).length;

  const toggleImageSaver = () => {
    const next = adminSettings.imageOptimizationMode === "saver" ? "standard" : "saver";
    const updated = saveAdminSettings({ imageOptimizationMode: next });
    setAdminSettings(updated);
  };

  const handleExportBackup = () => {
    const payload = {
      project: "Nginebreak Garage Fleet Backup",
      exported_at: new Date().toISOString(),
      fleet_count: vehicles.length,
      vehicles,
      admin_settings: adminSettings,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nginebreak_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setBackupExported(true);
    setTimeout(() => setBackupExported(false), 3000);
  };

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

  const isSaver = adminSettings.imageOptimizationMode === "saver";

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
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>My Garage</span>
            {isAdmin && (
              <span
                style={{
                  fontSize: "0.62rem",
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: "rgba(249,115,22,0.15)",
                  color: "var(--accent-color)",
                  fontWeight: 700,
                }}
              >
                ADMIN
              </span>
            )}
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
          <div
            className="avatar"
            style={{
              overflow: "hidden",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1.5px solid var(--border-color)",
            }}
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name || "Profile"}
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
              />
            ) : (
              isAdmin ? "A" : (user?.name?.[0]?.toUpperCase() || "G")
            )}
          </div>
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

      {/* ── ADMIN SINGLE-CLICK SWITCH BUTTON (When in User View) ── */}
      {isRealAdminUser && adminViewMode === "user" && (
        <div
          style={{
            background: "rgba(249, 115, 22, 0.08)",
            border: "1px solid rgba(249, 115, 22, 0.3)",
            borderRadius: 12,
            padding: "10px 14px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>
              👁️ Viewing as Standard User
            </span>
          </div>
          <button
            onClick={() => setAdminViewMode("admin")}
            style={{
              background: "var(--accent-color)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 2px 8px rgba(249,115,22,0.3)",
            }}
          >
            <Shield size={14} /> Switch to Admin View
          </button>
        </div>
      )}

      {/* ── ADMIN COMMAND CENTER (Visible only in Admin View) ── */}
      {isAdmin && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(245,158,11,0.04) 100%)",
            border: "1px solid rgba(249,115,22,0.3)",
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 16,
          }}
        >
          {/* Header with SINGLE-CLICK SWITCH BUTTON */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Shield size={16} color="var(--accent-color)" />
              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "0.02em" }}>
                Admin Command Center
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Single Button to Switch to User View with 1-click */}
              <button
                onClick={() => setAdminViewMode("user")}
                style={{
                  background: "#0F172A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                title="Switch immediately to user view"
              >
                <Eye size={13} /> Switch to User View
              </button>
              <Link
                to="/profile"
                style={{
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  color: "var(--accent-color)",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "5px 8px",
                  borderRadius: 6,
                  background: "rgba(249,115,22,0.1)",
                }}
              >
                <Sliders size={12} /> Settings
              </Link>
            </div>
          </div>

          {/* Quick Metrics — Responsive Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(95px, 1fr))",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                background: "var(--bg-card)",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid var(--border-color)",
              }}
            >
              <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Fleet Count
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>
                {vehicles.length} Vehicles
              </div>
            </div>

            <div
              style={{
                background: "var(--bg-card)",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid var(--border-color)",
              }}
            >
              <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Supabase Sync
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: isSupabaseConfigured() ? "var(--success-color)" : "var(--accent-color)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {isSupabaseConfigured() ? "Connected" : "Local Mode"}
              </div>
            </div>

            <div
              style={{
                background: "var(--bg-card)",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid var(--border-color)",
              }}
            >
              <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Storage Mode
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: isSaver ? "var(--accent-color)" : "var(--text-secondary)",
                }}
              >
                {isSaver ? "1MP Saver" : "1920px HD"}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={toggleImageSaver}
              style={{
                flex: 1,
                minWidth: "140px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "7px 10px",
                borderRadius: 8,
                background: isSaver ? "rgba(249,115,22,0.15)" : "var(--bg-page)",
                border: isSaver ? "1px solid var(--accent-color)" : "1px solid var(--border-color)",
                color: isSaver ? "var(--accent-color)" : "var(--text-secondary)",
                fontSize: "0.74rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Zap size={13} />
              {isSaver ? "1MP Saver Active (~60KB)" : "Switch to 1MP Saver"}
            </button>

            <button
              onClick={handleExportBackup}
              style={{
                flex: 1,
                minWidth: "140px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "7px 10px",
                borderRadius: 8,
                background: "var(--bg-page)",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
                fontSize: "0.74rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Download size={13} />
              {backupExported ? "Backup Exported!" : "Export Fleet JSON"}
            </button>
          </div>
        </div>
      )}

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
