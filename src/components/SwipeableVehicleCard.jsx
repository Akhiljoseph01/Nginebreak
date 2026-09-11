import React, { useState, useRef, useCallback } from "react";
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
  Trash2,
  RotateCcw,
} from "lucide-react";
import "./SwipeableVehicleCard.css";

// How far right the card slides and latches
const STUCK_OFFSET = 200;
// Min horizontal drag distance before we enter swipe mode
const SWIPE_THRESHOLD = 60;
// Back-layer delete button is centred in the exposed strip (STUCK_OFFSET wide)
const DELETE_BTN_LEFT = STUCK_OFFSET / 2; // 100px from left edge

export default function SwipeableVehicleCard({ vehicle }) {
  const { deleteVehicle } = useGarage();

  // ── State ──────────────────────────────────────────────────────
  const [offsetX, setOffsetX]           = useState(0);
  const [isDragging, setIsDragging]     = useState(false);
  const [isStuck, setIsStuck]           = useState(false);
  const [isDeleting, setIsDeleting]     = useState(false);
  const [showModal, setShowModal]       = useState(false);
  // cursor-glow position (relative %)
  const [glowPos, setGlowPos]           = useState({ x: 50, y: 50 });
  const [glowVisible, setGlowVisible]   = useState(false);

  // ── Refs ───────────────────────────────────────────────────────
  const startXRef       = useRef(0);
  const startYRef       = useRef(0);
  const maxDeltaX       = useRef(0);   // track max horizontal movement per gesture
  const isHorizRef      = useRef(false);
  const draggingRef     = useRef(false); // sync ref (avoid stale closure in move)
  const wrapperRef      = useRef(null);

  // ── Vehicle data ───────────────────────────────────────────────
  const mods      = vehicle.maintenance_modules || [];
  const members   = vehicle.members || [];
  const overdue   = mods.filter(m => m.status === STATUS.OVERDUE).length;
  const dueSoon   = mods.filter(m => m.status === STATUS.DUE_SOON).length;

  const urgentMods   = mods.filter(m => m.status === STATUS.OVERDUE || m.status === STATUS.DUE_SOON).slice(0, 3);
  const allUpcoming  = mods.filter(m => m.status === STATUS.UPCOMING).slice(0, 3 - urgentMods.length);
  const displayMods  = [...urgentMods, ...allUpcoming].slice(0, 3);

  // ── Helpers ────────────────────────────────────────────────────
  const closeCard = () => {
    setOffsetX(0);
    setIsStuck(false);
  };

  // ── Cursor glow (desktop mouse) ────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGlowPos({ x, y });
  }, []);

  // ── Touch / pointer drag handlers ─────────────────────────────
  // We use separate mouse and touch handlers so they don't collide.

  /* ---- MOUSE ---- */
  const onMouseDown = (e) => {
    if (e.target.closest("a") || e.target.closest("button") || e.target.closest("input")) return;
    if (isStuck) { closeCard(); return; }

    draggingRef.current = true;
    setIsDragging(true);
    startXRef.current  = e.clientX;
    startYRef.current  = e.clientY;
    maxDeltaX.current  = 0;
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
      setOffsetX(Math.min(clamped, 260));
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
  const touchStartTime = useRef(0);

  const onTouchStart = (e) => {
    if (e.target.closest("a") || e.target.closest("button") || e.target.closest("input")) return;

    // If already stuck: first touch ONLY focuses (records start pos), second swipe-back closes
    if (isStuck) return; // let user swipe back themselves to close

    touchStartTime.current = Date.now();
    draggingRef.current = false; // don't start dragging immediately
    startXRef.current  = e.touches[0].clientX;
    startYRef.current  = e.touches[0].clientY;
    maxDeltaX.current  = 0;
    isHorizRef.current = false;
  };

  const onTouchMove = (e) => {
    const diffX = e.touches[0].clientX - startXRef.current;
    const diffY = e.touches[0].clientY - startYRef.current;

    // Determine gesture direction if not yet decided
    if (!isHorizRef.current) {
      if (Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        isHorizRef.current = true;
        draggingRef.current = true;
        setIsDragging(true);
      } else if (Math.abs(diffY) > 10) {
        // Vertical scroll intent — bail
        return;
      } else {
        return; // not decided yet, wait
      }
    }

    if (!draggingRef.current) return;
    if (e.cancelable) e.preventDefault();

    maxDeltaX.current = Math.max(maxDeltaX.current, diffX);

    if (isStuck) {
      // When stuck, only allow sliding BACK (left) to close
      if (diffX < 0) {
        const newOffset = Math.max(0, STUCK_OFFSET + diffX);
        setOffsetX(newOffset);
      }
    } else {
      // Not stuck: only allow sliding RIGHT to open
      if (diffX > 0) {
        const clamped = diffX > STUCK_OFFSET ? STUCK_OFFSET + (diffX - STUCK_OFFSET) * 0.3 : diffX;
        setOffsetX(Math.min(clamped, 260));
      }
    }
  };

  const onTouchEnd = (e) => {
    const wasDragging = draggingRef.current;
    draggingRef.current = false;
    setIsDragging(false);

    // Pure tap detection: if no meaningful drag happened, ignore (mobile first-tap behaviour)
    if (!wasDragging) return;

    if (isStuck) {
      // Was sliding back: if released past mid-point, close; otherwise re-latch
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

  // ── Horizontal trackpad wheel ──────────────────────────────────
  const onWheel = (e) => {
    if (Math.abs(e.deltaX) > 30) {
      if (e.deltaX < -30 && !isStuck) { setOffsetX(STUCK_OFFSET); setIsStuck(true); }
      else if (e.deltaX > 30 && isStuck) { closeCard(); }
    }
  };

  // ── Delete flow ────────────────────────────────────────────────
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowModal(true);
  };

  const confirmDelete = async () => {
    setShowModal(false);
    // Record current height for collapse animation
    const wrapper = wrapperRef.current;
    if (wrapper) wrapper.style.maxHeight = wrapper.offsetHeight + "px";
    setIsDeleting(true);
    // After CSS transition (400ms), actually remove from store
    setTimeout(async () => {
      try {
        await deleteVehicle(vehicle.id);
      } catch (err) {
        console.error("[SwipeCard] delete failed:", err);
        // Roll back
        if (wrapper) wrapper.style.maxHeight = "";
        setIsDeleting(false);
      }
    }, 420);
  };

  // ── Trash button in card header (tap-to-toggle on mobile) ─────
  const handleTrashBtn = (e) => {
    e.stopPropagation();
    if (isStuck) {
      closeCard();
    } else {
      setOffsetX(STUCK_OFFSET);
      setIsStuck(true);
    }
  };

  return (
    <>
      {/* ── WRAPPER ─────────────────────────────────────────────── */}
      <div
        ref={wrapperRef}
        className={`swipe-delete-wrapper ${isDeleting ? "deleting" : ""}`}
        onWheel={onWheel}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setGlowVisible(true)}
        onMouseLeave={() => setGlowVisible(false)}
      >

        {/* ── BACK LAYER ─────────────────────────────────────────── */}
        {/* Delete button anchored to the LEFT of the back, in the exposed strip */}
        <div className="swipe-delete-back">
          {/* Exposed-zone delete button — horizontally centred within the revealed strip */}
          <div
            className="delete-center-module"
            style={{ position: "absolute", left: DELETE_BTN_LEFT - 26, top: "50%", transform: "translateY(-50%)" }}
            onClick={handleDeleteClick}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === "Enter" && handleDeleteClick(e)}
            title="Delete vehicle"
          >
            <div className="delete-logo-btn">
              <Trash2 size={22} />
            </div>
            <span className="delete-logo-label">Delete</span>
          </div>
        </div>

        {/* ── FRONT LAYER ─────────────────────────────────────────── */}
        <div
          className={`garage-card swipe-delete-front ${isDragging ? "dragging" : ""} ${isStuck ? "stuck" : ""}`}
          style={{
            transform:  `translateX(${offsetX}px)`,
            marginBottom: 0,
            padding:    0,
            overflow:   "hidden",
            transition: isDragging ? "none" : "transform 0.32s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.25s ease",
            position:   "relative",
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Cursor-following orange glow overlay (desktop only) */}
          {glowVisible && !isStuck && (
            <div
              aria-hidden="true"
              style={{
                position:       "absolute",
                inset:          0,
                borderRadius:   "inherit",
                pointerEvents:  "none",
                zIndex:         3,
                background:     `radial-gradient(circle 180px at ${glowPos.x}% ${glowPos.y}%, rgba(255,77,0,0.09) 0%, transparent 70%)`,
                transition:     "background 0.05s linear",
              }}
            />
          )}

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

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Trash toggle button — tap once to open delete mode */}
                <button
                  type="button"
                  title={isStuck ? "Close delete mode" : "Reveal delete"}
                  onClick={handleTrashBtn}
                  style={{
                    background:   isStuck ? "rgba(239,68,68,0.12)" : "var(--bg-input)",
                    border:       isStuck ? "1px solid rgba(239,68,68,0.3)" : "1px solid var(--border-color)",
                    color:        isStuck ? "var(--danger-color)" : "var(--text-muted)",
                    borderRadius: 8,
                    padding:      "5px 7px",
                    cursor:       "pointer",
                    display:      "flex",
                    alignItems:   "center",
                    transition:   "all 0.18s ease",
                  }}
                >
                  <Trash2 size={13} />
                </button>

                <Link
                  to={`/vehicle/${vehicle.id}`}
                  style={{ display: "flex", alignItems: "center", color: "var(--accent-color)", fontSize: "0.78rem", fontWeight: 600, gap: 2 }}
                >
                  View <ChevronRight size={14} />
                </Link>
              </div>
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
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {overdue > 0 && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 20, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger-color)", fontSize: "0.72rem", fontWeight: 600 }}>
                    <AlertTriangle size={11} /> {overdue} overdue
                  </span>
                )}
                {dueSoon > 0 && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 20, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "var(--warning-color)", fontSize: "0.72rem", fontWeight: 600 }}>
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
                const color  = isOver ? "var(--danger-color)" : isSoon ? "var(--warning-color)" : "var(--success-color)";
                const remaining =
                  mod.remaining_km != null
                    ? mod.remaining_km > 0
                      ? `${mod.remaining_km.toLocaleString()} km remaining`
                      : `Overdue by ${Math.abs(mod.remaining_km).toLocaleString()} km`
                    : mod.remaining_days != null
                      ? mod.remaining_days > 0
                        ? `${mod.remaining_days} days remaining`
                        : `${Math.abs(mod.remaining_days)} days overdue`
                      : "";
                return (
                  <div key={mod.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid var(--border-color)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Wrench size={13} style={{ color, flexShrink: 0 }} />
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{mod.name}</span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color, fontWeight: 600 }}>{remaining}</span>
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
              onClick={() => sessionStorage.setItem("openOdoModal", "1")}
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

          {/* Odometer History link */}
          <div style={{ padding: "0 16px 14px" }}>
            <Link
              to={`/odometer-history/${vehicle.id}`}
              style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-secondary)", fontSize: "0.78rem", fontWeight: 500 }}
            >
              <Clock size={13} />
              View Odometer History
              <ChevronRight size={13} style={{ marginLeft: "auto" }} />
            </Link>
          </div>

          {/* Slide-back hint shown when stuck */}
          {isStuck && (
            <div
              style={{
                position:       "absolute",
                bottom:         8,
                left:           "50%",
                transform:      "translateX(-50%)",
                background:     "rgba(0,0,0,0.55)",
                color:          "#fff",
                fontSize:       "0.65rem",
                fontWeight:     600,
                padding:        "4px 12px",
                borderRadius:   20,
                display:        "flex",
                alignItems:     "center",
                gap:            5,
                pointerEvents:  "none",
                letterSpacing:  "0.03em",
                backdropFilter: "blur(4px)",
                zIndex:         5,
              }}
            >
              <RotateCcw size={10} /> Swipe left or tap 🗑 to cancel
            </div>
          )}
        </div>
      </div>

      {/* ── CONFIRMATION MODAL ────────────────────────────────────── */}
      {showModal && (
        <div
          className="delete-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="delete-modal-dialog"
            onClick={e => e.stopPropagation()}
          >
            <div className="delete-modal-icon">
              <Trash2 size={26} />
            </div>
            <div className="delete-modal-title">Delete Vehicle?</div>
            <div className="delete-modal-desc">
              <strong>{vehicle.make} {vehicle.model}</strong> and all its odometer history, maintenance schedules, and service records will be permanently removed.
            </div>
            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn-ghost"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-orange"
                style={{ flex: 1, justifyContent: "center", background: "var(--danger-color)", borderColor: "var(--danger-color)" }}
                onClick={confirmDelete}
              >
                <Trash2 size={15} /> Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
