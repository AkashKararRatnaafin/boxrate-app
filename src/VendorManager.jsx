import React, { useEffect, useState } from "react";
import { Trash2, Plus, ArrowLeft, Store, Check } from "lucide-react";
import {
  fetchVendors,
  createVendor,
  deleteVendor,
  updateVendorRate,
  pageStyle,
  cardStyle,
  inputStyle,
  labelStyle,
  primaryBtn,
  COLORS_UI,
} from "./shared.jsx";

export default function VendorManager({ onBack }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newRate, setNewRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingRates, setEditingRates] = useState({}); // vendorId -> draft string
  const [savedFlash, setSavedFlash] = useState(null); // vendorId briefly shown as saved

  async function load() {
    setLoading(true);
    try {
      setVendors(await fetchVendors());
    } catch (err) {
      setError("Couldn't load vendors: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    setError("");
    try {
      const v = await createVendor(name, newRate === "" ? null : parseFloat(newRate));
      setVendors((vs) => [...vs, v].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setNewRate("");
    } catch (err) {
      setError(
        err.message?.includes("duplicate")
          ? "That vendor already exists."
          : "Couldn't add vendor: " + err.message
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteVendor(id);
      setVendors((vs) => vs.filter((v) => v.id !== id));
    } catch (err) {
      setError("Couldn't delete: " + err.message);
    }
  }

  async function handleRateSave(id) {
    const draft = editingRates[id];
    const rate = draft === "" || draft === undefined ? null : parseFloat(draft);
    try {
      const updated = await updateVendorRate(id, rate);
      setVendors((vs) => vs.map((v) => (v.id === id ? updated : v)));
      setSavedFlash(id);
      setTimeout(() => setSavedFlash(null), 1000);
    } catch (err) {
      setError("Couldn't update rate: " + err.message);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <div style={{ padding: "10px 6px 18px" }}>
          {onBack && (
            <button onClick={onBack} style={backBtn}>
              <ArrowLeft size={14} /> back
            </button>
          )}
          <h1 style={titleStyle}>Vendors</h1>
          <p style={subtitleStyle}>who your boxes come from</p>
        </div>

        <div style={cardStyle}>
          <label style={labelStyle}>New vendor</label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Vendor name"
            style={{ ...inputStyle, marginBottom: 8 }}
          />
          <label style={labelStyle}>Default rate / sq.in (optional)</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="number"
              inputMode="decimal"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              placeholder="e.g. 2"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={handleAdd}
              disabled={saving || !newName.trim()}
              style={{ ...primaryBtn, width: 52, padding: 0, borderRadius: 12 }}
            >
              <Plus size={19} />
            </button>
          </div>
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
        ) : vendors.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: "center", color: COLORS_UI.inkSoft }}>
            <Store size={22} style={{ marginBottom: 6 }} />
            <div>No vendors yet. Add your first one above.</div>
          </div>
        ) : (
          vendors.map((v) => {
            const draft = editingRates[v.id] ?? (v.default_rate ?? "");
            const dirty = String(draft) !== String(v.default_rate ?? "");
            return (
              <div key={v.id} style={{ ...cardStyle, padding: "13px 16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{v.name}</span>
                  <button
                    onClick={() => handleDelete(v.id)}
                    style={{ background: "none", border: "none", color: COLORS_UI.accent, cursor: "pointer" }}
                    aria-label={`Delete ${v.name}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Default rate / sq.in</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={draft}
                      onChange={(e) =>
                        setEditingRates((r) => ({ ...r, [v.id]: e.target.value }))
                      }
                      placeholder="not set"
                      style={inputStyle}
                    />
                  </div>
                  {dirty && (
                    <button
                      onClick={() => handleRateSave(v.id)}
                      style={{
                        ...primaryBtn,
                        width: 42,
                        height: 38,
                        padding: 0,
                        borderRadius: 10,
                      }}
                      aria-label="Save rate"
                    >
                      <Check size={17} />
                    </button>
                  )}
                  {savedFlash === v.id && !dirty && (
                    <span style={{ fontSize: 11, color: COLORS_UI.ok, fontWeight: 700, paddingBottom: 10 }}>
                      saved
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const titleStyle = {
  fontFamily: "'Special Elite', monospace",
  fontSize: 27,
  margin: "0 0 2px",
  letterSpacing: 1,
  color: "#fff",
  textShadow: "0 2px 12px rgba(0,0,0,0.15)",
};

const subtitleStyle = {
  margin: 0,
  fontSize: 12,
  letterSpacing: 2,
  textTransform: "uppercase",
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
