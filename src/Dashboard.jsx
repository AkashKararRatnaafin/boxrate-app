import React, { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Package, TrendingUp, Calendar } from "lucide-react";
import { supabase } from "./supabaseClient.js";
import { fmt, fetchVendors, pageStyle, cardStyle, inputStyle, labelStyle, SelectField } from "./shared.jsx";

export default function Dashboard({ onBack }) {
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
            <button onClick={onBack} style={backBtn}>
              <ArrowLeft size={14} /> back
            </button>
          )}
          <h1 style={titleStyle}>Dashboard</h1>
          <p style={subtitleStyle}>sales by vendor</p>
        </div>

        {error && (
          <div style={{ ...cardStyle, border: "1.5px solid #B23A2E", fontSize: 13 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ ...cardStyle, textAlign: "center", color: "#6B5A45" }}>
            Loading…
          </div>
        ) : (
          <>
            {/* Vendor totals */}
            <div style={cardStyle}>
              <div style={sectionLabel}>
                <TrendingUp size={13} /> Totals by vendor
              </div>
              {vendorSummary.length === 0 ? (
                <div style={{ fontSize: 13, color: "#6B5A45" }}>No sales yet.</div>
              ) : (
                vendorSummary.map((v) => (
                  <div
                    key={v.vendor_id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 0",
                      borderTop: "1px dashed rgba(43,33,24,0.18)",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{v.vendor_name}</div>
                      <div style={{ fontSize: 11.5, color: "#6B5A45" }}>
                        {v.order_count} order{v.order_count === 1 ? "" : "s"} &middot;{" "}
                        {v.total_boxes} boxes
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 17,
                        fontWeight: 600,
                        color: "#8E2C22",
                      }}
                    >
                      {fmt(v.total_sales)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Filters */}
            <div style={cardStyle}>
              <div style={sectionLabel}>
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

            {/* Order history */}
            <div style={cardStyle}>
              <div style={sectionLabel}>
                <Package size={13} /> Order history
              </div>
              {filteredBatches.length === 0 ? (
                <div style={{ fontSize: 13, color: "#6B5A45" }}>
                  No orders match this filter.
                </div>
              ) : (
                <>
                  {filteredBatches.map((b) => (
                    <div
                      key={b.batch_id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 0",
                        borderTop: "1px dashed rgba(43,33,24,0.18)",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                          {b.vendor_name || "Unknown vendor"}
                        </div>
                        <div style={{ fontSize: 11, color: "#6B5A45" }}>
                          {b.batch_date} &middot; {b.box_count} boxes
                        </div>
                      </div>
                      <div
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 14.5,
                          fontWeight: 600,
                        }}
                      >
                        {fmt(b.total_price)}
                      </div>
                    </div>
                  ))}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingTop: 10,
                      marginTop: 4,
                      borderTop: "1.5px solid rgba(43,33,24,0.3)",
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

const titleStyle = {
  fontFamily: "'Special Elite', monospace",
  fontSize: 26,
  margin: "0 0 2px",
  letterSpacing: 1,
};

const subtitleStyle = {
  margin: 0,
  fontSize: 12,
  letterSpacing: 2,
  textTransform: "uppercase",
  color: "#6B5A45",
  fontWeight: 600,
};

const backBtn = {
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
};

const sectionLabel = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 11,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  color: "#6B5A45",
  marginBottom: 10,
  display: "flex",
  alignItems: "center",
  gap: 6,
};
