import React, { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGarage } from "../context/GarageContext";
import { STATUS, getVehicleSummary, calculatePartLifePercent } from "../services/CalculationEngine";
import {
  Plus,
  Gauge,
  Wrench,
  Clock,
  AlertTriangle,
  Users,
  ChevronRight,
  Trash2,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Car
} from "lucide-react";
import "./SwipeableVehicleCard.css";

const STUCK_OFFSET = 180;
const SWIPE_THRESHOLD = 60;
const DELETE_BTN_LEFT = STUCK_OFFSET / 2;

export default function SwipeableVehicleCard({ vehicle, onOpenOdoModal }) {
  const { deleteVehicle, updateOdometer } = useGarage();
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isStuck, setIsStuck] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showQuickOdo, setShowQuickOdo] = useState(false);
  const [newOdoVal, setNewOdoVal] = useState(vehicle?.current_odometer || 0);
  const [savingOdo, setSavingOdo] = useState(false);

  // cursor-glow position (relative %)
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [glowVisible, setGlowVisible] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const maxDeltaX = useRef(0);
  const isHorizRef = useRef(false);
  const draggingRef = useRef(false);
  const wrapperRef = useRef(null);

  // ── Vehicle data & Calculation helpers ──────────────────────────
  const mods = vehicle.maintenance_modules || [];
  const members = vehicle.members || [];
  const summary = getVehicleSummary(vehicle);

  // Find next maintenance item
  const sortedMods = [...mods].sort((a, b) => {
    const lifeA = calculatePartLifePercent(a, vehicle.current_odometer);
    const lifeB = calculatePartLifePercent(b, vehicle.current_odometer);
    return lifeA - lifeB;
  });
  const nextMod = sortedMods[0];

  const closeCard = () => {
    setOffsetX(0);
    setIsStuck(false);
  };

  const handleMouseMove = useCallback((e) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGlowPos({ x, y });
  }, []);

  /* ---- MOUSE ---- */
  const onMouseDown = (e) => {
    if (e.target.closest("a") || e.target.closest("button") || e.target.closest("input") || e.target.closest(".vehicle-menu-dropdown")) return;
    if (isStuck) { closeCard(); return; }

    draggingRef.current = true;
    setIsDragging(true);
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    maxDeltaX.current = 0;
    isHorizRef.current = false;
  };

  const onMouseMove = (e) => {
    if (!draggingRef.current) return;
    const diffX = e.clientX - startXRef.current;
    const diffY = e.clientY - startYRef.current;

    if (!isHorizRef.current) {
      if (Math.abs(diffX) > 6 && Math.abs(diffX) > Math.abs(diffY)) isHorizRef.current = true;
      else if (Math.abs(diffY) > 6) { draggingRef.current = false; setIsDragging(false); return; }
    }
    if (!isHorizRef.current) return;

    maxDeltaX.current = Math.max(maxDeltaX.current, diffX);
    if (diffX > 0) {
      const clamped = diffX > STUCK_OFFSET ? STUCK_OFFSET + (diffX - STUCK_OFFSET) * 0.3 : diffX;
      setOffsetX(Math.min(clamped, 240));
    } else {
      setOffsetX(0);
    }
  };

  const onMouseUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);

    if (offsetX >= SWIPE_THRESHOLD) {
      setOffsetX(STUCK_OFFSET);
      setIsStuck(true);
    } else {
      closeCard();
    }
  };

  /* ---- TOUCH ---- */
  const onTouchStart = (e) => {
    if (e.target.closest("a") || e.target.closest("button") || e.target.closest("input") || e.target.closest(".vehicle-menu-dropdown")) return;
    if (isStuck) return;

    draggingRef.current = false;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    maxDeltaX.current = 0;
    isHorizRef.current = false;
  };

  const onTouchMove = (e) => {
    const diffX = e.touches[0].clientX - startXRef.current;
    const diffY = e.touches[0].clientY - startYRef.current;

    if (!isHorizRef.current) {
      if (Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        isHorizRef.current = true;
        draggingRef.current = true;
        setIsDragging(true);
      } else if (Math.abs(diffY) > 10) {
        return;
      } else {
        return;
      }
    }

    if (!draggingRef.current) return;
    if (e.cancelable) e.preventDefault();

    maxDeltaX.current = Math.max(maxDeltaX.current, diffX);

    if (isStuck) {
      if (diffX < 0) {
        const newOffset = Math.max(0, STUCK_OFFSET + diffX);
        setOffsetX(newOffset);
      }
    } else {
      if (diffX > 0) {
        const clamped = diffX > STUCK_OFFSET ? STUCK_OFFSET + (diffX - STUCK_OFFSET) * 0.3 : diffX;
        setOffsetX(Math.min(clamped, 240));
      }
    }
  };

  const onTouchEnd = () => {
    const wasDragging = draggingRef.current;
    draggingRef.current = false;
    setIsDragging(false);

    if (!wasDragging) return;

    if (isStuck) {
      if (offsetX < STUCK_OFFSET * 0.5) {
        closeCard();
      } else {
        setOffsetX(STUCK_OFFSET);
      }
    } else {
      if (offsetX >= SWIPE_THRESHOLD) {
        setOffsetX(STUCK_OFFSET);
        setIsStuck(true);
      } else {
        closeCard();
      }
    }
  };

  const onWheel = (e) => {
    if (Math.abs(e.deltaX) > 30) {
      if (e.deltaX < -30 && !isStuck) { setOffsetX(STUCK_OFFSET); setIsStuck(true); }
      else if (e.deltaX > 30 && isStuck) { closeCard(); }
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowModal(true);
    setShowMenu(false);
  };

  const confirmDelete = async () => {
    setShowModal(false);
    const wrapper = wrapperRef.current;
    if (wrapper) wrapper.style.maxHeight = wrapper.offsetHeight + "px";
    setIsDeleting(true);
    setTimeout(async () => {
      try {
        await deleteVehicle(vehicle.id);
      } catch (err) {
        console.error("[SwipeCard] delete failed:", err);
        if (wrapper) wrapper.style.maxHeight = "";
        setIsDeleting(false);
      }
    }, 420);
  };

  const handleQuickOdoSave = async (e) => {
    e.preventDefault();
    const val = parseInt(newOdoVal);
    if (!val || val <= vehicle.current_odometer) {
      alert("New odometer must be greater than current reading.");
      return;
    }
    setSavingOdo(true);
    try {
      await updateOdometer(vehicle.id, val);
      setShowQuickOdo(false);
    } catch (err) {
      alert(err.message || "Failed to update odometer.");
    } finally {
      setSavingOdo(false);
    }
  };

  return (
    <>
      <div
        ref={wrapperRef}
        className={`swipe-delete-wrapper ${isDeleting ? "deleting" : ""}`}
        onWheel={onWheel}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setGlowVisible(true)}
        onMouseLeave={() => setGlowVisible(false)}
        style={{ marginBottom: 18 }}
      >
        {/* Back Layer Delete */}
        <div className="swipe-delete-back">
          <div
            className="delete-center-module"
            style={{ position: "absolute", left: DELETE_BTN_LEFT - 26, top: "50%", transform: "translateY(-50%)" }}
            onClick={handleDeleteClick}
            role="button"
            tabIndex={0}
            title="Delete vehicle"
          >
            <div className="delete-logo-btn">
              <Trash2 size={22} />
            </div>
            <span className="delete-logo-label">Delete</span>
          </div>
        </div>

        {/* Front Layer Card */}
        <div
          className={`garage-card swipe-delete-front ${isDragging ? "dragging" : ""} ${isStuck ? "stuck" : ""}`}
          style={{
            transform: `translateX(${offsetX}px)`,
            marginBottom: 0,
            padding: '18px 18px 16px',
            overflow: "hidden",
            transition: isDragging ? "none" : "transform 0.32s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.25s ease",
            position: "relative",
            borderRadius: 22
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {glowVisible && !isStuck && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                pointerEvents: "none",
                zIndex: 1,
                background: `radial-gradient(circle 180px at ${glowPos.x}% ${glowPos.y}%, rgba(255,77,0,0.08) 0%, transparent 70%)`,
                transition: "background 0.05s linear",
              }}
            />
          )}

          {/* Top Section: Vehicle Image/Badge + Name & Year + 3-dots */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Photo or Car Icon */}
              {vehicle.photo_url || (vehicle.media && vehicle.media[0]?.url) ? (
                <img
                  src={vehicle.photo_url || vehicle.media[0]?.url}
                  alt={vehicle.model}
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 14,
                    objectFit: "cover",
                    border: "1px solid var(--border-color)",
                    flexShrink: 0
                  }}
                />
              ) : (
                <div style={{
                  width: 54,
                  height: 54,
                  borderRadius: 14,
                  background: 'rgba(249,115,22,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  flexShrink: 0
                }}>
                  🚗
                </div>
              )}

              <div>
                <h3 style={{ fontWeight: 800, fontSize: "1.1rem", margin: "0 0 2px", color: "var(--text-primary)" }}>
                  {vehicle.make} {vehicle.model}
                </h3>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 4 }}>
                  {vehicle.year} &bull; {vehicle.fuel_type || vehicle.type || 'Petrol'}
                </div>
                {members.length > 0 && (
                  <span className="shared-badge" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                    <Users size={11} /> Shared &bull; {members.length} Member{members.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* 3-dots Menu */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(s => !s);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 6,
                  borderRadius: 8
                }}
              >
                <MoreVertical size={18} />
              </button>

              {showMenu && (
                <div
                  className="vehicle-menu-dropdown"
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 32,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 12,
                    padding: "6px 0",
                    minWidth: 160,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                    zIndex: 20
                  }}
                >
                  <Link
                    to={`/vehicle/${vehicle.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 14px",
                      color: "var(--text-primary)",
                      fontSize: "0.82rem",
                      textDecoration: "none"
                    }}
                    onClick={() => setShowMenu(false)}
                  >
                    View Vehicle
                  </Link>
                  <Link
                    to={`/odometer-history/${vehicle.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 14px",
                      color: "var(--text-primary)",
                      fontSize: "0.82rem",
                      textDecoration: "none"
                    }}
                    onClick={() => setShowMenu(false)}
                  >
                    Odometer History
                  </Link>
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "8px 14px",
                      color: "var(--danger-color)",
                      fontSize: "0.82rem",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    <Trash2 size={13} /> Delete Vehicle
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Odometer Display Box with View / Update button */}
          <div
            style={{
              background: 'var(--bg-secondary, rgba(255,255,255,0.03))',
              borderRadius: 14,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Gauge size={20} style={{ color: 'var(--accent-color)' }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {vehicle.current_odometer?.toLocaleString()} km
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Current Odometer
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenOdoModal) onOpenOdoModal(vehicle);
                  else setShowQuickOdo(s => !s);
                }}
                style={{ fontSize: '0.76rem', padding: '5px 10px', borderRadius: 8 }}
              >
                Update
              </button>
              <Link
                to={`/vehicle/${vehicle.id}`}
                className="btn-secondary"
                style={{
                  fontSize: '0.76rem',
                  padding: '5px 10px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                View <ChevronRight size={12} />
              </Link>
            </div>
          </div>

          {/* Quick inline odo form */}
          {showQuickOdo && (
            <form onSubmit={handleQuickOdoSave} style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
              <input
                type="number"
                className="form-control"
                style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                placeholder={`> ${vehicle.current_odometer} km`}
                value={newOdoVal}
                onChange={e => setNewOdoVal(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={savingOdo}
                className="btn-orange"
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              >
                {savingOdo ? 'Saving…' : 'Save'}
              </button>
            </form>
          )}

          {/* Option 3 Human Language Status Banner */}
          <div
            style={{
              background: summary.type === 'overdue'
                ? 'rgba(239,68,68,0.08)'
                : summary.type === 'due_soon'
                  ? 'rgba(245,158,11,0.08)'
                  : 'rgba(16,185,129,0.08)',
              border: summary.type === 'overdue'
                ? '1px solid rgba(239,68,68,0.2)'
                : summary.type === 'due_soon'
                  ? '1px solid rgba(245,158,11,0.2)'
                  : '1px solid rgba(16,185,129,0.2)',
              borderRadius: 12,
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.8rem',
              lineHeight: 1.4,
              marginBottom: 12
            }}
          >
            {summary.type === 'overdue' ? (
              <AlertTriangle size={16} style={{ color: 'var(--danger-color)', flexShrink: 0 }} />
            ) : summary.type === 'due_soon' ? (
              <AlertCircle size={16} style={{ color: 'var(--warning-color)', flexShrink: 0 }} />
            ) : (
              <CheckCircle2 size={16} style={{ color: 'var(--success-color)', flexShrink: 0 }} />
            )}
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              {summary.text}
            </span>
          </div>

          {/* Minimal Next Maintenance item if exists */}
          {nextMod && (
            <div
              style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wrench size={14} style={{ color: 'var(--accent-color)' }} />
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                    {nextMod.name}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                    {nextMod.remaining_km !== null ? `${nextMod.remaining_km.toLocaleString()} km remaining` : ''}
                  </span>
                </div>
              </div>
              <Link
                to={`/vehicle/${vehicle.id}`}
                style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'none' }}
              >
                View all &gt;
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)} style={{ zIndex: 1200 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Vehicle</h3>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.5, margin: "0 0 20px" }}>
              Are you sure you want to delete <strong>{vehicle.make} {vehicle.model}</strong>? This will remove all maintenance records and history.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="btn-danger"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={confirmDelete}
              >
                Yes, Delete
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
