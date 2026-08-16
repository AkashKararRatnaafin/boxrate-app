import React, { useState, useEffect } from "react";
import { X, Share2, Download } from "lucide-react";

export default function PdfPreviewDialog({ blob, filename, onClose }) {
  const [url] = useState(() => URL.createObjectURL(blob));
  const [canShareFiles, setCanShareFiles] = useState(false);

  useEffect(() => {
    try {
      const file = new File([blob], filename, { type: "application/pdf" });
      setCanShareFiles(
        !!(navigator.canShare && navigator.canShare({ files: [file] })),
      );
    } catch {
      setCanShareFiles(false);
    }
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleShare() {
    try {
      const file = new File([blob], filename, { type: "application/pdf" });
      await navigator.share({ files: [file], title: filename });
    } catch {
      // user cancelled the share sheet or it failed silently — nothing to do
    }
  }

  function handleDownload() {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={columnStyle}>
        <div style={cardStyle}>
          <div style={headerStyle}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#1A1A1A" }}>
              Order PDF
            </span>
            <button onClick={onClose} style={closeBtnStyle} aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <div style={{ flex: 1, overflow: "hidden", background: "#525659" }}>
            <iframe
              title="PDF preview"
              src={url}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          </div>
        </div>

        <div style={floatingRowStyle}>
          {canShareFiles && (
            <button
              onClick={handleShare}
              style={floatingBtnStyle(
                "linear-gradient(135deg, #FF5B4A 0%, #E8394F 100%)",
              )}
              aria-label="Share"
            >
              <Share2 size={22} color="#fff" />
            </button>
          )}
          <button
            onClick={handleDownload}
            style={floatingBtnStyle("#fff")}
            aria-label="Download"
          >
            <Download size={22} color="#1A1A1A" />
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 200,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  boxSizing: "border-box",
};

const columnStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: "100%",
  maxWidth: 460,
};

const cardStyle = {
  width: "100%",
  maxHeight: "calc(100vh - 220px)",
  background: "#fff",
  borderRadius: 20,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "14px 16px",
  borderBottom: "1px solid #eee",
  flexShrink: 0,
};

const closeBtnStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#555",
  display: "flex",
};

const floatingRowStyle = {
  display: "flex",
  gap: 20,
  marginTop: 18,
};

function floatingBtnStyle(background) {
  return {
    width: 56,
    height: 56,
    borderRadius: "50%",
    border: "none",
    background,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 8px 22px rgba(0,0,0,0.4)",
  };
}
