import React, { useState } from "react";
import CapturePhoto from "./CapturePhoto.jsx";
import VerifyGrid from "./VerifyGrid.jsx";

export default function App() {
  const [screen, setScreen] = useState("capture"); // "capture" | "verify"
  const [extraction, setExtraction] = useState({ rows: null, vendor: null });

  function handleExtracted(rows, vendor) {
    setExtraction({ rows, vendor });
    setScreen("verify");
  }

  if (screen === "verify") {
    return (
      <VerifyGrid
        initialRows={extraction.rows}
        initialVendor={extraction.vendor}
        onBack={() => setScreen("capture")}
      />
    );
  }

  return <CapturePhoto onExtracted={handleExtracted} />;
}
