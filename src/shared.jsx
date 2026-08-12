import React from "react";
import { ChevronDown } from "lucide-react";
import { supabase } from "./supabaseClient.js";

export const COLORS = ["Blue", "Maroon", "Red"];

export async function fetchVendors() {
  const { data, error } = await supabase
    .from("vendors")
    .select("id, name, default_rate")
    .order("name");
  if (error) throw error;
  return data;
}

export async function createVendor(name, defaultRate) {
  const { data, error } = await supabase
    .from("vendors")
    .insert({ name: name.trim(), default_rate: defaultRate ?? null })
    .select("id, name, default_rate")
    .single();
  if (error) throw error;
  return data;
}

export async function updateVendorRate(id, defaultRate) {
  const { data, error } = await supabase
    .from("vendors")
    .update({ default_rate: defaultRate })
    .eq("id", id)
    .select("id, name, default_rate")
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
  const h = num(row.height), l = num(row.length), w = num(row.width);
  const rate = num(row.rate);
  const acrylicRate = num(row.acrylicRate);
  const boxPrice = (h + w) * (l + w) * rate;
  const acrylicPrice = row.hasAcrylic ? h * l * acrylicRate : 0;
  const unit = boxPrice + acrylicPrice;
  return { boxPrice, acrylicPrice, unit, total: unit * num(row.qty) };
}

/* ---------- Glass design tokens ---------- */

export const COLORS_UI = {
  ink: "#1C1C1E",
  inkSoft: "#68686D",
  accent: "#FF3B30",
  accentDark: "#D6291F",
  ok: "#30B858",
  glassBorder: "rgba(255,255,255,0.55)",
};

export const pageStyle = {
  fontFamily: "'Inter', system-ui, sans-serif",
  background:
    "linear-gradient(150deg, #FFC48C 0%, #FF8A73 32%, #E85C77 58%, #8E5AB0 100%)",
  backgroundAttachment: "fixed",
  minHeight: "100vh",
  padding: "18px 12px 96px",
  color: COLORS_UI.ink,
};

// Frosted glass card — the core visual signature of this redesign.
export const cardStyle = {
  background: "rgba(255,255,255,0.46)",
  backdropFilter: "blur(22px) saturate(160%)",
  WebkitBackdropFilter: "blur(22px) saturate(160%)",
  border: `1px solid ${COLORS_UI.glassBorder}`,
  borderRadius: 20,
  padding: "16px 17px",
  marginBottom: 14,
  boxShadow: "0 8px 28px rgba(60,20,50,0.14)",
  animation: "fadeInUp 0.25s ease both",
};

export const glassPanelDark = {
  background: "rgba(28,28,30,0.55)",
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "#fff",
};

export const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: COLORS_UI.inkSoft,
  marginBottom: 5,
  letterSpacing: 0.2,
};

export const inputStyle = {
  width: "100%",
  fontFamily: "'DM Mono', monospace",
  fontSize: 14,
  padding: "9px 10px",
  border: "1px solid rgba(28,28,30,0.12)",
  borderRadius: 12,
  background: "rgba(255,255,255,0.55)",
  color: COLORS_UI.ink,
  boxSizing: "border-box",
  outline: "none",
};

export function NumField({ label, value, onChange, disabled }) {
  return (
    <div style={{ opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? "none" : "auto" }}>
      <label style={labelStyle}>{label}</label>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, textAlign: "center" }}
      />
    </div>
  );
}

export function SelectField({ value, onChange, options }) {
  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...inputStyle,
          appearance: "none",
          WebkitAppearance: "none",
          paddingRight: 28,
          cursor: "pointer",
        }}
      >
        {normalized.length === 0 && <option value="">No options yet</option>}
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        style={{
          position: "absolute",
          right: 9,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: COLORS_UI.inkSoft,
        }}
      />
    </div>
  );
}

export function Toggle({ checked, onChange }) {
  return (
    <label style={{ position: "relative", width: 42, height: 24, display: "inline-block" }}>
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
          background: checked ? COLORS_UI.ok : "rgba(28,28,30,0.18)",
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

// Primary iOS-style pill button — vivid gradient fill, soft glow.
export const primaryBtn = {
  width: "100%",
  padding: "15px",
  borderRadius: 16,
  border: "none",
  background: "linear-gradient(135deg, #FF5B4A 0%, #E8394F 100%)",
  color: "#fff",
  fontWeight: 700,
  fontSize: 15,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(232,57,79,0.35)",
};

export const secondaryBtn = {
  width: "100%",
  padding: "13px",
  borderRadius: 16,
  border: `1px solid ${COLORS_UI.glassBorder}`,
  background: "rgba(255,255,255,0.4)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  color: COLORS_UI.ink,
  fontWeight: 600,
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  cursor: "pointer",
};
