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
      <div onClick={(e) => e.stopPropagation()} style={sheetStyle}>
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
        <div style={footerStyle}>
          {canShareFiles && (
            <button onClick={handleShare} style={shareBtnStyle}>
              <Share2 size={16} /> Share
            </button>
          )}
          <button onClick={handleDownload} style={downloadBtnStyle}>
            <Download size={16} /> Download
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
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
};

const sheetStyle = {
  width: "100%",
  maxWidth: 500,
  height: "88vh",
  background: "#fff",
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  boxShadow: "0 -8px 30px rgba(0,0,0,0.4)",
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

const footerStyle = {
  display: "flex",
  gap: 10,
  padding: 14,
  borderTop: "1px solid #eee",
  flexShrink: 0,
  paddingBottom: "calc(14px + env(safe-area-inset-bottom))",
};

const shareBtnStyle = {
  flex: 1,
  padding: "13px",
  borderRadius: 14,
  border: "none",
  background: "linear-gradient(135deg, #FF5B4A 0%, #E8394F 100%)",
  color: "#fff",
  fontWeight: 700,
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  cursor: "pointer",
};

const downloadBtnStyle = {
  flex: 1,
  padding: "13px",
  borderRadius: 14,
  border: "1px solid #ddd",
  background: "#F5F5F5",
  color: "#1A1A1A",
  fontWeight: 700,
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  cursor: "pointer",
};
