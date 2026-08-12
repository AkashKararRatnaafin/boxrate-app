import React, { useState } from "react";
import { Camera, LayoutDashboard, Store } from "lucide-react";
import CapturePhoto from "./CapturePhoto.jsx";
import VerifyGrid from "./VerifyGrid.jsx";
import VendorManager from "./VendorManager.jsx";
import Dashboard from "./Dashboard.jsx";
import BatchDetail from "./BatchDetail.jsx";

export default function App() {
  const [screen, setScreen] = useState("capture"); // capture | verify | vendors | dashboard | batchDetail
  const [extraction, setExtraction] = useState({ rows: null, vendor: null });
  const [openBatchId, setOpenBatchId] = useState(null);

  function handleExtracted(rows, vendor) {
    setExtraction({ rows, vendor });
    setScreen("verify");
  }

  let body;
  if (screen === "vendors") {
    body = <VendorManager onBack={() => setScreen("capture")} />;
  } else if (screen === "batchDetail") {
    body = (
      <BatchDetail
        batchId={openBatchId}
        onBack={() => setScreen("dashboard")}
      />
    );
  } else if (screen === "dashboard") {
    body = (
      <Dashboard
        onBack={() => setScreen("capture")}
        onOpenBatch={(id) => {
          setOpenBatchId(id);
          setScreen("batchDetail");
        }}
      />
    );
  } else if (screen === "verify") {
    body = (
      <VerifyGrid
        initialRows={extraction.rows}
        initialVendor={extraction.vendor}
        onBack={() => setScreen("capture")}
        onSaved={() => {
          setExtraction({ rows: null, vendor: null });
          setScreen("capture");
        }}
      />
    );
  } else {
    body = (
      <CapturePhoto
        onExtracted={handleExtracted}
        onManageVendors={() => setScreen("vendors")}
      />
    );
  }

  // Verify grid and batch detail have their own full-screen flows — keep nav out of the way.
  const showNav = screen !== "verify" && screen !== "batchDetail";

  return (
    <>
      {body}
      {showNav && (
        <nav style={navStyle}>
          <NavBtn
            icon={<Camera size={20} />}
            label="Scan"
            active={screen === "capture"}
            onClick={() => setScreen("capture")}
          />
          <NavBtn
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active={screen === "dashboard"}
            onClick={() => setScreen("dashboard")}
          />
          <NavBtn
            icon={<Store size={20} />}
            label="Vendors"
            active={screen === "vendors"}
            onClick={() => setScreen("vendors")}
          />
        </nav>
      )}
    </>
  );
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: "none",
        border: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        padding: "10px 0 8px",
        cursor: "pointer",
        color: active ? "#FF5B4A" : "rgba(255,255,255,0.55)",
        transition: "color 0.15s",
      }}
    >
      {icon}
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5 }}>
        {label}
      </span>
    </button>
  );
}

const navStyle = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  background: "rgba(28,28,30,0.55)",
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  borderTop: "1px solid rgba(255,255,255,0.14)",
  display: "flex",
  paddingBottom: "env(safe-area-inset-bottom)",
};
