import React, { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Package, TrendingUp, Calendar, ChevronRight, Trash2 } from "lucide-react";
import { supabase } from "./supabaseClient.js";
import {
  fmt,
  fetchVendors,
  pageStyle,
  cardStyle,
  inputStyle,
  labelStyle,
  SelectField,
  COLORS_UI,
  titleStyle,
  subtitleStyle,
  backBtnStyle,
  sectionLabelStyle,
} from "./shared.jsx";

export default function Dashboard({ onBack, onOpenBatch }) {
  const [vendors, setVendors] = useState([]);
  const [vendorSummary, setVendorSummary] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [vs, summaryRes, batchesRes] = await Promise.all([
        fetchVendors(),
        supabase.from("vendor_sales_summary").select("*").order("total_sales", { ascending: false }),
        supabase.from("batch_summary").select("*").order("batch_date", { ascending: false }),
      ]);
      if (summaryRes.error) throw summaryRes.error;
      if (batchesRes.error) throw batchesRes.error;
      setVendors(vs);
      setVendorSummary(summaryRes.data);
      setBatches(batchesRes.data);
    } catch (err) {
      setError(err.message || "Couldn't load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDeleteBatch(batchId) {
    if (!window.confirm("Delete this order and all its boxes? This can't be undone.")) return;
    setError("");
    try {
      const { error } = await supabase.from("batches").delete().eq("id", batchId);
      if (error) throw error;
      await load();
    } catch (err) {
      setError("Couldn't delete order: " + err.message);
    }
  }

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if (vendorFilter !== "all" && b.vendor_id !== vendorFilter) return false;
      if (fromDate && b.batch_date < fromDate) return false;
      if (toDate && b.batch_date > toDate) return false;
      return true;
    });
  }, [batches, vendorFilter, fromDate, toDate]);

  const filteredTotals = filteredBatches.reduce(
    (acc, b) => {
      acc.boxes += Number(b.box_count) || 0;
      acc.amount += Number(b.total_price) || 0;
      return acc;
    },
    { boxes: 0, amount: 0 }
  );

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <div style={{ padding: "10px 6px 18px" }}>
          {onBack && (
            <button onClick={onBack} style={backBtnStyle}>
              <ArrowLeft size={14} /> back
            </button>
          )}
          <h1 style={titleStyle}>Dashboard</h1>
          <p style={subtitleStyle}>sales by vendor</p>
        </div>

        {error && (
          <div style={{ ...cardStyle, border: `1.5px solid ${COLORS_UI.accent}`, fontSize: 13 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ ...cardStyle, textAlign: "center", color: COLORS_UI.inkSoft }}>
            Loading…
          </div>
        ) : (
          <>
            <div style={cardStyle}>
              <div style={sectionLabelStyle}>
                <TrendingUp size={13} /> Totals by vendor
              </div>
              {vendorSummary.length === 0 ? (
                <div style={{ fontSize: 13, color: COLORS_UI.inkSoft }}>No sales yet.</div>
              ) : (
                vendorSummary.map((v) => (
                  <div
                    key={v.vendor_id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 0",
                      borderTop: "1px dashed rgba(28,28,30,0.14)",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{v.vendor_name}</div>
                      <div style={{ fontSize: 11.5, color: COLORS_UI.inkSoft }}>
                        {v.order_count} order{v.order_count === 1 ? "" : "s"} &middot;{" "}
                        {v.total_boxes} boxes
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 17,
                        fontWeight: 700,
                        color: COLORS_UI.accentDark,
                      }}
                    >
                      {fmt(v.total_sales)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={cardStyle}>
              <div style={sectionLabelStyle}>
                <Calendar size={13} /> Filter orders
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Vendor</label>
                <SelectField
                  value={vendorFilter}
                  onChange={setVendorFilter}
                  options={[
                    { value: "all", label: "All vendors" },
                    ...vendors.map((v) => ({ value: v.id, label: v.name })),
                  ]}
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>From</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>To</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={sectionLabelStyle}>
                <Package size={13} /> Order history
              </div>
              <div style={{ fontSize: 11, color: COLORS_UI.inkSoft, marginTop: -6, marginBottom: 8 }}>
                Tap an order to see every box in it.
              </div>
              {filteredBatches.length === 0 ? (
                <div style={{ fontSize: 13, color: COLORS_UI.inkSoft }}>
                  No orders match this filter.
                </div>
              ) : (
                <>
                  {filteredBatches.map((b) => (
                    <div
                      key={b.batch_id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "10px 0",
                        borderTop: "1px dashed rgba(28,28,30,0.14)",
                      }}
                    >
                      <button
                        onClick={() => onOpenBatch(b.batch_id)}
                        style={{
                          flex: 1,
                          background: "none",
                          border: "none",
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: 0,
                          minWidth: 0,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13.5, color: COLORS_UI.ink }}>
                            {b.vendor_name || "Unknown vendor"}
                          </div>
                          <div style={{ fontSize: 11, color: COLORS_UI.inkSoft }}>
                            {b.batch_date} &middot; {b.box_count} boxes
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                          <div
                            style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 14.5,
                              fontWeight: 700,
                              color: COLORS_UI.ink,
                            }}
                          >
                            {fmt(b.total_price)}
                          </div>
                          <ChevronRight size={15} color={COLORS_UI.inkSoft} />
                        </div>
                      </button>
                      <button
                        onClick={() => handleDeleteBatch(b.batch_id)}
                        aria-label="Delete order"
                        style={{
                          background: "none",
                          border: "none",
                          color: COLORS_UI.accent,
                          cursor: "pointer",
                          padding: "4px 2px 4px 6px",
                          flexShrink: 0,
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingTop: 10,
                      marginTop: 4,
                      borderTop: "1.5px solid rgba(28,28,30,0.25)",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    <span>{filteredTotals.boxes} boxes total</span>
                    <span style={{ fontFamily: "'DM Mono', monospace" }}>
                      {fmt(filteredTotals.amount)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}




