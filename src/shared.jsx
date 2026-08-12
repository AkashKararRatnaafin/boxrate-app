import React from "react";
import { ChevronDown } from "lucide-react";
import { supabase } from "./supabaseClient.js";

export const COLORS = ["Blue", "Maroon", "Red"];

export async function fetchVendors() {
  const { data, error } = await supabase
    .from("vendors")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return data;
}

export async function createVendor(name) {
  const { data, error } = await supabase
    .from("vendors")
    .insert({ name: name.trim() })
    .select("id, name")
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

export const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "#6B5A45",
  marginBottom: 4,
};

export const inputStyle = {
  width: "100%",
  fontFamily: "'DM Mono', monospace",
  fontSize: 14,
  padding: "8px 8px",
  border: "1.5px solid rgba(43,33,24,0.18)",
  borderRadius: 7,
  background: "#EFE3CB",
  color: "#2B2118",
  boxSizing: "border-box",
};

export const pageStyle = {
  fontFamily: "'Inter', system-ui, sans-serif",
  background: "#C7A574",
  backgroundImage:
    "repeating-linear-gradient(45deg, rgba(0,0,0,0.035) 0px, rgba(0,0,0,0.035) 2px, transparent 2px, transparent 14px)",
  minHeight: "100vh",
  padding: "16px 12px 40px",
  color: "#2B2118",
};

export const cardStyle = {
  background: "#F6EEDF",
  border: "1px solid rgba(43,33,24,0.18)",
  borderRadius: 10,
  padding: "14px 16px",
  marginBottom: 14,
  boxShadow: "0 6px 14px rgba(43,33,24,0.12)",
};

export function NumField({ label, value, onChange, disabled }) {
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
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, textAlign: "center" }}
      />
    </div>
  );
}

export function SelectField({ value, onChange, options }) {
  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
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
          paddingRight: 26,
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
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "#6B5A45",
        }}
      />
    </div>
  );
}

export function Toggle({ checked, onChange }) {
  return (
    <label
      style={{
        position: "relative",
        width: 40,
        height: 22,
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
          background: checked ? "#4C6B4C" : "#D8C6A3",
          border: "1.5px solid rgba(43,33,24,0.18)",
          borderRadius: 20,
          transition: "0.18s",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            position: "absolute",
            height: 16,
            width: 16,
            left: checked ? 20 : 2,
            top: 1.5,
            background: checked ? "#fff" : "#F6EEDF",
            borderRadius: "50%",
            transition: "0.18s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
      </span>
    </label>
  );
}
