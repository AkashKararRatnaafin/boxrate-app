import React, { useState } from "react";
import CapturePhoto from "./CapturePhoto.jsx";
import VerifyGrid from "./VerifyGrid.jsx";
import VendorManager from "./VendorManager.jsx";

export default function App() {
  const [screen, setScreen] = useState("capture"); // "capture" | "verify" | "vendors"
  const [extraction, setExtraction] = useState({ rows: null, vendor: null });

  function handleExtracted(rows, vendor) {
    setExtraction({ rows, vendor });
    setScreen("verify");
  }

  if (screen === "vendors") {
    return <VendorManager onBack={() => setScreen("capture")} />;
  }

  if (screen === "verify") {
    return (
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
  }

  return (
    <CapturePhoto
      onExtracted={handleExtracted}
      onManageVendors={() => setScreen("vendors")}
    />
  );
}
