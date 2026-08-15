import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { supabase } from "./supabaseClient.js";

export const COLORS = ["Blue", "Maroon", "Red"];

export async function fetchVendors() {
  const { data, error } = await supabase
    .from("vendors")
    .select("id, name, default_rate, default_acrylic_rate")
    .order("name");
  if (error) throw error;
  return data;
}

export async function createVendor(name, defaultRate, defaultAcrylicRate) {
  const { data, error } = await supabase
    .from("vendors")
    .insert({
      name: name.trim(),
      default_rate: defaultRate ?? null,
      default_acrylic_rate: defaultAcrylicRate ?? null,
    })
    .select("id, name, default_rate, default_acrylic_rate")
    .single();
  if (error) throw error;
  return data;
}

export async function updateVendorRates(
  id,
  { defaultRate, defaultAcrylicRate },
) {
  const { data, error } = await supabase
    .from("vendors")
    .update({
      default_rate: defaultRate,
      default_acrylic_rate: defaultAcrylicRate,
    })
    .eq("id", id)
    .select("id, name, default_rate, default_acrylic_rate")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteVendor(id) {
  const { error } = await supabase.from("vendors").delete().eq("id", id);
  if (error) throw error;
}

export const fmt = (n) => "₹" + (isNaN(n) ? 0 : n).toFixed(2);
export const num = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

export function computePrice(row) {
  const h = num(row.height),
    l = num(row.length),
    w = num(row.width);
  const rate = num(row.rate);
  const acrylicRate = num(row.acrylicRate);
  const boxPrice = (h + w) * (l + w) * rate;
  const acrylicPrice = row.hasAcrylic ? h * l * acrylicRate : 0;
  const unit = boxPrice + acrylicPrice;
  return { boxPrice, acrylicPrice, unit, total: unit * num(row.qty) };
}

/* ---------- Design tokens (theme-aware via CSS variables) ---------- */

export const COLORS_UI = {
  ink: "var(--ink)",
  inkSoft: "var(--ink-soft)",
  accent: "var(--accent)",
  accentDark: "var(--accent-dark)",
  accentGrad: "var(--accent-grad)",
  ok: "var(--ok)",
  okGrad: "var(--ok-grad)",
  glassBorder: "var(--card-border)",
};

export const pageStyle = {
  fontFamily: "'Inter', system-ui, sans-serif",
  background: "var(--page-bg)",
  backgroundAttachment: "fixed",
  minHeight: "100vh",
  padding: "18px 12px 118px",
  color: "var(--ink)",
};

export const cardStyle = {
  background: "var(--card-bg)",
  backdropFilter: "blur(22px) saturate(160%)",
  WebkitBackdropFilter: "blur(22px) saturate(160%)",
  border: "1px solid var(--card-border)",
  borderRadius: 20,
  padding: "16px 17px",
  marginBottom: 14,
  boxShadow: "var(--shadow-card)",
  animation: "fadeInUp 0.25s ease both",
};

export const titleStyle = {
  fontFamily: "'Special Elite', monospace",
  fontSize: 27,
  margin: "0 0 2px",
  letterSpacing: 1,
  color: "var(--ink)",
  textShadow: "var(--title-shadow)",
};

export const subtitleStyle = {
  margin: 0,
  fontSize: 12,
  letterSpacing: 2,
  textTransform: "uppercase",
  color: "var(--ink-soft)",
  fontWeight: 600,
};

export const backBtnStyle = {
  background: "none",
  border: "none",
  display: "flex",
  alignItems: "center",
  gap: 4,
  color: "var(--ink-soft)",
  fontSize: 12,
  fontWeight: 700,
  padding: 0,
  marginBottom: 8,
  cursor: "pointer",
};

export const sectionLabelStyle = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 11,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  color: "var(--ink-soft)",
  marginBottom: 10,
  display: "flex",
  alignItems: "center",
  gap: 6,
};

export const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--ink-soft)",
  marginBottom: 5,
  letterSpacing: 0.2,
};

export const inputStyle = {
  width: "100%",
  fontFamily: "'DM Mono', monospace",
  fontSize: 14,
  padding: "9px 10px",
  border: "1px solid var(--input-border)",
  borderRadius: 12,
  background: "var(--input-bg)",
  color: "var(--ink)",
  boxSizing: "border-box",
  outline: "none",
};

export function TextField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type="text"
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

export function NumField({ label, value, onChange, disabled, placeholder }) {
  return (
    <div
      style={{
        opacity: disabled ? 0.4 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      <label style={labelStyle}>{label}</label>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, textAlign: "center" }}
      />
    </div>
  );
}

const dropdownPanelStyle = {
  position: "fixed",
  background: "var(--card-bg)",
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
  border: "1px solid var(--card-border)",
  borderRadius: 14,
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  zIndex: 1000,
  animation: "fadeInUp 0.15s ease both",
};

export function SelectField({ value, onChange, options }) {
  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (
        btnRef.current &&
        !btnRef.current.contains(e.target) &&
        !(panelRef.current && panelRef.current.contains(e.target))
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggleOpen() {
    if (normalized.length === 0) return;
    if (!open && btnRef.current)
      setRect(btnRef.current.getBoundingClientRect());
    setOpen((o) => !o);
  }

  const selected = normalized.find((o) => o.value === value);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
        style={{
          ...inputStyle,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: normalized.length > 0 ? "pointer" : "default",
          textAlign: "left",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {selected
            ? selected.label
            : normalized.length === 0
              ? "No options yet"
              : "Select…"}
        </span>
        <ChevronDown
          size={14}
          style={{
            color: "var(--ink-soft)",
            flexShrink: 0,
            marginLeft: 6,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        />
      </button>
      {open &&
        normalized.length > 0 &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              ...dropdownPanelStyle,
              top: rect.bottom + 6,
              left: rect.left,
              width: rect.width,
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            {normalized.map((o) => {
              const isSelected = o.value === value;
              return (
                <div
                  key={o.value}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  style={{
                    padding: "10px 12px",
                    fontSize: 14,
                    fontFamily: "'DM Mono', monospace",
                    cursor: "pointer",
                    background: isSelected
                      ? "rgba(178,58,46,0.12)"
                      : "transparent",
                    color: isSelected ? "var(--accent-dark)" : "var(--ink)",
                    fontWeight: isSelected ? 700 : 500,
                  }}
                >
                  {o.label}
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}

/* ---------- Custom date picker (replaces native input[type=date]) ---------- */

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad2(n) {
  return String(n).padStart(2, "0");
}
function toISODate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function parseISODate(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
function formatDisplayDate(s) {
  const d = parseISODate(s);
  if (!d) return "";
  return `${pad2(d.getDate())} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

export function DateField({ value, onChange, placeholder = "Select date" }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const selectedDate = parseISODate(value);
  const [viewDate, setViewDate] = useState(() => selectedDate || new Date());
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const PANEL_WIDTH = 240;

  useEffect(() => {
    function handleClick(e) {
      if (
        btnRef.current &&
        !btnRef.current.contains(e.target) &&
        !(panelRef.current && panelRef.current.contains(e.target))
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open) setViewDate(selectedDate || new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggleOpen() {
    if (!open && btnRef.current)
      setRect(btnRef.current.getBoundingClientRect());
    setOpen((o) => !o);
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayISO = toISODate(new Date());

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function selectDay(d) {
    onChange(toISODate(new Date(year, month, d)));
    setOpen(false);
  }

  let panelLeft = 8;
  if (rect) {
    const centered = rect.left + rect.width / 2 - PANEL_WIDTH / 2;
    panelLeft = Math.min(
      Math.max(centered, 8),
      window.innerWidth - PANEL_WIDTH - 8,
    );
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
        style={{
          ...inputStyle,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ color: value ? "var(--ink)" : "var(--ink-soft)" }}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <CalendarIcon
          size={14}
          style={{ color: "var(--ink-soft)", flexShrink: 0, marginLeft: 6 }}
        />
      </button>
      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              ...dropdownPanelStyle,
              top: rect.bottom + 6,
              left: panelLeft,
              width: PANEL_WIDTH,
              maxWidth: "88vw",
              padding: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month - 1, 1))}
                style={calNavBtnStyle}
              >
                <ChevronLeft size={15} />
              </button>
              <span
                style={{ fontWeight: 700, fontSize: 12.5, color: "var(--ink)" }}
              >
                {MONTHS[month]} {year}
              </span>
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month + 1, 1))}
                style={calNavBtnStyle}
              >
                <ChevronRight size={15} />
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 2,
                marginBottom: 2,
              }}
            >
              {WEEKDAYS.map((w) => (
                <div
                  key={w}
                  style={{
                    textAlign: "center",
                    fontSize: 9.5,
                    color: "var(--ink-soft)",
                    fontWeight: 700,
                  }}
                >
                  {w}
                </div>
              ))}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 2,
              }}
            >
              {cells.map((d, i) => {
                if (d === null) return <div key={i} />;
                const iso = toISODate(new Date(year, month, d));
                const isSelected = iso === value;
                const isToday = iso === todayISO;
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => selectDay(d)}
                    style={{
                      aspectRatio: "1",
                      border:
                        isToday && !isSelected
                          ? "1px solid var(--accent)"
                          : "none",
                      borderRadius: 8,
                      background: isSelected
                        ? "var(--accent-grad)"
                        : "transparent",
                      color: isSelected ? "#fff" : "var(--ink)",
                      fontSize: 11.5,
                      fontFamily: "'DM Mono', monospace",
                      fontWeight: isSelected ? 700 : 500,
                      cursor: "pointer",
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                style={{
                  marginTop: 8,
                  width: "100%",
                  background: "none",
                  border: "none",
                  color: "var(--ink-soft)",
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                Clear date
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

const calNavBtnStyle = {
  width: 24,
  height: 24,
  borderRadius: 7,
  border: "none",
  background: "rgba(0,0,0,0.06)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "var(--ink)",
};

export function Toggle({ checked, onChange }) {
  return (
    <label
      style={{
        position: "relative",
        width: 42,
        height: 24,
        display: "inline-block",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ opacity: 0, width: 0, height: 0 }}
      />
      <span
        style={{
          position: "absolute",
          inset: 0,
          background: checked ? "var(--ok)" : "var(--toggle-off)",
          borderRadius: 20,
          transition: "0.18s",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            position: "absolute",
            height: 18,
            width: 18,
            left: checked ? 21 : 3,
            top: 3,
            background: "#fff",
            borderRadius: "50%",
            transition: "0.18s",
            boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
          }}
        />
      </span>
    </label>
  );
}

export const primaryBtn = {
  width: "100%",
  padding: "15px",
  borderRadius: 16,
  border: "none",
  background: "var(--accent-grad)",
  color: "#fff",
  fontWeight: 700,
  fontSize: 15,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  cursor: "pointer",
  boxShadow: "0 8px 20px var(--accent-glow)",
};

export const secondaryBtn = {
  width: "100%",
  padding: "13px",
  borderRadius: 16,
  border: "1px solid var(--card-border)",
  background: "var(--input-bg)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  color: "var(--ink)",
  fontWeight: 600,
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  cursor: "pointer",
};

export const dangerBtn = {
  width: "100%",
  padding: "13px",
  borderRadius: 16,
  border: "1px solid rgba(178,58,46,0.4)",
  background: "rgba(178,58,46,0.12)",
  color: "var(--accent)",
  fontWeight: 700,
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  cursor: "pointer",
};

/* ---------- Custom confirm dialog (replaces browser confirm()) ---------- */

export function useConfirm() {
  const [state, setState] = useState(null); // { title, message, confirmLabel, resolve } | null

  function confirm(opts) {
    const options = typeof opts === "string" ? { message: opts } : opts;
    return new Promise((resolve) => {
      setState({ ...options, resolve });
    });
  }

  function respond(result) {
    state?.resolve(result);
    setState(null);
  }

  const dialog = state ? (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={() => respond(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...cardStyle,
          maxWidth: 360,
          width: "100%",
          margin: 0,
          animation: "fadeInUp 0.18s ease both",
        }}
      >
        {state.title && (
          <div
            style={{
              fontWeight: 700,
              fontSize: 16,
              marginBottom: 8,
              color: "var(--ink)",
            }}
          >
            {state.title}
          </div>
        )}
        <div
          style={{
            fontSize: 13.5,
            color: "var(--ink-soft)",
            lineHeight: 1.5,
            marginBottom: 18,
          }}
        >
          {state.message}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => respond(false)}
            style={{ ...secondaryBtn, flex: 1 }}
          >
            Cancel
          </button>
          <button
            onClick={() => respond(true)}
            style={{
              flex: 1,
              padding: "13px",
              borderRadius: 16,
              border: "none",
              background: "var(--accent-grad)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "0 8px 20px var(--accent-glow)",
            }}
          >
            {state.confirmLabel || "Delete"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, dialog };
}
