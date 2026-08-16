import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// jsPDF's built-in fonts don't include the ₹ glyph, so PDFs use "Rs" instead.
// The in-app UI keeps showing ₹ everywhere else — this only affects exported PDFs.
const fmtPdf = (n) => "Rs " + Number(n || 0).toFixed(2);

export function buildOrderPdf({ vendorName, batchDate, items }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;
  let y = 50;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  doc.text(vendorName || "Order", marginX, y);

  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(batchDate || "", marginX, y);
  doc.setTextColor(0, 0, 0);

  const boxCount = items.reduce((s, it) => s + Number(it.qty || 0), 0);
  const total = items.reduce((s, it) => s + Number(it.total_price || 0), 0);

  const body = items.map((it, idx) => [
    {
      description: it.description || `Box ${idx + 1}`,
      dims: `${it.height}H x ${it.length}L x ${it.width}W in${it.color ? " . " + it.color : ""}${
        it.has_acrylic ? " . Acrylic" : ""
      }`,
    },
    String(it.qty),
    fmtPdf(it.unit_price),
    fmtPdf(it.total_price),
  ]);

  autoTable(doc, {
    startY: y + 18,
    margin: { left: marginX, right: marginX },
    head: [["Box", "Qty", "Unit", "Total"]],
    body,
    theme: "plain",
    styles: {
      fontSize: 10,
      cellPadding: 7,
      valign: "top",
      lineColor: [220, 220, 220],
      lineWidth: { bottom: 0.5 },
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [90, 90, 90],
      fontStyle: "bold",
      fontSize: 8.5,
      lineWidth: { bottom: 1 },
      lineColor: [20, 20, 20],
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 40, halign: "right" },
      2: { cellWidth: 75, halign: "right" },
      3: { cellWidth: 75, halign: "right" },
    },
    didParseCell: (data) => {
      if (data.column.index === 0 && data.row.section === "body") {
        data.cell.text = [];
        // Two manually-drawn lines (description + dims) need more room than
        // autoTable would otherwise reserve for an "empty" cell — without
        // this the second line gets clipped by the next row's border.
        data.cell.styles.minCellHeight = 36;
      }
    },
    didDrawCell: (data) => {
      if (data.column.index === 0 && data.row.section === "body") {
        const { description, dims } = data.row.raw[0];
        const x = data.cell.x + data.cell.padding("left");
        let cy = data.cell.y + data.cell.padding("top") + 8;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(20, 20, 20);
        doc.text(description, x, cy);
        cy += 12;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(120, 120, 120);
        doc.text(dims, x, cy, {
          maxWidth: data.cell.width - data.cell.padding("horizontal"),
        });
        doc.setTextColor(0, 0, 0);
      }
    },
  });

  const finalY = doc.lastAutoTable.finalY + 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text(`Total (${boxCount} boxes)`, marginX, finalY);
  doc.text(fmtPdf(total), pageWidth - marginX, finalY, { align: "right" });

  return doc;
}
