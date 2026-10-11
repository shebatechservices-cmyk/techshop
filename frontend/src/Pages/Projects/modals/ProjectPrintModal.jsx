import React, { useState, useEffect } from "react";
import API, { getAuthHeaders } from "../../../services/api";

export default function ProjectPrintModal({ isOpen, onClose, project }) {
  // Layout modes: "a4_jobcard" (Office/Tech Job Card) | "a4_customer" (Customer Handover Slip) | "pos_thermal" (80mm Thermal Slip)
  const [layout, setLayout] = useState("a4_jobcard");
  const [shop, setShop] = useState({
    shop_name: "Sheba Technology & Networking",
    shop_title: "Professional CCTV, IT & Network Solutions",
    phone: "01722578860",
    address: "B-Baria, Dhaka, Bangladesh"
  });

  useEffect(() => {
    if (isOpen) {
      fetch(`${API}/settings`, { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(json => {
          if (json && json.data) {
            setShop(prev => ({
              ...prev,
              ...json.data
            }));
          }
        })
        .catch(err => console.error("Failed to load shop settings for print:", err));
    }
  }, [isOpen]);

  if (!isOpen || !project) return null;

  const setup = parseFloat(project.setup_charge || project.setup_fee || 0);
  const conv = parseFloat(project.conveyance_cost || project.conveyance || 0);
  const meal = parseFloat(project.meal_allowance || 0);
  const totalTechPayout = setup + conv + meal > 0 ? (setup + conv + meal) : parseFloat(project.charges || 0);
  const customerBill = parseFloat(project.customer_billing_amount || 0);

  const equipmentList = Array.isArray(project.equipment_details)
    ? project.equipment_details
    : typeof project.equipment_details === "string"
      ? JSON.parse(project.equipment_details || "[]")
      : [];

  const servicesList = Array.isArray(project.services) ? project.services : [];

  const handlePrint = () => {
    window.print();
  };

  const printDateStr = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  const jobDateStr = project.created_at
    ? new Date(project.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("en-GB");

  const startDateStr = project.start_date
    ? new Date(project.start_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "Immediate";

  return (
    <div
      id="project-print-modal-container"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(5px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px"
      }}
      onClick={onClose}
    >
      {/* Print Specific CSS Rules */}
      <style>{`
        @media screen {
          .project-print-preview-container {
            max-height: 84vh;
            overflow-y: auto;
            background: #334155;
            padding: 24px;
            display: flex;
            justify-content: center;
            border-radius: 0 0 16px 16px;
          }
        }

        @media print {
          @page {
            size: ${layout === "pos_thermal" ? "80mm auto" : "A4 portrait"};
            margin: ${layout === "pos_thermal" ? "3mm 4mm" : "6mm 8mm"};
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: ${layout === "pos_thermal" ? "auto" : "100%"} !important;
            max-height: ${layout === "pos_thermal" ? "none" : "100%"} !important;
            overflow: hidden !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #project-print-modal-container {
            position: static !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            overflow: visible !important;
          }
          #project-print-sheet, #project-print-sheet * {
            visibility: visible !important;
          }
          #project-print-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: layout === "pos_thermal" ? "460px" : "900px",
          maxHeight: "96vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45)",
          overflow: "hidden",
          border: "1px solid #cbd5e1",
          transition: "max-width 0.25s ease"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP TOOLBAR - NO PRINT */}
        <div
          className="no-print"
          style={{
            padding: "12px 18px",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            borderBottom: "1px solid #334155"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.3rem" }}>🖨️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.01em" }}>
                Print Work Order & Job Card
              </h3>
              <p style={{ margin: 0, fontSize: "0.74rem", color: "#94a3b8" }}>
                Job: <strong style={{ color: "#38bdf8" }}>{project.project_code}</strong> • {project.customer_name}
              </p>
            </div>
          </div>

          {/* LAYOUT SWITCHER */}
          <div style={{ display: "flex", background: "#334155", padding: "3px", borderRadius: "8px", gap: "3px" }}>
            <button
              type="button"
              onClick={() => setLayout("a4_jobcard")}
              style={{
                background: layout === "a4_jobcard" ? "#2563eb" : "transparent",
                color: "#ffffff",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <span>📄</span>
              <span>A4 Technical Job Card</span>
            </button>
            <button
              type="button"
              onClick={() => setLayout("a4_customer")}
              style={{
                background: layout === "a4_customer" ? "#2563eb" : "transparent",
                color: "#ffffff",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <span>📋</span>
              <span>Customer Handover Copy</span>
            </button>
            <button
              type="button"
              onClick={() => setLayout("pos_thermal")}
              style={{
                background: layout === "pos_thermal" ? "#2563eb" : "transparent",
                color: "#ffffff",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <span>🧾</span>
              <span>80mm Thermal Slip</span>
            </button>
          </div>

          {/* ACTIONS */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                padding: "7px 18px",
                background: "#16a34a",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 800,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 6px rgba(22, 163, 74, 0.4)"
              }}
            >
              <span>🖨️</span>
              <span>Print Sheet</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "7px 14px",
                background: "#475569",
                color: "#f8fafc",
                border: "none",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer"
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* PRINTABLE PREVIEW CONTAINER */}
        <div className="project-print-preview-container">
          <div
            id="project-print-sheet"
            style={{
              background: "#ffffff",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
              borderRadius: layout === "pos_thermal" ? "4px" : "6px",
              width: layout === "pos_thermal" ? "320px" : "100%",
              maxWidth: layout === "pos_thermal" ? "320px" : "780px",
              fontFamily: layout === "pos_thermal" ? "monospace, Courier, sans-serif" : "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
              color: "#0f172a",
              boxSizing: "border-box"
            }}
          >
            {/* =========================================================
                A4 LAYOUT (OFFICIAL JOB CARD & CUSTOMER COPY)
               ========================================================= */}
            {layout !== "pos_thermal" && (
              <div
                style={{
                  border: "1.5px solid #0f172a",
                  borderRadius: "4px",
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                  background: "#ffffff",
                  minHeight: "272mm",
                  maxHeight: "275mm"
                }}
              >
                {/* 1. TOP HEADER & CORPORATE BRANDING */}
                <div>
                  <div style={{ height: "3px", background: "linear-gradient(90deg, #1e3a8a 0%, #0284c7 50%, #16a34a 100%)", marginBottom: "10px" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1.5px solid #0f172a", paddingBottom: "10px", marginBottom: "12px" }}>
                    <div style={{ maxWidth: "60%" }}>
                      <h1 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em", textTransform: "uppercase" }}>
                        {shop.shop_name || "Sheba Technology & Networking"}
                      </h1>
                      <div style={{ fontSize: "0.82rem", color: "#2563eb", fontWeight: 700, marginTop: "1px" }}>
                        {shop.shop_title || "Professional CCTV, IT & Network Solutions"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "3px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <span>📍 {shop.address || "B-Baria, Dhaka, Bangladesh"}</span>
                        <span>•</span>
                        <span>📞 {shop.phone || "01722578860"}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          display: "inline-block",
                          background: "#0f172a",
                          color: "#ffffff",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontSize: "0.74rem",
                          fontWeight: 800,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase"
                        }}
                      >
                        {layout === "a4_customer" ? "CUSTOMER DELIVERY & HANDOVER SLIP" : "TECHNICAL WORK ORDER & JOB CARD"}
                      </div>
                      <div style={{ marginTop: "5px", fontSize: "0.85rem", fontWeight: 800, color: "#0f172a" }}>
                        Job Code: <span style={{ color: "#1d4ed8", fontFamily: "monospace", fontSize: "0.92rem" }}>{project.project_code}</span>
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "2px" }}>
                        Date: <strong>{jobDateStr}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 2. JOB TITLE & SCOPE BANNER */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderLeft: "4px solid #2563eb",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      marginBottom: "12px"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.03em" }}>
                        Work Order Title & Scope
                      </div>
                      <div style={{ fontSize: "0.98rem", fontWeight: 800, color: "#0f172a", marginTop: "1px" }}>
                        {project.title}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          padding: "4px 9px",
                          borderRadius: "5px",
                          fontSize: "0.73rem",
                          fontWeight: 800,
                          background: project.invoice_no ? "#eff6ff" : "#fef3c7",
                          color: project.invoice_no ? "#1e40af" : "#92400e",
                          border: project.invoice_no ? "1px solid #bfdbfe" : "1px solid #fde68a"
                        }}
                      >
                        {project.invoice_no ? `📦 Invoice Linked: #${project.invoice_no}` : "🔧 Direct Service & Maintenance"}
                      </span>
                    </div>
                  </div>

                  {/* 3. TWO-COLUMN: CLIENT & TECHNICIAN INFORMATION */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                    {/* Client & Site */}
                    <div style={{ border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden", background: "#ffffff" }}>
                      <div style={{ background: "#f1f5f9", padding: "5px 10px", fontSize: "0.74rem", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", borderBottom: "1px solid #cbd5e1", display: "flex", alignItems: "center", gap: "5px" }}>
                        <span>👤</span>
                        <span>Customer & Site Details</span>
                      </div>
                      <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: "3px", fontSize: "0.78rem" }}>
                        <div style={{ display: "flex" }}>
                          <span style={{ width: "105px", color: "#64748b" }}>Customer Name:</span>
                          <strong style={{ color: "#0f172a" }}>{project.customer_name}</strong>
                        </div>
                        <div style={{ display: "flex" }}>
                          <span style={{ width: "105px", color: "#64748b" }}>Contact Phone:</span>
                          <strong style={{ color: "#16a34a" }}>{project.site_phone || project.customer_phone || "N/A"}</strong>
                        </div>
                        <div style={{ display: "flex" }}>
                          <span style={{ width: "105px", color: "#64748b" }}>Site Location:</span>
                          <span style={{ color: "#0f172a", fontWeight: 600 }}>{project.site_address || "On-site"}</span>
                        </div>
                        <div style={{ display: "flex" }}>
                          <span style={{ width: "105px", color: "#64748b" }}>Service Scope:</span>
                          <span style={{ color: "#1e40af", fontWeight: 700 }}>{project.project_type || "CCTV Installation"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Technician & Schedule */}
                    <div style={{ border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden", background: "#ffffff" }}>
                      <div style={{ background: "#f1f5f9", padding: "5px 10px", fontSize: "0.74rem", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", borderBottom: "1px solid #cbd5e1", display: "flex", alignItems: "center", gap: "5px" }}>
                        <span>👷</span>
                        <span>Assigned Technician & Schedule</span>
                      </div>
                      <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: "3px", fontSize: "0.78rem" }}>
                        <div style={{ display: "flex" }}>
                          <span style={{ width: "115px", color: "#64748b" }}>Lead Technician:</span>
                          <strong style={{ color: "#0f172a" }}>{project.technician_name}</strong>
                        </div>
                        <div style={{ display: "flex" }}>
                          <span style={{ width: "115px", color: "#64748b" }}>Tech Contact:</span>
                          <strong style={{ color: "#0f172a" }}>{project.technician_contact || "N/A"}</strong>
                        </div>
                        <div style={{ display: "flex" }}>
                          <span style={{ width: "115px", color: "#64748b" }}>Scheduled Date:</span>
                          <span style={{ color: "#0f172a", fontWeight: 600 }}>{startDateStr}</span>
                        </div>
                        <div style={{ display: "flex" }}>
                          <span style={{ width: "115px", color: "#64748b" }}>Order Status:</span>
                          <strong style={{ color: project.status === "completed" ? "#16a34a" : "#2563eb", textTransform: "capitalize" }}>
                            {project.status === "completed" ? "✓ Completed" : project.status?.replace("_", " ") || "Assigned"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. INSTALLATION CHECKLIST & EQUIPMENT */}
                  {equipmentList.length > 0 && (
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: "4px", display: "flex", alignItems: "center", gap: "5px" }}>
                        <span>📋</span>
                        <span>Installation Equipment & Device Checklist</span>
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.77rem", border: "1px solid #cbd5e1" }}>
                        <thead>
                          <tr style={{ background: "#0f172a", color: "#ffffff" }}>
                            <th style={{ padding: "5px 8px", textAlign: "center", width: "35px" }}>#</th>
                            <th style={{ padding: "5px 8px", textAlign: "left" }}>Product / Device Description</th>
                            <th style={{ padding: "5px 8px", textAlign: "center", width: "75px" }}>Quantity</th>
                            <th style={{ padding: "5px 8px", textAlign: "center", width: "140px" }}>Installation Verification</th>
                          </tr>
                        </thead>
                        <tbody>
                          {equipmentList.map((eq, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid #e2e8f0", background: i % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                              <td style={{ padding: "4px 8px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>{i + 1}</td>
                              <td style={{ padding: "4px 8px", fontWeight: 700, color: "#1e293b" }}>{eq.product_name}</td>
                              <td style={{ padding: "4px 8px", textAlign: "center", fontWeight: 800, color: "#0f172a" }}>{eq.quantity} pcs</td>
                              <td style={{ padding: "4px 8px", textAlign: "center", color: "#1e40af", fontWeight: 600, fontSize: "0.74rem" }}>
                                [ &nbsp;✓&nbsp; ] Installed & Tested
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 4.1 SERVICES / TASKS (IF SPECIFIED) */}
                  {servicesList.length > 0 && equipmentList.length === 0 && (
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: "4px" }}>
                        📋 Service Tasks Breakdown
                      </div>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.77rem", border: "1px solid #cbd5e1" }}>
                        <thead>
                          <tr style={{ background: "#0f172a", color: "#ffffff" }}>
                            <th style={{ padding: "5px 8px", textAlign: "center", width: "35px" }}>#</th>
                            <th style={{ padding: "5px 8px", textAlign: "left" }}>Service Description</th>
                            <th style={{ padding: "5px 8px", textAlign: "center", width: "60px" }}>Qty</th>
                            <th style={{ padding: "5px 8px", textAlign: "right", width: "90px" }}>Rate</th>
                            <th style={{ padding: "5px 8px", textAlign: "right", width: "90px" }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {servicesList.map((srv, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                              <td style={{ padding: "4px 8px", textAlign: "center", color: "#64748b" }}>{i + 1}</td>
                              <td style={{ padding: "4px 8px", fontWeight: 700 }}>{srv.service_name}</td>
                              <td style={{ padding: "4px 8px", textAlign: "center" }}>{srv.quantity}</td>
                              <td style={{ padding: "4px 8px", textAlign: "right" }}>৳ {Number(srv.unit_rate || 0).toLocaleString("en-IN")}</td>
                              <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: 700 }}>৳ {Number(srv.line_total || 0).toLocaleString("en-IN")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 5. JOB DESCRIPTION / SPECIAL NOTES */}
                  {project.description && (
                    <div style={{ marginBottom: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "5px", padding: "6px 10px" }}>
                      <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                        Job Instructions & Technical Notes:
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "#1e293b", marginTop: "2px", whiteSpace: "pre-line" }}>
                        {project.description}
                      </div>
                    </div>
                  )}

                  {/* 6. FINANCIAL & BILLING TERMS */}
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: layout === "a4_customer" ? "1fr" : "1fr 1fr", gap: "10px" }}>
                      {/* Technician Remuneration Breakdown (Hidden in Customer Handover Copy!) */}
                      {layout !== "a4_customer" && (
                        <div style={{ border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden" }}>
                          <div style={{ background: "#eff6ff", padding: "4px 10px", fontSize: "0.72rem", fontWeight: 800, color: "#1e40af", borderBottom: "1px solid #bfdbfe", textTransform: "uppercase" }}>
                            Technician Compensation Breakdown
                          </div>
                          <div style={{ fontSize: "0.76rem", padding: "4px 10px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: "1px dashed #f1f5f9" }}>
                              <span style={{ color: "#475569" }}>Setup / Installation Fee:</span>
                              <strong>৳ {setup.toLocaleString("en-IN")}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: "1px dashed #f1f5f9" }}>
                              <span style={{ color: "#475569" }}>Conveyance / Transport:</span>
                              <strong>৳ {conv.toLocaleString("en-IN")}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: "1px dashed #f1f5f9" }}>
                              <span style={{ color: "#475569" }}>Meal Allowance:</span>
                              <strong>৳ {meal.toLocaleString("en-IN")}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0 0", fontWeight: 800, color: "#1e40af", borderTop: "1px solid #cbd5e1", marginTop: "2px" }}>
                              <span>Total Technician Receivable (Wallet):</span>
                              <span style={{ fontSize: "0.85rem" }}>৳ {totalTechPayout.toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Customer Billing Terms */}
                      <div
                        style={{
                          border: "1px solid #bbf7d0",
                          background: "#f0fdf4",
                          borderRadius: "6px",
                          padding: "8px 12px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center"
                        }}
                      >
                        <div style={{ fontSize: "0.7rem", color: "#166534", fontWeight: 800, textTransform: "uppercase" }}>
                          Customer Service Billing Summary
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", margin: "3px 0" }}>
                          <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "#15803d" }}>
                            ৳ {customerBill.toLocaleString("en-IN")}
                          </span>
                          {customerBill === 0 && project.invoice_no && (
                            <span style={{ fontSize: "0.74rem", color: "#166534", fontWeight: 700 }}>
                              (Covered in Invoice #{project.invoice_no})
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "#15803d", lineHeight: "1.2" }}>
                          {customerBill > 0
                            ? "• Amount payable upon successful installation and live CCTV verification."
                            : project.invoice_no
                              ? "• Hardware & installation package billed under official POS Invoice."
                              : "• Complimentary / standard maintenance work order."}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 7. CUSTOMER HANDOVER & WARRANTY TERMS */}
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "5px", padding: "6px 10px", marginBottom: "14px" }}>
                    <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", marginBottom: "2px" }}>
                      Service Handover & Warranty Terms:
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b", lineHeight: "1.35" }}>
                      1. All equipment inspected, configured, and demonstrated in fully functional state with live viewing.<br />
                      2. Warranty terms apply as stated in the primary invoice; electrical surge, lightning, or burn damages are void.<br />
                      3. Customer acknowledges complete receipt of materials and satisfactory completion of technical work.
                    </div>
                  </div>
                </div>

                {/* 8. SIGNATURE SECTION (ANCHORED AT BOTTOM OF SHEET) */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: "10px" }}>
                    <div style={{ textAlign: "center", width: "180px" }}>
                      <div style={{ borderTop: "1.5px solid #0f172a", paddingTop: "4px", fontSize: "0.75rem", fontWeight: 800, color: "#0f172a" }}>
                        Customer Acceptance
                      </div>
                      <div style={{ fontSize: "0.67rem", color: "#64748b" }}>Received & satisfied with service</div>
                    </div>

                    <div style={{ textAlign: "center", width: "180px" }}>
                      <div style={{ borderTop: "1.5px solid #0f172a", paddingTop: "4px", fontSize: "0.75rem", fontWeight: 800, color: "#0f172a" }}>
                        Lead Technician
                      </div>
                      <div style={{ fontSize: "0.67rem", color: "#64748b" }}>{project.technician_name}</div>
                    </div>

                    <div style={{ textAlign: "center", width: "180px" }}>
                      <div style={{ borderTop: "1.5px solid #0f172a", paddingTop: "4px", fontSize: "0.75rem", fontWeight: 800, color: "#0f172a" }}>
                        Authorized Signatory
                      </div>
                      <div style={{ fontSize: "0.67rem", color: "#64748b" }}>Sheba Technology & Networking</div>
                    </div>
                  </div>

                  <div style={{ textAlign: "center", marginTop: "12px", fontSize: "0.65rem", color: "#94a3b8", borderTop: "1px solid #f1f5f9", paddingTop: "4px" }}>
                    Printed on: {printDateStr} &nbsp;•&nbsp; Sheba POS & ERP Solutions &nbsp;•&nbsp; Support: {shop.phone}
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
                LAYOUT 2: 80MM POS THERMAL COUNTER SLIP
               ========================================================= */}
            {layout === "pos_thermal" && (
              <div style={{ fontSize: "11px", lineHeight: "1.35", color: "#000000", padding: "12px 10px" }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "8px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "bold", textTransform: "uppercase" }}>
                    {shop.shop_name || "SHEBA TECHNOLOGY"}
                  </div>
                  <div style={{ fontSize: "9px", marginTop: "2px" }}>
                    {shop.address || "B-Baria, Dhaka, Bangladesh"}
                  </div>
                  <div style={{ fontSize: "9px" }}>
                    Tel: {shop.phone || "01722578860"}
                  </div>
                  <div style={{ margin: "6px 0", borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "3px 0", fontWeight: "bold", fontSize: "10px" }}>
                    TECHNICAL WORK ORDER & JOB CARD
                  </div>
                </div>

                {/* Job Info */}
                <div style={{ fontSize: "9.5px", marginBottom: "6px" }}>
                  <div>Job Code : <strong>{project.project_code}</strong></div>
                  <div>Category : {project.invoice_no ? "NEW SETUP" : "REPAIR"}</div>
                  {project.invoice_no && <div>Invoice  : {project.invoice_no}</div>}
                  <div>Date     : {jobDateStr}</div>
                </div>

                <div style={{ borderTop: "1px dashed #000", marginBottom: "6px" }}></div>

                {/* Client */}
                <div style={{ fontWeight: "bold", fontSize: "10px", marginBottom: "2px" }}>[ CLIENT & SITE ]</div>
                <div style={{ fontSize: "9.5px" }}>Name: {project.customer_name}</div>
                <div style={{ fontSize: "9.5px" }}>Tel : {project.site_phone || project.customer_phone || "N/A"}</div>
                {project.site_address && <div style={{ fontSize: "9px" }}>Loc : {project.site_address}</div>}

                <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }}></div>

                {/* Technician */}
                <div style={{ fontWeight: "bold", fontSize: "10px", marginBottom: "2px" }}>[ TECHNICIAN ]</div>
                <div style={{ fontSize: "9.5px" }}>Tech: {project.technician_name}</div>
                <div style={{ fontSize: "9px" }}>Tel : {project.technician_contact || "N/A"}</div>
                <div style={{ fontSize: "9px" }}>Status: {project.status?.toUpperCase()}</div>

                {/* Devices */}
                {equipmentList.length > 0 && (
                  <>
                    <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }}></div>
                    <div style={{ fontWeight: "bold", fontSize: "10px", marginBottom: "2px" }}>[ EQUIPMENT CHECKLIST ]</div>
                    {equipmentList.map((eq, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "9px" }}>
                        <span>{eq.product_name}</span>
                        <span>x{eq.quantity} [✓]</span>
                      </div>
                    ))}
                  </>
                )}

                <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }}></div>

                {/* Charges */}
                <div style={{ fontWeight: "bold", fontSize: "10px", marginBottom: "2px" }}>[ CHARGES & TERMS ]</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px" }}>
                  <span>Setup Charge:</span>
                  <span>৳ {setup}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px" }}>
                  <span>Conveyance:</span>
                  <span>৳ {conv}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px" }}>
                  <span>Meal Allowance:</span>
                  <span>৳ {meal}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", borderTop: "1px dotted #000", marginTop: "2px", paddingTop: "2px", fontSize: "10px" }}>
                  <span>Total Tech Payout:</span>
                  <span>৳ {totalTechPayout}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginTop: "4px", fontSize: "11px" }}>
                  <span>Customer Bill:</span>
                  <span>৳ {customerBill}</span>
                </div>

                <div style={{ borderTop: "1px dashed #000", margin: "14px 0 16px 0" }}></div>

                {/* Signatures */}
                <div style={{ display: "flex", justifyContent: "space-between", textAlign: "center", fontSize: "9px", marginTop: "12px" }}>
                  <div style={{ borderTop: "1px dotted #000", width: "85px", paddingTop: "2px" }}>
                    Customer Sign
                  </div>
                  <div style={{ borderTop: "1px dotted #000", width: "85px", paddingTop: "2px" }}>
                    Tech Sign
                  </div>
                </div>

                <div style={{ textAlign: "center", marginTop: "10px", fontSize: "8px", color: "#555" }}>
                  *** Sheba POS & ERP Systems ***
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
