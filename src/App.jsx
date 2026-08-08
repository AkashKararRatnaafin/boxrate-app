import React, { useState, useRef } from "react";
import { Trash2, Plus, ChevronDown } from "lucide-react";

// Temporary mock vendor list — step 4 will pull this live from Supabase's `vendors` table.
const MOCK_VENDORS = ["Sharma Packaging", "Patel Boxes", "Mehta Traders"];
const COLORS = ["Blue", "Maroon", "Red"];

const fmt = (n) => "₹" + (isNaN(n) ? 0 : n).toFixed(2);
const num = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

function makeRow(id, defaults) {
  return {
    id,
    height: 5,
    length: 5,
    width: 3,
    qty: 1,
    hasAcrylic: false,
    color: "Blue",
    vendor: defaults.vendor,
    rate: defaults.rate,
    acrylicRate: defaults.acrylicRate,
  };
}

function computePrice(row) {
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

export default function VerifyGrid() {
  const [batchVendor, setBatchVendor] = useState(MOCK_VENDORS[0]);
  const [batchDate, setBatchDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const nextId = useRef(1);
  const [rows, setRows] = useState(() => [
    makeRow(0, { vendor: MOCK_VENDORS[0], rate: 2.5, acrylicRate: 0.6 }),
  ]);
  const lastRates = useRef({ rate: 2.5, acrylicRate: 0.6 });

  const updateRow = (id, patch) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    if (patch.rate !== undefined) lastRates.current.rate = patch.rate;
    if (patch.acrylicRate !== undefined)
      lastRates.current.acrylicRate = patch.acrylicRate;
  };

  const addRow = () => {
    const id = nextId.current++;
    setRows((rs) => [
      ...rs,
      makeRow(id, { vendor: batchVendor, ...lastRates.current }),
    ]);
  };

  const deleteRow = (id) => {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : rs));
  };

  const totals = rows.reduce(
    (acc, r) => {
      const p = computePrice(r);
      acc.boxes += num(r.qty);
      acc.amount += p.total;
      return acc;
    },
    { boxes: 0, amount: 0 },
  );

  return (
    <div
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: "#C7A574",
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(0,0,0,0.035) 0px, rgba(0,0,0,0.035) 2px, transparent 2px, transparent 14px)",
        minHeight: "100vh",
        padding: "16px 12px 100px",
        color: "#2B2118",
      }}
    >
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ padding: "10px 6px 18px" }}>
          <h1
            style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: 26,
              margin: "0 0 2px",
              letterSpacing: 1,
            }}
          >
            Verify Boxes
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#6B5A45",
              fontWeight: 600,
            }}
          >
            check the numbers, then save
          </p>
        </div>

        {/* Batch info card */}
        <div
          style={{
            background: "#F6EEDF",
            border: "1px solid rgba(43,33,24,0.18)",
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 14,
            boxShadow: "0 6px 14px rgba(43,33,24,0.12)",
          }}
        >
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: "#6B5A45",
              marginBottom: 10,
            }}
          >
            This batch
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Vendor</label>
              <SelectField
                value={batchVendor}
                onChange={(v) => {
                  setBatchVendor(v);
                }}
                options={MOCK_VENDORS}
              />
            </div>
            <div style={{ width: 140 }}>
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                value={batchDate}
                onChange={(e) => setBatchDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#6B5A45", marginTop: 8 }}>
            Applies to new boxes below — override per box if needed.
          </div>
        </div>

        {/* Box rows */}
        {rows.map((row, idx) => {
          const price = computePrice(row);
          return (
            <div
              key={row.id}
              style={{
                background: "#F6EEDF",
                border: "1px solid rgba(43,33,24,0.18)",
                borderRadius: 10,
                padding: "14px 16px 12px",
                marginBottom: 12,
                boxShadow: "0 6px 14px rgba(43,33,24,0.12)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#8E2C22",
                    letterSpacing: 1,
                  }}
                >
                  BOX {idx + 1}
                </div>
                <button
                  onClick={() => deleteRow(row.id)}
                  disabled={rows.length === 1}
                  style={{
                    background: "none",
                    border: "none",
                    color: rows.length === 1 ? "#C9BBA0" : "#B23A2E",
                    cursor: rows.length === 1 ? "default" : "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label="Delete box"
                >
                  <Trash2 size={17} />
                </button>
              </div>

              {/* Dimensions + qty */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 0.8fr",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <NumField
                  label="Height"
                  value={row.height}
                  onChange={(v) => updateRow(row.id, { height: v })}
                />
                <NumField
                  label="Length"
                  value={row.length}
                  onChange={(v) => updateRow(row.id, { length: v })}
                />
                <NumField
                  label="Width"
                  value={row.width}
                  onChange={(v) => updateRow(row.id, { width: v })}
                />
                <NumField
                  label="Qty"
                  value={row.qty}
                  onChange={(v) => updateRow(row.id, { qty: v })}
                />
              </div>

              {/* Acrylic + color */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 10,
                  alignItems: "flex-end",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#EFE3CB",
                    border: "1.5px solid rgba(43,33,24,0.18)",
                    borderRadius: 7,
                    padding: "8px 10px",
                    height: 40,
                  }}
                >
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>
                    Acrylic
                  </span>
                  <Toggle
                    checked={row.hasAcrylic}
                    onChange={(v) => updateRow(row.id, { hasAcrylic: v })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Color</label>
                  <SelectField
                    value={row.color}
                    onChange={(v) => updateRow(row.id, { color: v })}
                    options={COLORS}
                  />
                </div>
              </div>

              {/* Vendor override */}
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Vendor</label>
                <SelectField
                  value={row.vendor}
                  onChange={(v) => updateRow(row.id, { vendor: v })}
                  options={MOCK_VENDORS}
                />
              </div>

              {/* Rates */}
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <NumField
                  label="Rate / sq.in"
                  value={row.rate}
                  onChange={(v) => updateRow(row.id, { rate: v })}
                />
                <NumField
                  label="Acrylic rate"
                  value={row.acrylicRate}
                  onChange={(v) => updateRow(row.id, { acrylicRate: v })}
                  disabled={!row.hasAcrylic}
                />
              </div>

              {/* Price */}
              <div
                style={{
                  borderTop: "1px dashed rgba(43,33,24,0.18)",
                  paddingTop: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                <span style={{ fontSize: 11.5, color: "#6B5A45" }}>
                  {fmt(price.unit)} &times; {num(row.qty)}
                </span>
                <span
                  style={{ fontSize: 20, fontWeight: 600, color: "#8E2C22" }}
                >
                  {fmt(price.total)}
                </span>
              </div>
            </div>
          );
        })}

        {/* Add row */}
        <button
          onClick={addRow}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 10,
            border: "1.5px dashed rgba(43,33,24,0.35)",
            background: "transparent",
            color: "#2B2118",
            fontWeight: 600,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          <Plus size={17} /> Add box
        </button>
      </div>

      {/* Sticky total bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#2B2118",
          color: "#F6EEDF",
          padding: "12px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 -4px 14px rgba(0,0,0,0.25)",
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "#C7A574", letterSpacing: 1 }}>
            {totals.boxes} box{totals.boxes === 1 ? "" : "es"} &middot;{" "}
            {batchVendor}
          </div>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            {fmt(totals.amount)}
          </div>
        </div>
        <button
          style={{
            background: "#B23A2E",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "12px 22px",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
          onClick={() =>
            alert(
              "Saving to Supabase comes in step 4 — this button is wired up next.",
            )
          }
        >
          Save batch
        </button>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "#6B5A45",
  marginBottom: 4,
};

const inputStyle = {
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

function NumField({ label, value, onChange, disabled }) {
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

function SelectField({ value, onChange, options }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...inputStyle,
          appearance: "none",
          WebkitAppearance: "none",
          paddingRight: 26,
          cursor: "pointer",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
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

function Toggle({ checked, onChange }) {
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
