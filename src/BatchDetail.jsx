import React, { useEffect, useState } from "react";
import { ArrowLeft, Package } from "lucide-react";
import { supabase } from "./supabaseClient.js";
import { fmt, pageStyle, cardStyle, COLORS_UI } from "./shared.jsx";

export default function BatchDetail({ batchId, onBack }) {
  const [batch, setBatch] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [batchRes, itemsRes] = await Promise.all([
          supabase
            .from("batches")
            .select("id, batch_date, vendors(name)")
            .eq("id", batchId)
            .single(),
          supabase
            .from("box_items")
            .select("*")
            .eq("batch_id", batchId)
            .order("created_at"),
        ]);
        if (batchRes.error) throw batchRes.error;
        if (itemsRes.error) throw itemsRes.error;
        setBatch(batchRes.data);
        setItems(itemsRes.data);
      } catch (err) {
        setError(err.message || "Couldn't load this batch.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [batchId]);

  const total = items.reduce((sum, it) => sum + Number(it.total_price || 0), 0);
  const boxCount = items.reduce((sum, it) => sum + Number(it.qty || 0), 0);

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <div style={{ padding: "10px 6px 18px" }}>
          <button onClick={onBack} style={backBtn}>
            <ArrowLeft size={14} /> back to dashboard
          </button>
          <h1 style={titleStyle}>{batch?.vendors?.name || "Batch"}</h1>
          <p style={subtitleStyle}>{batch?.batch_date}</p>
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
            <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Package size={16} color={COLORS_UI.inkSoft} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{boxCount} boxes</span>
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 19, fontWeight: 700, color: COLORS_UI.accentDark }}>
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
                    <b>{it.height}</b>H &times; <b>{it.length}</b>L &times; <b>{it.width}</b>W in,
                    qty <b>{it.qty}</b>
                  </div>
                  <div style={{ color: COLORS_UI.inkSoft, fontSize: 12.5 }}>
                    {it.color || "—"} &middot;{" "}
                    {it.has_acrylic ? `Acrylic @ ${it.acrylic_rate}/sq.in` : "No acrylic"} &middot;
                    Rate {it.rate}/sq.in
                  </div>
                </div>
                <div
                  style={{
                    borderTop: "1px dashed rgba(28,28,30,0.15)",
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
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{fmt(it.total_price)}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

const titleStyle = {
  fontFamily: "'Special Elite', monospace",
  fontSize: 25,
  margin: "0 0 2px",
  letterSpacing: 1,
  color: "#fff",
  textShadow: "0 2px 12px rgba(0,0,0,0.15)",
};

const subtitleStyle = {
  margin: 0,
  fontSize: 12,
  letterSpacing: 1,
  color: "rgba(255,255,255,0.85)",
  fontWeight: 600,
};

const backBtn = {
  background: "none",
  border: "none",
  display: "flex",
  alignItems: "center",
  gap: 4,
  color: "rgba(255,255,255,0.9)",
  fontSize: 12,
  fontWeight: 700,
  padding: 0,
  marginBottom: 8,
  cursor: "pointer",
};
