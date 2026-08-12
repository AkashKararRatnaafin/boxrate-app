import React, { useEffect, useState } from "react";
import { Trash2, Plus, ArrowLeft, Store } from "lucide-react";
import { fetchVendors, createVendor, deleteVendor, pageStyle, cardStyle, inputStyle } from "./shared.jsx";

export default function VendorManager({ onBack }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      const v = await createVendor(name);
      setVendors((vs) => [...vs, v].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
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
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="New vendor name"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={handleAdd} disabled={saving || !newName.trim()} style={addBtn}>
              <Plus size={18} />
            </button>
          </div>
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
        ) : vendors.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: "center", color: "#6B5A45" }}>
            <Store size={22} style={{ marginBottom: 6 }} />
            <div>No vendors yet. Add your first one above.</div>
          </div>
        ) : (
          vendors.map((v) => (
            <div
              key={v.id}
              style={{
                ...cardStyle,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 14.5 }}>{v.name}</span>
              <button
                onClick={() => handleDelete(v.id)}
                style={{ background: "none", border: "none", color: "#B23A2E", cursor: "pointer" }}
                aria-label={`Delete ${v.name}`}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))
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

const addBtn = {
  background: "#B23A2E",
  color: "#fff",
  border: "none",
  borderRadius: 7,
  width: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};
