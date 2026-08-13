import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Package,
  Pencil,
  Trash2,
  Plus,
  Printer,
  Check,
  X,
} from "lucide-react";
import { supabase } from "./supabaseClient.js";
import {
  fmt,
  num,
  computePrice,
  fetchVendors,
  COLORS,
  pageStyle,
  cardStyle,
  labelStyle,
  NumField,
  SelectField,
  Toggle,
  titleStyle,
  subtitleStyle,
  backBtnStyle,
  primaryBtn,
  secondaryBtn,
  dangerBtn,
  COLORS_UI,
} from "./shared.jsx";

function vendorRate(vendors, vendorId, fallback) {
  const v = vendors.find((v) => v.id === vendorId);
  if (v && v.default_rate !== null && v.default_rate !== undefined)
    return v.default_rate;
  return fallback;
}

function toEditRow(item) {
  return {
    id: item.id, // real DB id — present means this row already exists in the database
    height: item.height,
    length: item.length,
    width: item.width,
    qty: item.qty,
    hasAcrylic: item.has_acrylic,
    color: item.color || "Blue",
    vendor: item.vendor_id,
    rate: item.rate,
    acrylicRate: item.acrylic_rate ?? 0.6,
  };
}

export default function BatchDetail({ batchId, onBack, onDeleted }) {
  const [batch, setBatch] = useState(null);
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editRows, setEditRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deletingBatch, setDeletingBatch] = useState(false);
  const tempIdRef = useRef(0);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [batchRes, itemsRes, vs] = await Promise.all([
        supabase
          .from("batches")
          .select("id, batch_date, vendor_id, vendors(name)")
          .eq("id", batchId)
          .single(),
        supabase
          .from("box_items")
          .select("*")
          .eq("batch_id", batchId)
          .order("created_at"),
        fetchVendors(),
      ]);
      if (batchRes.error) throw batchRes.error;
      if (itemsRes.error) throw itemsRes.error;
      setBatch(batchRes.data);
      setItems(itemsRes.data);
      setVendors(vs);
    } catch (err) {
      setError(err.message || "Couldn't load this batch.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  function startEditing() {
    setEditRows(items.map(toEditRow));
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditRows([]);
  }

  function updateEditRow(id, patch) {
    setEditRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function changeRowVendor(id, vendorId) {
    const rate = vendorRate(
      vendors,
      vendorId,
      editRows.find((r) => r.id === id)?.rate,
    );
    updateEditRow(id, { vendor: vendorId, rate });
  }

  function addBlankRow() {
    const tempId = `new-${tempIdRef.current++}`;
    const rate = vendorRate(vendors, batch?.vendor_id, 2.5);
    setEditRows((rs) => [
      ...rs,
      {
        id: tempId,
        height: 5,
        length: 5,
        width: 3,
        qty: 1,
        hasAcrylic: false,
        color: "Blue",
        vendor: batch?.vendor_id || "",
        rate,
        acrylicRate: 0.6,
      },
    ]);
  }

  async function deleteRow(id) {
    const isNew = String(id).startsWith("new-");
    if (isNew) {
      setEditRows((rs) => rs.filter((r) => r.id !== id));
      return;
    }
    if (!window.confirm("Delete this box from the batch?")) return;
    try {
      const { error } = await supabase.from("box_items").delete().eq("id", id);
      if (error) throw error;
      setEditRows((rs) => rs.filter((r) => r.id !== id));
      setItems((its) => its.filter((it) => it.id !== id));
    } catch (err) {
      setError("Couldn't delete box: " + err.message);
    }
  }

  async function saveChanges() {
    setSaving(true);
    setError("");
    try {
      for (const row of editRows) {
        const price = computePrice(row);
        const payload = {
          batch_id: batchId,
          vendor_id: row.vendor || batch.vendor_id,
          height: num(row.height),
          length: num(row.length),
          width: num(row.width),
          qty: num(row.qty),
          has_acrylic: row.hasAcrylic,
          color: row.color,
          rate: num(row.rate),
          acrylic_rate: row.hasAcrylic ? num(row.acrylicRate) : null,
          unit_price: price.unit,
          total_price: price.total,
        };
        const isNew = String(row.id).startsWith("new-");
        if (isNew) {
          const { error } = await supabase.from("box_items").insert(payload);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("box_items")
            .update(payload)
            .eq("id", row.id);
          if (error) throw error;
        }
      }
      await load();
      setIsEditing(false);
      setEditRows([]);
    } catch (err) {
      setError("Couldn't save changes: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBatch() {
    if (
      !window.confirm(
        "Delete this entire batch and all its boxes? This can't be undone.",
      )
    )
      return;
    setDeletingBatch(true);
    try {
      const { error } = await supabase
        .from("batches")
        .delete()
        .eq("id", batchId);
      if (error) throw error;
      onDeleted();
    } catch (err) {
      setError("Couldn't delete batch: " + err.message);
      setDeletingBatch(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  const total = items.reduce((sum, it) => sum + Number(it.total_price || 0), 0);
  const boxCount = items.reduce((sum, it) => sum + Number(it.qty || 0), 0);

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <div style={{ padding: "10px 6px 18px" }} className="no-print">
          <button onClick={onBack} style={backBtnStyle}>
            <ArrowLeft size={14} /> back to dashboard
          </button>
        </div>

        <div
          style={{
            padding: "0 6px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div>
            <h1 style={titleStyle}>{batch?.vendors?.name || "Batch"}</h1>
            <p style={subtitleStyle}>{batch?.batch_date}</p>
          </div>
          {!isEditing && !loading && (
            <div className="no-print" style={{ display: "flex", gap: 8 }}>
              <IconBtn onClick={handlePrint} aria-label="Print">
                <Printer size={16} />
              </IconBtn>
              <IconBtn onClick={startEditing} aria-label="Edit">
                <Pencil size={16} />
              </IconBtn>
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              ...cardStyle,
              border: `1.5px solid ${COLORS_UI.accent}`,
              fontSize: 13,
            }}
            className="no-print"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div
            style={{
              ...cardStyle,
              textAlign: "center",
              color: COLORS_UI.inkSoft,
            }}
          >
            Loading…
          </div>
        ) : isEditing ? (
          <>
            {editRows.map((row, idx) => (
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
                    style={{
                      background: "none",
                      border: "none",
                      color: COLORS_UI.accent,
                      cursor: "pointer",
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
                    onChange={(v) => updateEditRow(row.id, { height: v })}
                  />
                  <NumField
                    label="Length"
                    value={row.length}
                    onChange={(v) => updateEditRow(row.id, { length: v })}
                  />
                  <NumField
                    label="Width"
                    value={row.width}
                    onChange={(v) => updateEditRow(row.id, { width: v })}
                  />
                  <NumField
                    label="Qty"
                    value={row.qty}
                    onChange={(v) => updateEditRow(row.id, { qty: v })}
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
                      background: "var(--input-bg)",
                      border: "1px solid var(--input-border)",
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
                      onChange={(v) => updateEditRow(row.id, { hasAcrylic: v })}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Color</label>
                    <SelectField
                      value={row.color}
                      onChange={(v) => updateEditRow(row.id, { color: v })}
                      options={COLORS}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Vendor</label>
                  <SelectField
                    value={row.vendor}
                    onChange={(v) => changeRowVendor(row.id, v)}
                    options={vendors.map((v) => ({
                      value: v.id,
                      label: v.name,
                    }))}
                  />
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <NumField
                    label="Rate / sq.in"
                    value={row.rate}
                    onChange={(v) => updateEditRow(row.id, { rate: v })}
                  />
                  <NumField
                    label="Acrylic rate"
                    value={row.acrylicRate}
                    onChange={(v) => updateEditRow(row.id, { acrylicRate: v })}
                    disabled={!row.hasAcrylic}
                  />
                </div>

                <div
                  style={{
                    borderTop: "1px dashed var(--input-border)",
                    paddingTop: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {(() => {
                    const p = computePrice(row);
                    return (
                      <>
                        <span
                          style={{ fontSize: 11.5, color: COLORS_UI.inkSoft }}
                        >
                          {fmt(p.unit)} &times; {num(row.qty)}
                        </span>
                        <span style={{ fontSize: 16, fontWeight: 700 }}>
                          {fmt(p.total)}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
            ))}

            <button
              onClick={addBlankRow}
              style={{ ...secondaryBtn, marginBottom: 12 }}
            >
              <Plus size={17} /> Add box
            </button>

            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button
                onClick={cancelEditing}
                style={{ ...secondaryBtn, flex: 1 }}
                disabled={saving}
              >
                <X size={16} /> Cancel
              </button>
              <button
                onClick={saveChanges}
                style={{ ...primaryBtn, flex: 1.4 }}
                disabled={saving}
              >
                {saving ? (
                  "Saving…"
                ) : (
                  <>
                    <Check size={16} /> Save changes
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleDeleteBatch}
              style={dangerBtn}
              disabled={deletingBatch}
            >
              <Trash2 size={16} />{" "}
              {deletingBatch ? "Deleting…" : "Delete entire batch"}
            </button>
          </>
        ) : (
          <>
            <div
              style={{
                ...cardStyle,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Package size={16} color={COLORS_UI.inkSoft} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {boxCount} boxes
                </span>
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 19,
                  fontWeight: 700,
                  color: COLORS_UI.accentDark,
                }}
              >
                {fmt(total)}
              </div>
            </div>

            {items.map((it, idx) => (
              <div key={it.id} style={cardStyle}>
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    color: COLORS_UI.accentDark,
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  BOX {idx + 1}
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.7 }}>
                  <div>
                    <b>{it.height}</b>H &times; <b>{it.length}</b>L &times;{" "}
                    <b>{it.width}</b>W in, qty <b>{it.qty}</b>
                  </div>
                  <div style={{ color: COLORS_UI.inkSoft, fontSize: 12.5 }}>
                    {it.color || "—"} &middot;{" "}
                    {it.has_acrylic
                      ? `Acrylic @ ${it.acrylic_rate}/sq.in`
                      : "No acrylic"}{" "}
                    &middot; Rate {it.rate}/sq.in
                  </div>
                </div>
                <div
                  style={{
                    borderTop: "1px dashed var(--input-border)",
                    marginTop: 8,
                    paddingTop: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  <span style={{ fontSize: 11.5, color: COLORS_UI.inkSoft }}>
                    {fmt(it.unit_price)} &times; {it.qty}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>
                    {fmt(it.total_price)}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function IconBtn({ children, ...props }) {
  return (
    <button
      {...props}
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: "1px solid var(--card-border)",
        background: "var(--card-bg)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        color: "var(--ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
