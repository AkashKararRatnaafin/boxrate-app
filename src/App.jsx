import React, { useState } from "react";
import { Camera, LayoutDashboard, Store } from "lucide-react";
import CapturePhoto from "./CapturePhoto.jsx";
import VerifyGrid from "./VerifyGrid.jsx";
import VendorManager from "./VendorManager.jsx";
import Dashboard from "./Dashboard.jsx";

export default function App() {
  const [screen, setScreen] = useState("capture"); // "capture" | "verify" | "vendors" | "dashboard"
  const [extraction, setExtraction] = useState({ rows: null, vendor: null });

  function handleExtracted(rows, vendor) {
    setExtraction({ rows, vendor });
    setScreen("verify");
  }

  let body;
  if (screen === "vendors") {
    body = <VendorManager onBack={() => setScreen("capture")} />;
  } else if (screen === "dashboard") {
    body = <Dashboard onBack={() => setScreen("capture")} />;
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

  // Verify grid has its own full-screen flow (with a sticky save bar) — keep nav out of its way.
  const showNav = screen !== "verify";

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
        color: active ? "#B23A2E" : "#8A7A61",
      }}
    >
      {icon}
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5 }}>{label}</span>
    </button>
  );
}

const navStyle = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  background: "#F6EEDF",
  borderTop: "1px solid rgba(43,33,24,0.18)",
  display: "flex",
  boxShadow: "0 -4px 14px rgba(43,33,24,0.12)",
  paddingBottom: "env(safe-area-inset-bottom)",
};
