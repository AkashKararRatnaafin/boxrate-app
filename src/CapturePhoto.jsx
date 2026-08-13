import React, { useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon, ArrowRight, AlertCircle, Store } from "lucide-react";
import { supabase } from "./supabaseClient.js";
import {
  fetchVendors,
  labelStyle,
  pageStyle,
  cardStyle,
  SelectField,
  primaryBtn,
  secondaryBtn,
  titleStyle,
  subtitleStyle,
  COLORS_UI,
} from "./shared.jsx";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.substring(result.indexOf(",") + 1);
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// onExtracted(rows, vendorId) — rows are raw extraction objects, or null to skip straight to manual entry
export default function CapturePhoto({ onExtracted, onManageVendors }) {
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [vendor, setVendor] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [errorMsg, setErrorMsg] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    fetchVendors()
      .then((vs) => {
        setVendors(vs);
        if (vs.length > 0) setVendor(vs[0].id);
      })
      .catch((err) => setErrorMsg("Couldn't load vendors: " + err.message))
      .finally(() => setVendorsLoading(false));
  }, []);

  async function handleFile(file) {
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setStatus("loading");
    setErrorMsg("");

    try {
      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("extract-boxes", {
        body: { imageBase64: base64, mimeType: file.type || "image/jpeg" },
      });

      if (error) {
        let detail = error.message;
        try {
          if (error.context?.json) {
            const body = await error.context.json();
            detail = body?.error || detail;
          }
        } catch {
          /* ignore parse failure, fall back to error.message */
        }
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);
      if (!data?.rows || data.rows.length === 0) {
        throw new Error("No boxes were found in that photo.");
      }

      setStatus("idle");
      onExtracted(data.rows, vendor);
    } catch (err) {
      console.error(err);
      setStatus("error");
      const known = err.message === "No boxes were found in that photo.";
      setErrorMsg(
        known
          ? err.message
          : `Couldn't read that photo (${err.message || "unknown error"}). Try a clearer, well-lit shot, or enter the boxes manually.`
      );
    }
  }

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <div style={{ padding: "10px 6px 18px" }}>
          <h1 style={titleStyle}>BoxRate</h1>
          <p style={subtitleStyle}>scan a measurement sheet</p>
        </div>

        <div style={cardStyle}>
          <label style={labelStyle}>Vendor for this batch</label>
          {vendorsLoading ? (
            <div style={{ fontSize: 13, color: COLORS_UI.inkSoft }}>Loading vendors…</div>
          ) : vendors.length === 0 ? (
            <div style={{ fontSize: 13, color: COLORS_UI.inkSoft }}>
              No vendors yet.{" "}
              <button onClick={onManageVendors} style={linkBtn}>
                Add one first
              </button>
              .
            </div>
          ) : (
            <>
              <SelectField
                value={vendor}
                onChange={setVendor}
                options={vendors.map((v) => ({ value: v.id, label: v.name }))}
              />
              <button onClick={onManageVendors} style={manageLink}>
                <Store size={12} /> Manage vendors
              </button>
            </>
          )}
        </div>

        {previewUrl && (
          <div style={{ ...cardStyle, padding: 8, position: "relative", overflow: "hidden" }}>
            <img
              src={previewUrl}
              alt="Selected sheet"
              style={{ width: "100%", borderRadius: 14, display: "block" }}
            />
            {status === "loading" && (
              <div
                style={{
                  position: "absolute",
                  left: 8,
                  right: 8,
                  top: 8,
                  bottom: 8,
                  borderRadius: 14,
                  overflow: "hidden",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: 3,
                    background:
                      "linear-gradient(90deg, transparent, #FF5B4A 20%, #fff 50%, #FF5B4A 80%, transparent)",
                    boxShadow: "0 0 16px 3px rgba(255,91,74,0.8)",
                    animation: "scanSweep 1.8s ease-in-out infinite",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.15))",
                  }}
                />
              </div>
            )}
          </div>
        )}

        {status === "loading" && (
          <div style={{ ...cardStyle, textAlign: "center" }}>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 13,
                color: COLORS_UI.ink,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Reading the sheet
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 5 }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: COLORS_UI.accent,
                    display: "inline-block",
                    animation: `pulseDot 1.1s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {status === "error" && (
          <div
            style={{
              ...cardStyle,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              border: `1.5px solid ${COLORS_UI.accent}`,
            }}
          >
            <AlertCircle size={18} color={COLORS_UI.accent} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 13, color: COLORS_UI.ink }}>{errorMsg}</div>
          </div>
        )}

        {status !== "loading" && (
          <>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={!vendor}
              style={{ ...primaryBtn, opacity: vendor ? 1 : 0.5, marginBottom: 10 }}
            >
              <Camera size={19} /> Take photo
            </button>

            <button
              onClick={() => galleryInputRef.current?.click()}
              disabled={!vendor}
              style={{ ...secondaryBtn, opacity: vendor ? 1 : 0.5, marginBottom: 14 }}
            >
              <ImageIcon size={17} /> Choose from gallery
            </button>

            <button
              onClick={() => onExtracted(null, vendor)}
              disabled={!vendor}
              style={{ ...textBtn, opacity: vendor ? 1 : 0.5 }}
            >
              Skip — enter boxes manually <ArrowRight size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}



const linkBtn = {
  background: "none",
  border: "none",
  color: COLORS_UI.accent,
  fontWeight: 700,
  cursor: "pointer",
  padding: 0,
  textDecoration: "underline",
};

const manageLink = {
  background: "none",
  border: "none",
  color: COLORS_UI.inkSoft,
  fontSize: 11.5,
  fontWeight: 600,
  cursor: "pointer",
  padding: 0,
  marginTop: 8,
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const textBtn = {
  width: "100%",
  padding: "10px",
  border: "none",
  background: "transparent",
  color: "rgba(255,255,255,0.9)",
  fontWeight: 700,
  fontSize: 13,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  cursor: "pointer",
};
