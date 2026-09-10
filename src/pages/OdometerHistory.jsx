import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useGarage } from "../context/GarageContext";
import { ChevronLeft, RotateCcw, Clock, User, AlertTriangle } from "lucide-react";
import { format, isToday, isYesterday, parseISO } from "date-fns";

function groupByDate(entries) {
  const groups = {};
  (entries || []).forEach((entry) => {
    const d = parseISO(entry.created_at);
    let label;
    if (isToday(d)) label = "Today";
    else if (isYesterday(d)) label = "Yesterday";
    else label = format(d, "dd MMM yyyy");

    if (!groups[label]) groups[label] = [];
    groups[label].push(entry);
  });
  return groups;
}

export default function OdometerHistory() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { vehicles, getOdometerHistory, rewindOdometer } = useGarage();
  const vehicle = vehicles.find((v) => v.id === vehicleId);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [rewindingId, setRewindingId] = useState(null);
  const [confirmRewindId, setConfirmRewindId] = useState(null);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await getOdometerHistory(vehicleId);
      setHistory(data);
    } catch (err) {
      setError("Could not load odometer history.");
    } finally {
      setLoadingHistory(false);
    }
  }, [vehicleId, getOdometerHistory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Find the latest non-rewound entry id (only that one gets undo button)
  const latestValidId = history.find((h) => !h.is_rewound)?.id || null;

  const handleRewind = async (historyId) => {
    if (rewindingId) return;
    setRewindingId(historyId);
    setError("");
    try {
      await rewindOdometer(historyId, vehicleId);
      await loadHistory();
    } catch (err) {
      setError(err.message || "Rewind failed. Please try again.");
    } finally {
      setRewindingId(null);
      setConfirmRewindId(null);
    }
  };

  const grouped = groupByDate(history);
  const groupLabels = Object.keys(grouped);

  if (!vehicle) {
    return (
      <div className="app-container" style={{ paddingTop: 40 }}>
        <p style={{ color: "var(--text-muted)" }}>Vehicle not found.</p>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ paddingTop: 0 }}>
      {/* ── Header ──────────────────────────────── */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              padding: 0,
            }}
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: "1.25rem" }}>
              Odometer History
            </h1>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              {vehicle.make} {vehicle.model} &bull; Current:{" "}
              <strong style={{ color: "var(--accent-color)" }}>
                {vehicle.current_odometer?.toLocaleString()} km
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── Error banner ────────────────────────── */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            marginBottom: 16,
            borderRadius: 10,
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.18)",
            color: "var(--danger-color)",
            fontSize: "0.82rem",
            fontWeight: 500,
          }}
        >
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      {/* ── Explain rewind ──────────────────────── */}
      <div
        style={{
          padding: "10px 14px",
          marginBottom: 20,
          borderRadius: 10,
          background: "rgba(59,130,246,0.05)",
          border: "1px solid rgba(59,130,246,0.15)",
          fontSize: "0.78rem",
          color: "var(--text-secondary)",
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: "var(--info-color)" }}>Rewind / Undo</strong> marks
        an incorrect entry as reversed without deleting it. The previous valid reading
        is then restored automatically.
      </div>

      {/* ── History list ────────────────────────── */}
      {loadingHistory ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "40px 0",
          }}
        >
          <div className="spinner" />
        </div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📏</div>
          <h5>No odometer records yet</h5>
          <p>Update the odometer from the vehicle profile to start tracking.</p>
          <Link to={`/vehicle/${vehicleId}`} className="btn-orange">
            Go to Vehicle
          </Link>
        </div>
      ) : (
        groupLabels.map((label) => (
          <div key={label} style={{ marginBottom: 24 }}>
            {/* Date header */}
            <div className="odo-date-header">{label}</div>

            {grouped[label].map((entry) => {
              const isRewound = entry.is_rewound;
              const isLatestValid = entry.id === latestValidId;
              const isConfirming = confirmRewindId === entry.id;

              return (
                <div
                  key={entry.id}
                  className={`odo-entry${isRewound ? " rewound" : ""}`}
                >
                  {/* Left: value + delta */}
                  <div style={{ flex: 1 }}>
                    <div className="odo-entry-value">
                      {isRewound ? (
                        <s style={{ opacity: 0.55 }}>
                          {entry.odometer_value?.toLocaleString()} km
                        </s>
                      ) : (
                        <span>{entry.odometer_value?.toLocaleString()} km</span>
                      )}
                      {isRewound && (
                        <span className="odo-rewound-badge">REWOUND</span>
                      )}
                    </div>
                    {entry.previous_value > 0 && (
                      <div className="odo-entry-delta">
                        +
                        {(
                          entry.odometer_value - entry.previous_value
                        ).toLocaleString()}{" "}
                        km from {entry.previous_value?.toLocaleString()} km
                      </div>
                    )}
                    <div className="odo-entry-meta">
                      <User size={11} />
                      {entry.added_by_name || "Unknown"}
                      &nbsp;&bull;&nbsp;
                      <Clock size={11} />
                      {format(parseISO(entry.created_at), "hh:mm a")}
                    </div>
                    {isRewound && entry.rewound_at && (
                      <div className="odo-entry-rewound-time">
                        Rewound at{" "}
                        {format(parseISO(entry.rewound_at), "dd MMM, hh:mm a")}
                      </div>
                    )}
                  </div>

                  {/* Right: undo button (only on latest valid) */}
                  {!isRewound && isLatestValid && (
                    <div style={{ flexShrink: 0, marginLeft: 12 }}>
                      {isConfirming ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                            Confirm rewind?
                          </span>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="odo-rewind-confirm-btn"
                              disabled={rewindingId === entry.id}
                              onClick={() => handleRewind(entry.id)}
                            >
                              <RotateCcw size={12} />
                              {rewindingId === entry.id ? "Rewinding…" : "Yes, Rewind"}
                            </button>
                            <button
                              className="odo-rewind-cancel-btn"
                              onClick={() => setConfirmRewindId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="odo-undo-btn"
                          onClick={() => setConfirmRewindId(entry.id)}
                        >
                          <RotateCcw size={13} />
                          Undo
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
