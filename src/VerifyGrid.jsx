import React, { useState, useRef, useEffect } from "react";
import { Trash2, Plus, ArrowLeft, Check } from "lucide-react";
import { supabase } from "./supabaseClient.js";
import {
  COLORS,
  fmt,
  num,
  computePrice,
  fetchVendors,
  labelStyle,
  inputStyle,
  pageStyle,
  cardStyle,
  NumField,
  SelectField,
  Toggle,
  COLORS_UI,
  titleStyle,
  subtitleStyle,
  backBtnStyle,
  sectionLabelStyle,
} from "./shared.jsx";

function vendorRate(vendors, vendorId, fallback) {
  const v = vendors.find((v) => v.id === vendorId);
  if (v && v.default_rate !== null && v.default_rate !== undefined)
    return v.default_rate;
  return fallback;
}

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
// initialVendor: vendor id (uuid) chosen on the capture screen
export default function VerifyGrid({
  initialRows,
  initialVendor,
  onBack,
  onSaved,
}) {
  const [vendors, setVendors] = useState([]);
  const [batchVendor, setBatchVendor] = useState(initialVendor || "");
  const [batchDate, setBatchDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [saveError, setSaveError] = useState("");
  const nextId = useRef(0);
  const lastRates = useRef({ rate: 2.5, acrylicRate: 0.6 });

  useEffect(() => {
    fetchVendors().then((vs) => {
      setVendors(vs);
      if (!batchVendor && vs.length > 0) setBatchVendor(vs[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          vendor: initialVendor || "",
          rate: lastRates.current.rate,
          acrylicRate: lastRates.current.acrylicRate,
        });
      });
    }
    const id = nextId.current++;
    return [
      makeRow(id, {
        vendor: initialVendor || "",
        rate: 2.5,
        acrylicRate: 0.6,
      }),
    ];
  });

  // Vendors load asynchronously, but rows (from a photo scan or manual add)
  // can already exist by the time they arrive — apply the vendor's default
  // rate to those rows once, the first moment vendors are available.
  const appliedInitialRate = useRef(false);
  useEffect(() => {
    if (vendors.length === 0 || appliedInitialRate.current) return;
    appliedInitialRate.current = true;
    setRows((rs) =>
      rs.map((r) => {
        const targetVendor = r.vendor || batchVendor;
        const rate = vendorRate(vendors, targetVendor, r.rate);
        return { ...r, vendor: r.vendor || batchVendor, rate };
      }),
    );
    const v = vendors.find((v) => v.id === batchVendor);
    if (v && v.default_rate !== null && v.default_rate !== undefined) {
      lastRates.current.rate = v.default_rate;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors, batchVendor]);

  const updateRow = (id, patch) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    if (patch.rate !== undefined) lastRates.current.rate = patch.rate;
    if (patch.acrylicRate !== undefined)
      lastRates.current.acrylicRate = patch.acrylicRate;
  };

  // Changing a row's own vendor is a deliberate override — snap the rate to
  // that vendor's default (if it has one) so the "pick vendor, rate follows" flow works per-row too.
  const changeRowVendor = (id, vendorId) => {
    const rate = vendorRate(vendors, vendorId, lastRates.current.rate);
    updateRow(id, { vendor: vendorId, rate });
  };

  const addRow = () => {
    const id = nextId.current++;
    const rate = vendorRate(vendors, batchVendor, lastRates.current.rate);
    setRows((rs) => [
      ...rs,
      makeRow(id, {
        vendor: batchVendor,
        rate,
        acrylicRate: lastRates.current.acrylicRate,
      }),
    ]);
  };

  const deleteRow = (id) => {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : rs));
  };

  async function handleSave() {
    if (!batchVendor) {
      setSaveError("Pick a vendor for this batch first.");
      setSaveState("error");
      return;
    }
    setSaveState("saving");
    setSaveError("");
    try {
      const { data: batch, error: batchErr } = await supabase
        .from("batches")
        .insert({ vendor_id: batchVendor, batch_date: batchDate })
        .select("id")
        .single();
      if (batchErr) throw batchErr;

      const itemsPayload = rows.map((r) => {
        const price = computePrice(r);
        return {
          batch_id: batch.id,
          vendor_id: r.vendor || batchVendor,
          height: num(r.height),
          length: num(r.length),
          width: num(r.width),
          qty: num(r.qty),
          has_acrylic: r.hasAcrylic,
          color: r.color,
          rate: num(r.rate),
          acrylic_rate: r.hasAcrylic ? num(r.acrylicRate) : null,
          unit_price: price.unit,
          total_price: price.total,
        };
      });

      const { error: itemsErr } = await supabase
        .from("box_items")
        .insert(itemsPayload);
      if (itemsErr) throw itemsErr;

      setSaveState("saved");
      if (onSaved) setTimeout(() => onSaved(), 900);
    } catch (err) {
      console.error(err);
      setSaveState("error");
      setSaveError(
        err.message || "Couldn't save. Check your connection and try again.",
      );
    }
  }

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
    <div style={{ ...pageStyle, paddingBottom: 100 }}>
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <div style={{ padding: "10px 6px 18px" }}>
          {onBack && (
            <button onClick={onBack} style={backBtnStyle}>
              <ArrowLeft size={14} /> back
            </button>
          )}
          <h1 style={titleStyle}>Verify Boxes</h1>
          <p style={subtitleStyle}>check the numbers, then save</p>
        </div>

        <div style={cardStyle}>
          <div style={sectionLabelStyle}>This batch</div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Vendor</label>
              <SelectField
                value={batchVendor}
                onChange={(v) => setBatchVendor(v)}
                options={vendors.map((v) => ({ value: v.id, label: v.name }))}
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
          <div style={{ fontSize: 11, color: COLORS_UI.inkSoft, marginTop: 8 }}>
            Applies to new boxes below — override per box if needed.
          </div>
        </div>

        {rows.map((row, idx) => {
          const price = computePrice(row);
          return (
            <div key={row.id} style={cardStyle}>
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
                    fontWeight: 700,
                    color: COLORS_UI.accentDark,
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
                    color:
                      rows.length === 1
                        ? "rgba(28,28,30,0.25)"
                        : COLORS_UI.accent,
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
                    background: "rgba(255,255,255,0.35)",
                    border: "1px solid rgba(28,28,30,0.12)",
                    borderRadius: 12,
                    padding: "9px 11px",
                    height: 41,
                    boxSizing: "border-box",
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

              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Vendor</label>
                <SelectField
                  value={row.vendor}
                  onChange={(v) => changeRowVendor(row.id, v)}
                  options={vendors.map((v) => ({ value: v.id, label: v.name }))}
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
                  borderTop: "1px dashed rgba(28,28,30,0.15)",
                  paddingTop: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                <span style={{ fontSize: 11.5, color: COLORS_UI.inkSoft }}>
                  {fmt(price.unit)} &times; {num(row.qty)}
                </span>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: COLORS_UI.accentDark,
                  }}
                >
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
            padding: "13px",
            borderRadius: 16,
            border: "1.5px dashed rgba(255,255,255,0.65)",
            background: "rgba(255,255,255,0.18)",
            color: "#fff",
            fontWeight: 700,
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

      {/* Sticky glass total bar */}
      <div style={stickyBar}>
        <div>
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.75)",
              letterSpacing: 1,
            }}
          >
            {totals.boxes} box{totals.boxes === 1 ? "" : "es"} &middot;{" "}
            {vendors.find((v) => v.id === batchVendor)?.name || "no vendor"}
          </div>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 22,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {fmt(totals.amount)}
          </div>
        </div>
        <button
          style={{
            background:
              saveState === "saved" ? "var(--ok-grad)" : "var(--accent-grad)",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            padding: "12px 22px",
            fontWeight: 700,
            fontSize: 14,
            cursor: saveState === "saving" ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            opacity: saveState === "saving" ? 0.7 : 1,
            boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
          }}
          disabled={saveState === "saving"}
          onClick={handleSave}
        >
          {saveState === "saving" && "Saving…"}
          {saveState === "saved" && (
            <>
              <Check size={16} /> Saved
            </>
          )}
          {(saveState === "idle" || saveState === "error") && "Save batch"}
        </button>
      </div>

      {saveState === "error" && (
        <div
          style={{
            position: "fixed",
            bottom: 78,
            left: 12,
            right: 12,
            maxWidth: 436,
            margin: "0 auto",
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(16px)",
            border: `1.5px solid ${COLORS_UI.accent}`,
            borderRadius: 12,
            padding: "10px 14px",
            fontSize: 12.5,
            color: COLORS_UI.ink,
          }}
        >
          {saveError}
        </div>
      )}
    </div>
  );
}

const stickyBar = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  background: "rgba(28,28,30,0.6)",
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  borderTop: "1px solid rgba(255,255,255,0.14)",
  padding: "12px 18px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
