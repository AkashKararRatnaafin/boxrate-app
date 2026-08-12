import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  Image as ImageIcon,
  ArrowRight,
  AlertCircle,
  Store,
} from "lucide-react";
import { supabase } from "./supabaseClient.js";
import {
  fetchVendors,
  labelStyle,
  pageStyle,
  cardStyle,
  SelectField,
} from "./shared.jsx";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // strip the "data:image/jpeg;base64," prefix
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

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.rows || data.rows.length === 0) {
        throw new Error("No boxes were found in that photo.");
      }

      setStatus("idle");
      onExtracted(data.rows, vendor);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg(
        err.message === "No boxes were found in that photo."
          ? err.message
          : "Couldn't read that photo. Try a clearer, well-lit shot, or enter the boxes manually.",
      );
    }
  }

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <div style={{ padding: "10px 6px 18px" }}>
          <h1
            style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: 26,
              margin: "0 0 2px",
              letterSpacing: 1,
            }}
          >
            BoxRate
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
            scan a measurement sheet
          </p>
        </div>

        <div style={cardStyle}>
          <label style={labelStyle}>Vendor for this batch</label>
          {vendorsLoading ? (
            <div style={{ fontSize: 13, color: "#6B5A45" }}>
              Loading vendors…
            </div>
          ) : vendors.length === 0 ? (
            <div style={{ fontSize: 13, color: "#6B5A45" }}>
              No vendors yet.{" "}
              <button
                onClick={onManageVendors}
                style={{
                  background: "none",
                  border: "none",
                  color: "#B23A2E",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
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
              <button
                onClick={onManageVendors}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6B5A45",
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Store size={12} /> Manage vendors
              </button>
            </>
          )}
        </div>

        {previewUrl && (
          <div style={{ ...cardStyle, padding: 8 }}>
            <img
              src={previewUrl}
              alt="Selected sheet"
              style={{ width: "100%", borderRadius: 6, display: "block" }}
            />
          </div>
        )}

        {status === "loading" && (
          <div
            style={{
              ...cardStyle,
              textAlign: "center",
              fontFamily: "'DM Mono', monospace",
              color: "#6B5A45",
            }}
          >
            Reading the sheet…
          </div>
        )}

        {status === "error" && (
          <div
            style={{
              ...cardStyle,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              border: "1.5px solid #B23A2E",
            }}
          >
            <AlertCircle
              size={18}
              color="#B23A2E"
              style={{ flexShrink: 0, marginTop: 2 }}
            />
            <div style={{ fontSize: 13, color: "#2B2118" }}>{errorMsg}</div>
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
              style={{ ...primaryBtn, opacity: vendor ? 1 : 0.5 }}
            >
              <Camera size={19} /> Take photo
            </button>

            <button
              onClick={() => galleryInputRef.current?.click()}
              disabled={!vendor}
              style={{ ...secondaryBtn, opacity: vendor ? 1 : 0.5 }}
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

const primaryBtn = {
  width: "100%",
  padding: "16px",
  borderRadius: 10,
  border: "none",
  background: "#B23A2E",
  color: "#fff",
  fontWeight: 700,
  fontSize: 15,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  cursor: "pointer",
  marginBottom: 10,
  boxShadow: "0 6px 14px rgba(43,33,24,0.18)",
};

const secondaryBtn = {
  width: "100%",
  padding: "14px",
  borderRadius: 10,
  border: "1.5px solid rgba(43,33,24,0.25)",
  background: "#F6EEDF",
  color: "#2B2118",
  fontWeight: 600,
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  cursor: "pointer",
  marginBottom: 14,
};

const textBtn = {
  width: "100%",
  padding: "10px",
  border: "none",
  background: "transparent",
  color: "#6B5A45",
  fontWeight: 600,
  fontSize: 13,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  cursor: "pointer",
};
