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
  TextField,
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

function vendorAcrylicRate(vendors, vendorId, fallback) {
  const v = vendors.find((v) => v.id === vendorId);
  if (
    v &&
    v.default_acrylic_rate !== null &&
    v.default_acrylic_rate !== undefined
  )
    return v.default_acrylic_rate;
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
    description: defaults.description ?? "",
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
  const [existingOrder, setExistingOrder] = useState(null); // { box_count, total_price } | null
  const nextId = useRef(0);
  const lastRates = useRef({ rate: 2.5, acrylicRate: 0.6 });

  useEffect(() => {
    fetchVendors().then((vs) => {
      setVendors(vs);
      if (!batchVendor && vs.length > 0) setBatchVendor(vs[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever the vendor or date for this batch changes, check whether an
  // order already exists for that exact combo — if so these boxes will be
  // added to it rather than starting a new one, so let the user know upfront.
  useEffect(() => {
    if (!batchVendor || !batchDate) {
      setExistingOrder(null);
      return;
    }
    let cancelled = false;
    supabase
      .from("order_summary")
      .select("box_count, total_price")
      .eq("vendor_id", batchVendor)
      .eq("batch_date", batchDate)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setExistingOrder(data || null);
      });
    return () => {
      cancelled = true;
    };
  }, [batchVendor, batchDate]);

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
          description: r.description || "",
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
  // rate to those rows once, the first moment vendors are available. This
  // never runs again after that, so it won't clobber a per-row vendor/rate
  // the person deliberately changed afterward.
  const appliedInitialRate = useRef(false);
  useEffect(() => {
    if (vendors.length === 0 || appliedInitialRate.current) return;
    appliedInitialRate.current = true;
    setRows((rs) =>
      rs.map((r) => {
        const targetVendor = r.vendor || batchVendor;
        const rate = vendorRate(vendors, targetVendor, r.rate);
        const acrylicRate = vendorAcrylicRate(
          vendors,
          targetVendor,
          r.acrylicRate,
        );
        return { ...r, vendor: r.vendor || batchVendor, rate, acrylicRate };
      }),
    );
    const v = vendors.find((v) => v.id === batchVendor);
    if (v && v.default_rate !== null && v.default_rate !== undefined) {
      lastRates.current.rate = v.default_rate;
    }
    if (
      v &&
      v.default_acrylic_rate !== null &&
      v.default_acrylic_rate !== undefined
    ) {
      lastRates.current.acrylicRate = v.default_acrylic_rate;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors, batchVendor]);

  const updateRow = (id, patch) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    if (patch.rate !== undefined) lastRates.current.rate = patch.rate;
    if (patch.acrylicRate !== undefined)
      lastRates.current.acrylicRate = patch.acrylicRate;
  };

  // Changing a row's own vendor is a deliberate per-box override — snap both
  // rates to that vendor's defaults (if set) so "pick vendor, rates follow"
  // works per box too, same as it does at the batch level.
  const changeRowVendor = (id, vendorId) => {
    const rate = vendorRate(vendors, vendorId, lastRates.current.rate);
    const acrylicRate = vendorAcrylicRate(
      vendors,
      vendorId,
      lastRates.current.acrylicRate,
    );
    updateRow(id, { vendor: vendorId, rate, acrylicRate });
  };

  const addRow = () => {
    const id = nextId.current++;
    const rate = vendorRate(vendors, batchVendor, lastRates.current.rate);
    const acrylicRate = vendorAcrylicRate(
      vendors,
      batchVendor,
      lastRates.current.acrylicRate,
    );
    setRows((rs) => [
      ...rs,
      makeRow(id, { vendor: batchVendor, rate, acrylicRate }),
    ]);
  };

  const deleteRow = (id) => {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : rs));
  };

  async function handleSave() {
    const missingVendor = rows.some((r) => !(r.vendor || batchVendor));
    if (missingVendor) {
      setSaveError(
        "Every box needs a vendor — pick one for the batch, or per box.",
      );
      setSaveState("error");
      return;
    }
    setSaveState("saving");
    setSaveError("");
    try {
      // The "batches" row is just a technical container for this scan session —
      // it no longer determines vendor grouping (each box carries its own
      // vendor_id + batch_date for that). Reuse a container for the same date
      // if one exists, so we don't pile up empty rows unnecessarily.
      const { data: existing, error: findErr } = await supabase
        .from("batches")
        .select("id")
        .eq("batch_date", batchDate)
        .limit(1)
        .maybeSingle();
      if (findErr) throw findErr;

      let batchId;
      if (existing) {
        batchId = existing.id;
      } else {
        const { data: batch, error: batchErr } = await supabase
          .from("batches")
          .insert({ vendor_id: batchVendor, batch_date: batchDate })
          .select("id")
          .single();
        if (batchErr) throw batchErr;
        batchId = batch.id;
      }

      const itemsPayload = rows.map((r) => {
        const price = computePrice(r);
        return {
          batch_id: batchId,
          vendor_id: r.vendor || batchVendor,
          batch_date: batchDate,
          height: num(r.height),
          length: num(r.length),
          width: num(r.width),
          qty: num(r.qty),
          has_acrylic: r.hasAcrylic,
          color: r.color,
          description: r.description || null,
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
          <div style={sectionLabelStyle}>Date</div>
          <input
            type="date"
            value={batchDate}
            onChange={(e) => setBatchDate(e.target.value)}
            style={inputStyle}
          />
          <div style={{ fontSize: 11, color: COLORS_UI.inkSoft, marginTop: 8 }}>
            Applies to every box below. Vendor is set per box further down.
          </div>
        </div>

        {existingOrder && (
          <div
            style={{
              ...cardStyle,
              background: "rgba(76,107,76,0.14)",
              border: "1px solid var(--ok)",
              fontSize: 12.5,
              color: COLORS_UI.ink,
            }}
          >
            <b>Adding to an existing order.</b> This vendor already has{" "}
            <b>{existingOrder.box_count} boxes</b> (
            {fmt(existingOrder.total_price)}) saved for {batchDate}. The boxes
            below will be added to that same order, not a new one.
          </div>
        )}

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
                  {row.description && (
                    <span
                      style={{
                        color: COLORS_UI.ink,
                        fontWeight: 600,
                        marginLeft: 6,
                      }}
                    >
                      — {row.description}
                    </span>
                  )}
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

              <div style={{ marginBottom: 10 }}>
                <TextField
                  label="Description (optional)"
                  value={row.description}
                  onChange={(v) => updateRow(row.id, { description: v })}
                  placeholder="e.g. Silver glasses box"
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
            {(() => {
              const distinctVendors = [
                ...new Set(rows.map((r) => r.vendor || batchVendor)),
              ];
              if (distinctVendors.length === 1) {
                return (
                  vendors.find((v) => v.id === distinctVendors[0])?.name ||
                  "no vendor"
                );
              }
              return `${distinctVendors.length} vendors`;
            })()}
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
