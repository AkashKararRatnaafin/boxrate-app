import React, { useState, useRef } from "react";
import { Trash2, Plus, ArrowLeft } from "lucide-react";
import {
  MOCK_VENDORS,
  COLORS,
  fmt,
  num,
  computePrice,
  labelStyle,
  inputStyle,
  pageStyle,
  cardStyle,
  NumField,
  SelectField,
  Toggle,
} from "./shared.jsx";

function makeRow(id, defaults) {
  return {
    id,
    height: defaults.height ?? 5,
    length: defaults.length ?? 5,
    width: defaults.width ?? 3,
    qty: defaults.qty ?? 1,
    hasAcrylic: defaults.hasAcrylic ?? false,
    color: defaults.color ?? "Blue",
    vendor: defaults.vendor,
    rate: defaults.rate,
    acrylicRate: defaults.acrylicRate,
  };
}

// initialRows (optional): raw extracted rows from the photo scan, shape:
// { height, length, width, qty, has_acrylic, color }
export default function VerifyGrid({ initialRows, initialVendor, onBack }) {
  const [batchVendor, setBatchVendor] = useState(initialVendor || MOCK_VENDORS[0]);
  const [batchDate, setBatchDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const nextId = useRef(0);
  const lastRates = useRef({ rate: 2.5, acrylicRate: 0.6 });

  const [rows, setRows] = useState(() => {
    if (initialRows && initialRows.length > 0) {
      return initialRows.map((r) => {
        const id = nextId.current++;
        return makeRow(id, {
          height: r.height,
          length: r.length,
          width: r.width,
          qty: r.qty,
          hasAcrylic: !!r.has_acrylic,
          color: r.color || "Blue",
          vendor: initialVendor || MOCK_VENDORS[0],
          rate: lastRates.current.rate,
          acrylicRate: lastRates.current.acrylicRate,
        });
      });
    }
    const id = nextId.current++;
    return [
      makeRow(id, {
        vendor: initialVendor || MOCK_VENDORS[0],
        rate: 2.5,
        acrylicRate: 0.6,
      }),
    ];
  });

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
    { boxes: 0, amount: 0 }
  );

  return (
    <div style={{ ...pageStyle, paddingBottom: 100 }}>
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ padding: "10px 6px 18px" }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: "none",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: "#6B5A45",
                fontSize: 12,
                fontWeight: 600,
                padding: 0,
                marginBottom: 8,
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={14} /> back
            </button>
          )}
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
        <div style={cardStyle}>
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
                onChange={(v) => setBatchVendor(v)}
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
            <div key={row.id} style={{ ...cardStyle, padding: "14px 16px 12px" }}>
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
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>Acrylic</span>
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

              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Vendor</label>
                <SelectField
                  value={row.vendor}
                  onChange={(v) => updateRow(row.id, { vendor: v })}
                  options={MOCK_VENDORS}
                />
              </div>

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
                <span style={{ fontSize: 20, fontWeight: 600, color: "#8E2C22" }}>
                  {fmt(price.total)}
                </span>
              </div>
            </div>
          );
        })}

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
            {totals.boxes} box{totals.boxes === 1 ? "" : "es"} &middot; {batchVendor}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 600 }}>
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
            alert("Saving to Supabase comes in step 4 — this button is wired up next.")
          }
        >
          Save batch
        </button>
      </div>
    </div>
  );
}
