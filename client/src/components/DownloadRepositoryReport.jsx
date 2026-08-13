import React, { useState } from "react";
import jsPDF from "jspdf";
import Chart from "chart.js/auto";

// ===========================
// Design Tokens
// ===========================
const PALETTE = {
  primary: "#0F172A",     // Slate 900
  secondary: "#334155",   // Slate 700
  accent: "#2563EB",      // Blue 600
  accentLight: "#EFF6FF", // Blue 50
  text: "#1E293B",        // Slate 800
  muted: "#64748B",       // Slate 500
  bgLight: "#F8FAFC",     // Slate 50
  border: "#E2E8F0",      // Slate 200
  series: [
    "#2563EB", "#0D9488", "#D97706", "#E11D48",
    "#4F46E5", "#0284C7", "#65A30D", "#9333EA",
  ],
};

const COLOR_RGB = {
  primary: [15, 23, 42],
  secondary: [51, 65, 85],
  accent: [37, 99, 235],
  text: [30, 41, 59],
  muted: [100, 116, 139],
  bgLight: [248, 250, 252],
  border: [226, 232, 240],
  white: [255, 255, 255],
};

const PRIORITY_STYLES = {
  CRITICAL: { fg: [225, 29, 72], bg: [254, 226, 226] },
  HIGH: { fg: [217, 119, 6], bg: [254, 243, 199] },
  MEDIUM: { fg: [37, 99, 235], bg: [239, 246, 255] },
  LOW: { fg: [16, 185, 129], bg: [236, 253, 245] },
};

const SEVERITY_STYLES = {
  HIGH: [225, 29, 72],
  MEDIUM: [217, 119, 6],
  LOW: [37, 99, 235],
};

// --- Helper Functions ---
function safeStr(val, fallback = "-") {
  if (val === null || val === undefined || val === "undefined" || val === "null" || Number.isNaN(val)) {
    return fallback;
  }
  return String(val);
}

function safeNum(val, fallback = 0) {
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

/**
 * Renders a Chart.js chart off-screen to image data URL
 */
function renderChartToImage(config, width = 600, height = 320) {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const chart = new Chart(canvas, {
        ...config,
        options: {
          responsive: false,
          animation: false,
          devicePixelRatio: 2,
          layout: { padding: 12 },
          ...config.options,
          plugins: {
            legend: {
              labels: {
                boxWidth: 10,
                usePointStyle: true,
                pointStyle: "circle",
                font: { family: "Helvetica", size: 10, weight: "bold" },
                color: PALETTE.text,
              },
              ...config.options?.plugins?.legend,
            },
            ...config.options?.plugins,
          },
        },
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const dataUrl = canvas.toDataURL("image/png", 1.0);
          chart.destroy();
          resolve(dataUrl);
        });
      });
    } catch (err) {
      reject(err);
    }
  });
}

function DownloadRepositoryReport(props) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Consume either flat props or a grouped `analysis` object
  const data = props.analysis || {};
  const repoUrl = props.repoUrl || data.repoUrl || "";
  const stats = props.stats || data.stats || {};
  const contributors = props.contributors || data.contributors || {};
  const fileAnalysis = props.fileAnalysis || data.fileAnalysis || {};
  const languageAnalysis = props.languageAnalysis || data.languageAnalysis || {};
  const architecture = props.architecture || data.architecture || null;
  const codeEvolution = props.codeEvolution || data.codeEvolution || [];
  const hotspots = props.hotspots || data.hotspots || [];
  const recentCommits = props.recentCommits || data.recentCommits || [];
  const branches = props.branches || data.branches || [];
  const insights = props.insights || data.insights || data.aiInsights || null;
  const recommendations = props.recommendations || data.recommendations || [];
  const health = props.health || data.health || {};
  const summary = props.summary || data.summary || "";
  const technicalFocus = props.technicalFocus || data.technicalFocus || null;
  const importantFiles = props.importantFiles || data.importantFiles || [];
  const keyFindings = props.keyFindings || data.keyFindings || null;
  const risks = props.risks || data.risks || [];
  const conclusion = props.conclusion || data.conclusion || null;

  const downloadReport = async () => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      let y = 20;
      const PAGE_RIGHT = 190;
      const PAGE_LEFT = 20;
      const CONTENT_W = 170;

      // Normalize raw inputs safely
      const rawContributors = Array.isArray(contributors)
        ? contributors
        : Object.values(contributors || {});

      const contributorList = [...rawContributors].sort(
        (a, b) => safeNum(b.commits) - safeNum(a.commits)
      );
      const hotspotList = Array.isArray(hotspots) ? hotspots : [];
      const languages = (languageAnalysis?.languages || [])
        .slice()
        .sort((a, b) => safeNum(b.percentage) - safeNum(a.percentage));
      const mostChangedFiles = fileAnalysis?.mostChangedFiles || [];
      const largestFiles = fileAnalysis?.largestFiles || [];
      const allFiles = fileAnalysis?.allFiles || [];
      const commitList = (recentCommits || []).slice(0, 10);
      const branchList = Array.isArray(branches) ? branches : [];

      // Calculated aggregated metrics
      const contributorCount = contributorList.length;
      const totalCommits = safeNum(stats?.totalCommits);
      const totalAdditions =
        fileAnalysis?.totalAdditions ??
        contributorList.reduce((sum, c) => sum + safeNum(c.additions), 0);
      const totalDeletions =
        fileAnalysis?.totalDeletions ??
        contributorList.reduce((sum, c) => sum + safeNum(c.deletions), 0);
      const totalLines = safeNum(fileAnalysis?.totalLines);
      const totalFiles = safeNum(fileAnalysis?.totalFiles, allFiles.length);
      const totalChurn = totalAdditions + totalDeletions;
      const avgCommitsPerContributor = contributorCount
        ? Math.round(totalCommits / contributorCount)
        : 0;

      const repoName = (() => {
        if (!repoUrl) return "Repository Analysis";
        const cleaned = repoUrl.replace(/\.git$/, "").replace(/\/+$/, "");
        const parts = cleaned.split("/").filter(Boolean);
        return parts.length >= 2 ? parts.slice(-2).join("/") : cleaned;
      })();

      // --- PDF Drawing Helpers ---
      const fitText = (text, maxWidthMm) => {
        let t = safeStr(text);
        if (doc.getTextWidth(t) <= maxWidthMm) return t;
        while (t.length > 1 && doc.getTextWidth(t + "…") > maxWidthMm) {
          t = t.slice(0, -1);
        }
        return t + "…";
      };

      const checkPageOverflow = (heightNeeded) => {
        if (y + heightNeeded > 272) {
          doc.addPage();
          y = 20;
          return true;
        }
        return false;
      };

      const addHeading = (text, { subheading = false, eyebrow = null } = {}) => {
        const blockHeight = subheading ? 12 : 20;
        checkPageOverflow(blockHeight);

        if (subheading) {
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...COLOR_RGB.primary);
          doc.text(text, PAGE_LEFT, y);
          y += 8;
        } else {
          if (eyebrow) {
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...COLOR_RGB.accent);
            doc.text(eyebrow.toUpperCase(), PAGE_LEFT, y);
            y += 5;
          }

          doc.setFontSize(15);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...COLOR_RGB.primary);
          doc.text(text, PAGE_LEFT, y);

          y += 3;
          doc.setDrawColor(...COLOR_RGB.border);
          doc.setLineWidth(0.4);
          doc.line(PAGE_LEFT, y, PAGE_RIGHT, y);

          doc.setDrawColor(...COLOR_RGB.accent);
          doc.setLineWidth(1.2);
          doc.line(PAGE_LEFT, y, PAGE_LEFT + 16, y);

          y += 10;
        }

        doc.setTextColor(...COLOR_RGB.text);
        doc.setFont("helvetica", "normal");
      };

      const addLine = (label, value) => {
        checkPageOverflow(8);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLOR_RGB.muted);
        doc.text(label, PAGE_LEFT, y);

        const labelWidth = Math.max(doc.getTextWidth(label) + 6, 45);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLOR_RGB.text);

        const lines = doc.splitTextToSize(safeStr(value), CONTENT_W - labelWidth);
        doc.text(lines, PAGE_LEFT + labelWidth, y);

        y += Math.max(lines.length * 5, 5) + 3;
      };

      const addBullets = (items) => {
        items.forEach((item) => {
          const lines = doc.splitTextToSize(item, CONTENT_W - 8);
          const blockHeight = lines.length * 5 + 3;
          checkPageOverflow(blockHeight);

          doc.setFillColor(...COLOR_RGB.accent);
          doc.circle(PAGE_LEFT + 1.2, y - 1.5, 0.9, "F");

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(...COLOR_RGB.text);
          doc.text(lines, PAGE_LEFT + 6, y);

          y += blockHeight;
        });
        y += 2;
      };

      const addStatCards = (cards) => {
        const cardW = (CONTENT_W - (cards.length - 1) * 4) / cards.length;
        const cardH = 24;

        checkPageOverflow(cardH + 6);

        cards.forEach((c, i) => {
          const cx = PAGE_LEFT + i * (cardW + 4);

          doc.setFillColor(...COLOR_RGB.bgLight);
          doc.roundedRect(cx, y, cardW, cardH, 2, 2, "F");
          doc.setDrawColor(...COLOR_RGB.border);
          doc.setLineWidth(0.3);
          doc.roundedRect(cx, y, cardW, cardH, 2, 2, "S");

          const colorRgb = c.colorRgb || COLOR_RGB.accent;
          doc.setFillColor(...colorRgb);
          doc.roundedRect(cx + 3, y + 2.5, cardW - 6, 1, 0.5, 0.5, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(c.value.length > 8 ? 11 : 14);
          doc.setTextColor(...COLOR_RGB.primary);
          doc.text(safeStr(c.value), cx + cardW / 2, y + 13, { align: "center" });

          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.5);
          doc.setTextColor(...COLOR_RGB.muted);
          doc.text(c.label.toUpperCase(), cx + cardW / 2, y + 19, { align: "center" });
        });

        y += cardH + 8;
      };

      const addTable = (headers, rows, colWidths, { rowHeight = 7, fontSize = 8 } = {}) => {
        const drawHeader = () => {
          doc.setFillColor(...COLOR_RGB.bgLight);
          doc.rect(PAGE_LEFT, y, CONTENT_W, rowHeight, "F");
          doc.setDrawColor(...COLOR_RGB.border);
          doc.setLineWidth(0.3);
          doc.line(PAGE_LEFT, y + rowHeight, PAGE_RIGHT, y + rowHeight);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(fontSize);
          doc.setTextColor(...COLOR_RGB.muted);
          let cx = PAGE_LEFT;
          headers.forEach((h, i) => {
            doc.text(fitText(h.toUpperCase(), colWidths[i] - 3), cx + 2.5, y + rowHeight / 2 + 2);
            cx += colWidths[i];
          });
          y += rowHeight;
        };

        checkPageOverflow(rowHeight * 2);
        drawHeader();

        if (!rows || rows.length === 0) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(fontSize);
          doc.setTextColor(...COLOR_RGB.muted);
          doc.text("No data available", PAGE_LEFT + 3, y + rowHeight / 2 + 2);
          y += rowHeight + 4;
          return;
        }

        rows.forEach((row, ri) => {
          if (checkPageOverflow(rowHeight)) {
            drawHeader();
          }

          if (ri % 2 === 1) {
            doc.setFillColor(252, 253, 255);
            doc.rect(PAGE_LEFT, y, CONTENT_W, rowHeight, "F");
          }

          doc.setFont("helvetica", "normal");
          doc.setFontSize(fontSize);

          let cx = PAGE_LEFT;
          row.forEach((cell, i) => {
            if (cell && typeof cell === "object" && "text" in cell) {
              doc.setTextColor(...(cell.color || COLOR_RGB.text));
              doc.setFont("helvetica", cell.bold ? "bold" : "normal");
            } else {
              doc.setTextColor(...COLOR_RGB.text);
              doc.setFont("helvetica", "normal");
            }
            const cellText = cell && typeof cell === "object" ? cell.text : cell;
            doc.text(fitText(safeStr(cellText), colWidths[i] - 3), cx + 2.5, y + rowHeight / 2 + 2);
            cx += colWidths[i];
          });

          doc.setDrawColor(...COLOR_RGB.border);
          doc.setLineWidth(0.15);
          doc.line(PAGE_LEFT, y + rowHeight, PAGE_RIGHT, y + rowHeight);

          y += rowHeight;
        });

        y += 6;
      };

      const addChartImage = (title, dataUrl, imgWidthMm = 170, imgHeightMm = 75) => {
        if (!dataUrl) return false;
        checkPageOverflow(imgHeightMm + 12);

        if (title) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...COLOR_RGB.primary);
          doc.text(title, PAGE_LEFT, y);
          y += 5;
        }

        doc.setDrawColor(...COLOR_RGB.border);
        doc.setLineWidth(0.3);
        doc.roundedRect(PAGE_LEFT, y, imgWidthMm, imgHeightMm, 2, 2, "S");
        doc.addImage(dataUrl, "PNG", PAGE_LEFT + 1, y + 1, imgWidthMm - 2, imgHeightMm - 2);
        y += imgHeightMm + 8;
        return true;
      };

      // ==================================================
      // 1. COVER PAGE
      // ==================================================
      doc.setFillColor(...COLOR_RGB.primary);
      doc.rect(0, 0, 210, 297, "F");

      doc.setFillColor(...COLOR_RGB.accent);
      doc.rect(0, 0, 210, 8, "F");

      doc.setFontSize(26);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("RepoIQ AI", PAGE_LEFT, 55);

      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(147, 197, 253);
      doc.text("Repository Analysis Report", PAGE_LEFT, 65);

      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text("AI-powered repository intelligence and engineering analysis", PAGE_LEFT, 73);

      doc.setDrawColor(51, 65, 85);
      doc.setLineWidth(0.5);
      doc.line(PAGE_LEFT, 85, PAGE_RIGHT, 85);

      doc.setFillColor(30, 41, 59);
      doc.roundedRect(PAGE_LEFT, 100, CONTENT_W, 110, 4, 4, "F");

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("REPOSITORY METADATA", PAGE_LEFT + 10, 115);

      const metaItems = [
        ["Repository Name", repoName],
        ["Repository URL", repoUrl || "Data unavailable"],
        ["Report Date", new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })],
        ["Analysis Status", safeStr(data.status, "Completed")],
        ["Repository Owner", safeStr(data.owner, repoName.split("/")[0] || "-")],
        ["Current Branch", safeStr(data.branch || branches[0]?.name, "main")],
        ["Analyzed Commit", safeStr(data.commitSha || stats?.latestCommitSha, "-").substring(0, 10)],
      ];

      let metaY = 127;
      metaItems.forEach(([label, val]) => {
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(148, 163, 184);
        doc.text(label.toUpperCase(), PAGE_LEFT + 10, metaY);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(241, 245, 249);
        doc.text(fitText(val, 105), PAGE_LEFT + 55, metaY);
        metaY += 10;
      });

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Generated by RepoIQ AI Platform", PAGE_LEFT, 275);

      doc.addPage();
      y = 20;

      // ==================================================
      // 2. EXECUTIVE SUMMARY
      // ==================================================
      addHeading("Executive Summary", { eyebrow: "Overview" });

      if (summary) {
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLOR_RGB.text);
        const sumLines = doc.splitTextToSize(summary, CONTENT_W);
        doc.text(sumLines, PAGE_LEFT, y);
        y += sumLines.length * 5 + 6;
      }

      addHeading("Repository at a Glance", { subheading: true });
      addStatCards([
        { label: "Total Files", value: String(totalFiles), colorRgb: [37, 99, 235] },
        { label: "Lines of Code", value: totalLines.toLocaleString(), colorRgb: [79, 70, 229] },
        { label: "Total Commits", value: String(totalCommits), colorRgb: [13, 148, 136] },
        { label: "Contributors", value: String(contributorCount), colorRgb: [217, 119, 6] },
      ]);

      addStatCards([
        { label: "Additions", value: `+${totalAdditions.toLocaleString()}`, colorRgb: [22, 163, 74] },
        { label: "Deletions", value: `-${totalDeletions.toLocaleString()}`, colorRgb: [225, 29, 72] },
        { label: "Code Churn", value: totalChurn.toLocaleString(), colorRgb: [147, 51, 234] },
        { label: "Languages", value: String(languages.length), colorRgb: [2, 132, 199] },
      ]);

      // ==================================================
      // 3. PROJECT HEALTH
      // ==================================================
      addHeading("Project Health", { eyebrow: "Assessment" });

      const overallHealthScore = safeNum(
        health.score ?? stats?.healthScore,
        Math.max(40, 100 - hotspotList.length * 5 - (contributorCount <= 1 ? 20 : 0))
      );

      const healthGrade =
        overallHealthScore >= 85 ? "A" : overallHealthScore >= 70 ? "B" : overallHealthScore >= 55 ? "C" : "D";

      doc.setFillColor(...(healthGrade === "A" ? [236, 253, 245] : healthGrade === "B" ? [239, 246, 255] : [254, 243, 199]));
      doc.roundedRect(PAGE_LEFT, y, CONTENT_W, 22, 3, 3, "F");

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLOR_RGB.primary);
      doc.text(`Overall Health Score: ${overallHealthScore} / 100 (${healthGrade})`, PAGE_LEFT + 8, y + 14);

      y += 28;

      const healthDimensions = health.dimensions || [
        { name: "Maintainability", score: safeNum(health.maintainability, 80), category: "Good", explanation: "Calculated from file complexity and size metrics." },
        { name: "Architecture", score: safeNum(health.architecture, 75), category: "Moderate", explanation: "Module layer separation and dependency coupling." },
        { name: "Hotspot Pressure", score: safeNum(health.hotspots, Math.max(30, 100 - hotspotList.length * 10)), category: hotspotList.length > 5 ? "Needs Attention" : "Good", explanation: "Concentration of changes across core repository files." },
      ];

      addTable(
        ["Dimension", "Score", "Status", "Explanation"],
        healthDimensions.map((d) => [
          d.name,
          `${safeNum(d.score)}/100`,
          d.category || (d.score >= 75 ? "Good" : "Attention"),
          d.explanation || "-",
        ]),
        [35, 20, 30, 85]
      );

      // Render charts off-screen in parallel
      const [languageChartImg, contributorsChartImg, hotspotsChartImg, commitActivityChartImg] =
        await Promise.all([
          languages.length
            ? renderChartToImage({
                type: "doughnut",
                data: {
                  labels: languages.map((l) => l.language || l.name),
                  datasets: [
                    {
                      data: languages.map((l) => safeNum(l.percentage)),
                      backgroundColor: PALETTE.series,
                      borderWidth: 2,
                      borderColor: "#ffffff",
                    },
                  ],
                },
                options: { cutout: "68%", plugins: { legend: { position: "right" } } },
              })
            : Promise.resolve(null),

          contributorList.length
            ? renderChartToImage({
                type: "bar",
                data: {
                  labels: contributorList.slice(0, 8).map((c) => c.name || c.author || "Unknown"),
                  datasets: [
                    {
                      data: contributorList.slice(0, 8).map((c) => safeNum(c.commits)),
                      backgroundColor: PALETTE.series[0],
                      borderRadius: 4,
                    },
                  ],
                },
                options: {
                  indexAxis: "y",
                  plugins: { legend: { display: false } },
                  scales: { x: { grid: { color: "#F1F5F9" } }, y: { grid: { display: false } } },
                },
              })
            : Promise.resolve(null),

          hotspotList.length
            ? renderChartToImage({
                type: "bar",
                data: {
                  labels: hotspotList.slice(0, 8).map((h) => {
                    const p = h.file || h.path || "Unknown";
                    return p.length > 25 ? "…" + p.slice(-24) : p;
                  }),
                  datasets: [
                    {
                      data: hotspotList.slice(0, 8).map((h) => safeNum(h.changes ?? h.commitCount)),
                      backgroundColor: PALETTE.series[3],
                      borderRadius: 4,
                    },
                  ],
                },
                options: {
                  indexAxis: "y",
                  plugins: { legend: { display: false } },
                  scales: { x: { grid: { color: "#F1F5F9" } }, y: { grid: { display: false } } },
                },
              })
            : Promise.resolve(null),

          codeEvolution && codeEvolution.length
            ? renderChartToImage({
                type: "line",
                data: {
                  labels: codeEvolution.map((c) => c.date || ""),
                  datasets: [
                    {
                      data: codeEvolution.map((c) => safeNum(c.commits)),
                      borderColor: PALETTE.series[1],
                      backgroundColor: PALETTE.series[1] + "1A",
                      fill: true,
                      tension: 0.3,
                    },
                  ],
                },
                options: {
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, grid: { color: "#F1F5F9" } }, x: { grid: { display: false } } },
                },
              })
            : Promise.resolve(null),
        ]);

      // ==================================================
      // 4. CONTRIBUTOR ANALYSIS
      // ==================================================
      addHeading("Contributor Analysis", { eyebrow: "Team" });
      addLine("Total Contributors", String(contributorCount));
      addLine("Average Commits / Contributor", String(avgCommitsPerContributor));

      addTable(
        ["Rank", "Contributor", "Commits", "Additions", "Deletions", "Churn"],
        contributorList.slice(0, 10).map((c, i) => {
          const add = safeNum(c.additions);
          const del = safeNum(c.deletions);
          return [
            i + 1,
            c.name || c.author || "Unknown",
            safeNum(c.commits),
            `+${add.toLocaleString()}`,
            `-${del.toLocaleString()}`,
            (add + del).toLocaleString(),
          ];
        }),
        [15, 55, 25, 25, 25, 25]
      );

      addChartImage("Top Contributor Commit Impact", contributorsChartImg);

      // ==================================================
      // 5. COMMIT & DEVELOPMENT ACTIVITY
      // ==================================================
      addHeading("Commit & Development Activity", { eyebrow: "Velocity" });
      addLine("Total Commits Analyzed", String(totalCommits));

      addHeading("Recent Commits", { subheading: true });
      addTable(
        ["Date", "Author", "Commit Message", "Additions", "Deletions"],
        commitList.map((c) => [
          c.date ? new Date(c.date).toLocaleDateString() : "-",
          c.author_name || c.author || "Developer",
          c.message || "Commit update",
          `+${safeNum(c.additions)}`,
          `-${safeNum(c.deletions)}`,
        ]),
        [25, 35, 70, 20, 20]
      );

      // ==================================================
      // 6. CODEBASE / FILE ANALYSIS
      // ==================================================
      addHeading("Codebase & File Analysis", { eyebrow: "Metrics" });

      addHeading("Largest Files", { subheading: true });
      addTable(
        ["Rank", "File Path", "Lines", "Size", "Changes"],
        largestFiles.slice(0, 8).map((f, i) => [
          i + 1,
          f.path || f.name || "Unknown",
          safeNum(f.lines).toLocaleString(),
          f.size ? `${(safeNum(f.size) / 1024).toFixed(1)} KB` : "-",
          safeNum(f.changes),
        ]),
        [12, 98, 20, 20, 20]
      );

      addHeading("Most Modified Files", { subheading: true });
      addTable(
        ["Rank", "File Path", "Changes", "Additions", "Deletions", "Churn"],
        mostChangedFiles.slice(0, 8).map((f, i) => {
          const add = safeNum(f.additions);
          const del = safeNum(f.deletions);
          return [
            i + 1,
            f.path || f.name || "Unknown",
            safeNum(f.changes),
            `+${add.toLocaleString()}`,
            `-${del.toLocaleString()}`,
            (f.churn ?? add + del).toLocaleString(),
          ];
        }),
        [12, 88, 20, 25, 25, 20]
      );

      // Aggregate File-Level Constructs if available
      const aggregatedMetrics = (() => {
        if (!allFiles.length) return null;
        const res = { functions: 0, classes: 0, asyncFunctions: 0, todos: 0, consoleLogs: 0 };
        let found = false;
        allFiles.forEach((file) => {
          const m = file.metrics || {};
          if (m.functions || m.classes || m.asyncFunctions || m.todos || m.consoleLogs) {
            found = true;
            res.functions += safeNum(m.functions);
            res.classes += safeNum(m.classes);
            res.asyncFunctions += safeNum(m.asyncFunctions);
            res.todos += safeNum(m.todos);
            res.consoleLogs += safeNum(m.consoleLogs);
          }
        });
        return found ? res : null;
      })();

      if (aggregatedMetrics) {
        addHeading("Codebase Construct Overview", { subheading: true });
        addTable(
          ["Construct / Quality Metric", "Detected Count"],
          [
            ["Functions / Methods", aggregatedMetrics.functions.toLocaleString()],
            ["Classes", aggregatedMetrics.classes.toLocaleString()],
            ["Async Functions", aggregatedMetrics.asyncFunctions.toLocaleString()],
            ["TODO Annotations", aggregatedMetrics.todos.toLocaleString()],
            ["Console Logs", aggregatedMetrics.consoleLogs.toLocaleString()],
          ],
          [120, 50]
        );
      }

      // ==================================================
      // 7. LANGUAGE ANALYSIS
      // ==================================================
      addHeading("Language Breakdown", { eyebrow: "Stack" });
      addTable(
        ["Language", "File Count", "Percentage"],
        languages.map((l) => [
          l.language || l.name,
          safeStr(l.files ?? l.fileCount),
          `${safeNum(l.percentage)}%`,
        ]),
        [80, 45, 45]
      );
      addChartImage("Technology & Language Distribution", languageChartImg);

      // ==================================================
      // 8. TECHNICAL FOCUS
      // ==================================================
      addHeading("Technical Focus", { eyebrow: "Architecture Focus" });

      if (technicalFocus && Array.isArray(technicalFocus) && technicalFocus.length > 0) {
        addTable(
          ["Category", "Focus Percentage"],
          technicalFocus.map((tf) => [tf.category, `${safeNum(tf.percentage)}%`]),
          [100, 70]
        );
      } else {
        addLine("Technical Focus Status", "Technical focus data is not available for this analysis.");
      }

      // ==================================================
      // 9. HOTSPOT ANALYSIS
      // ==================================================
      addHeading("Hotspot Analysis", { eyebrow: "Risk" });
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...COLOR_RGB.muted);
      doc.text(
        "Hotspots identify files receiving high development activity and change pressure.",
        PAGE_LEFT,
        y
      );
      y += 6;

      addTable(
        ["Rank", "File Path", "Risk Level", "Changes", "Churn", "Contributors"],
        hotspotList.slice(0, 10).map((h, i) => {
          const risk = h.risk || h.riskLevel || (i < 2 ? "High" : "Medium");
          const color =
            risk === "High"
              ? COLOR_RGB.primary
              : PRIORITY_STYLES[risk.toUpperCase()]?.fg || COLOR_RGB.text;
          return [
            i + 1,
            h.file || h.path || "Unknown",
            { text: risk, color, bold: true },
            safeNum(h.changes ?? h.commitCount),
            safeNum(h.churn).toLocaleString(),
            safeNum(h.contributors || 1),
          ];
        }),
        [12, 78, 25, 18, 18, 19]
      );

      addChartImage("Hotspot Change Pressure", hotspotsChartImg);

      // ==================================================
      // 10. CODE EVOLUTION
      // ==================================================
      if (codeEvolution && codeEvolution.length > 0) {
        addHeading("Code Evolution", { eyebrow: "History" });
        addChartImage("Commit Velocity Over Time", commitActivityChartImg);
      }

      // ==================================================
      // 11. ARCHITECTURE
      // ==================================================
      if (architecture) {
        addHeading("Architecture & Structure", { eyebrow: "Layout" });

        if (typeof architecture === "string") {
          doc.setFontSize(8.5);
          doc.setFont("courier", "normal");
          const archLines = doc.splitTextToSize(architecture, CONTENT_W);
          checkPageOverflow(archLines.length * 4.5);
          doc.text(archLines, PAGE_LEFT, y);
          y += archLines.length * 4.5 + 6;
        } else if (Array.isArray(architecture.structure || architecture.directories)) {
          const dirs = architecture.structure || architecture.directories;
          addTable(
            ["Directory / Module", "Description / Purpose"],
            dirs.map((d) => [d.name || d.path, d.description || d.type || "Source Module"]),
            [60, 110]
          );
        }
      }

      // ==================================================
      // 12. BRANCH ANALYSIS
      // ==================================================
      if (branchList.length > 0) {
        addHeading("Branch Analysis", { eyebrow: "Git Branches" });
        addTable(
          ["Branch Name", "Status", "Latest Commit"],
          branchList.slice(0, 8).map((b) => [
            b.name || "branch",
            b.isCurrent ? "Current" : "Active",
            safeStr(b.commitSha || b.sha, "-").substring(0, 8),
          ]),
          [70, 40, 60]
        );
      }

      // ==================================================
      // 13. AI REPOSITORY SUMMARY
      // ==================================================
      addHeading("AI Repository Summary", { eyebrow: "Intelligence" });

      const aiRepoSummary = insights?.repositorySummary || summary || null;

      if (aiRepoSummary) {
        if (typeof aiRepoSummary === "string") {
          addBullets([aiRepoSummary]);
        } else if (typeof aiRepoSummary === "object") {
          if (aiRepoSummary.purpose) addLine("Repository Purpose", aiRepoSummary.purpose);
          if (aiRepoSummary.mainStack) addLine("Main Technologies", aiRepoSummary.mainStack);
          if (aiRepoSummary.activityOverview) addLine("Development Activity", aiRepoSummary.activityOverview);
          if (aiRepoSummary.criticalAreas) addLine("Important Code Areas", aiRepoSummary.criticalAreas);
          if (aiRepoSummary.healthSummary) addLine("Current Repository Health", aiRepoSummary.healthSummary);
        }
      } else {
        addLine("Repository Purpose", `Mainly uses ${languages[0]?.language || "software engineering constructs"} across ${totalFiles} tracked files.`);
        addLine("Main Stack", languages.map((l) => l.language || l.name).join(", ") || "Data unavailable");
        addLine("Overall Activity", `${totalCommits} total commits made by ${contributorCount} contributor(s).`);
        addLine("Repository Health", `Calculated overall health score: ${overallHealthScore}/100.`);
      }

      // ==================================================
      // 14. KEY FINDINGS
      // ==================================================
      addHeading("Key Findings", { eyebrow: "Observations" });

      const defaultFindings = {
        strengths: [
          languages.length > 0 ? `Structured codebase utilizing ${languages.map((l) => l.language).slice(0, 3).join(", ")}.` : "Active version history recorded.",
          totalCommits > 50 ? "Substantial commit history available for change velocity tracking." : "Compact codebase with focused domain execution.",
        ],
        concerns: [
          contributorCount <= 1 ? "Single contributor represents a critical bus-factor vulnerability." : "Concentrated development activity in major hotspot files.",
          hotspotList.length > 3 ? "Multiple files experiencing frequent modification pressure." : "Low automated testing coverage detected.",
        ],
        patterns: [
          `Primary additions (+${totalAdditions.toLocaleString()}) exceed total deletions (-${totalDeletions.toLocaleString()}).`,
        ],
        risks: [
          hotspotList[0] ? `High churn pressure focused on ${hotspotList[0]?.file || hotspotList[0]?.path}.` : "Moderate maintainability risk.",
        ],
      };

      const findingsData = keyFindings || insights?.keyFindings || defaultFindings;

      if (findingsData.strengths?.length) {
        addHeading("1. Strengths", { subheading: true });
        addBullets(findingsData.strengths);
      }
      if (findingsData.concerns?.length) {
        addHeading("2. Areas of Concern", { subheading: true });
        addBullets(findingsData.concerns);
      }
      if (findingsData.patterns?.length) {
        addHeading("3. Development Patterns", { subheading: true });
        addBullets(findingsData.patterns);
      }
      if (findingsData.risks?.length) {
        addHeading("4. Technical Risks", { subheading: true });
        addBullets(findingsData.risks);
      }

      // ==================================================
      // 15. AI RECOMMENDATIONS
      // ==================================================
      addHeading("AI Recommendations", { eyebrow: "Action Items" });

      const defaultRecs = [
        {
          priority: "HIGH",
          recommendation: "Refactor High-Churn Hotspot Files",
          reason: hotspotList[0] ? `File '${hotspotList[0]?.file || hotspotList[0]?.path}' experiences disproportionate change pressure.` : "Core files receive frequent modifications.",
          expectedImpact: "Reduced regression bugs and improved code maintainability.",
          suggestedAction: "Break down large modules into isolated, single-responsibility services.",
        },
        {
          priority: "MEDIUM",
          recommendation: "Expand Automated Unit & Integration Testing",
          reason: "Automated test coverage metrics are below target thresholds.",
          expectedImpact: "Higher code confidence during frequent deployments.",
          suggestedAction: "Set up test suite execution in continuous integration pipelines.",
        },
      ];

      const recList = (recommendations.length ? recommendations : insights?.recommendations || defaultRecs);

      recList.forEach((r) => {
        const prio = (r.priority || "MEDIUM").toUpperCase();
        const style = PRIORITY_STYLES[prio] || PRIORITY_STYLES.MEDIUM;

        checkPageOverflow(32);

        doc.setFillColor(...style.bg);
        doc.roundedRect(PAGE_LEFT, y, CONTENT_W, 28, 2, 2, "F");
        doc.setDrawColor(...COLOR_RGB.border);
        doc.setLineWidth(0.3);
        doc.roundedRect(PAGE_LEFT, y, CONTENT_W, 28, 2, 2, "S");

        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...style.fg);
        doc.text(`[${prio}] ${r.recommendation || r.title || "Recommendation"}`, PAGE_LEFT + 4, y + 6);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLOR_RGB.text);
        doc.setFontSize(8);
        doc.text(`Reason: ${fitText(r.reason || "-", 130)}`, PAGE_LEFT + 4, y + 12);
        doc.text(`Impact: ${fitText(r.expectedImpact || "-", 130)}`, PAGE_LEFT + 4, y + 17);
        doc.text(`Action: ${fitText(r.suggestedAction || r.action || "-", 130)}`, PAGE_LEFT + 4, y + 22);

        y += 32;
      });

      // ==================================================
      // 16. RISKS & AREAS FOR IMPROVEMENT
      // ==================================================
      addHeading("Risks & Areas for Improvement", { eyebrow: "Risk Audit" });

      const defaultRisks = [
        {
          risk: "Bus-Factor Concentration",
          severity: contributorCount <= 1 ? "HIGH" : "LOW",
          evidence: `${contributorCount} contributor(s) responsible for commit velocity.`,
          action: "Distribute knowledge across maintainers.",
        },
        {
          risk: "Hotspot Churn Accumulation",
          severity: hotspotList.length > 3 ? "HIGH" : "MEDIUM",
          evidence: `${hotspotList.length} hotspots detected in core repository path.`,
          action: "Decompose high-churn files into modular components.",
        },
      ];

      const riskList = (risks.length ? risks : defaultRisks);

      addTable(
        ["Risk Category", "Severity", "Evidence", "Recommended Action"],
        riskList.map((rk) => {
          const sev = (rk.severity || "MEDIUM").toUpperCase();
          const color = SEVERITY_STYLES[sev] || COLOR_RGB.text;
          return [
            rk.risk || "Risk Factor",
            { text: sev, color, bold: true },
            rk.evidence || "-",
            rk.action || rk.recommendedAction || "-",
          ];
        }),
        [40, 22, 53, 55]
      );

      // ==================================================
      // 17. IMPORTANT FILES
      // ==================================================
      const keyFilesList = importantFiles.length
        ? importantFiles
        : hotspotList.slice(0, 5).map((h) => ({
            path: h.file || h.path,
            type: "Hotspot Candidate",
            changes: h.changes ?? h.commitCount,
          }));

      if (keyFilesList.length > 0) {
        addHeading("Important Codebase Files", { eyebrow: "Key Assets" });
        addTable(
          ["File Path", "Type / Context", "Changes / Metric"],
          keyFilesList.slice(0, 8).map((f) => [
            f.path || f.name || "Unknown",
            f.type || "Critical Component",
            safeStr(f.changes || f.lines || "-"),
          ]),
          [90, 50, 30]
        );
      }

      // ==================================================
      // 18. FINAL ENGINEERING CONCLUSION
      // ==================================================
      addHeading("Final Engineering Conclusion", { eyebrow: "Conclusion" });

      const conc = conclusion || {
        overallAssessment: `The repository '${repoName}' demonstrates an overall health score of ${overallHealthScore}/100 based on ${totalFiles} tracked files and ${totalCommits} commits.`,
        workingWell: [
          `Clear main language implementation in ${languages[0]?.language || "the primary stack"}.`,
          `Recorded commit activity spanning ${totalCommits} total changes.`,
        ],
        needsAttention: [
          contributorCount <= 1 ? "Concentration of commit velocity under a single maintainer." : "Hotspot change pressure in core module files.",
        ],
        topPriorities: [
          "1. Decompose primary hotspot files to lower maintainability pressure.",
          "2. Establish automated testing in CI pipelines.",
          "3. Improve architectural module boundary separation.",
        ],
        nextSteps: [
          "Review identified high-priority recommendations with the engineering team.",
          "Track hotspot evolution across future commit milestones.",
        ],
      };

      if (conc.overallAssessment) {
        addHeading("Overall Assessment", { subheading: true });
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        const concLines = doc.splitTextToSize(conc.overallAssessment, CONTENT_W);
        doc.text(concLines, PAGE_LEFT, y);
        y += concLines.length * 4.5 + 4;
      }

      if (conc.workingWell?.length) {
        addHeading("What is Working Well", { subheading: true });
        addBullets(conc.workingWell);
      }

      if (conc.needsAttention?.length) {
        addHeading("What Needs Attention", { subheading: true });
        addBullets(conc.needsAttention);
      }

      if (conc.topPriorities?.length) {
        addHeading("Top Priorities", { subheading: true });
        addBullets(conc.topPriorities);
      }

      if (conc.nextSteps?.length) {
        addHeading("Next Steps", { subheading: true });
        addBullets(conc.nextSteps);
      }

      // ==================================================
      // FOOTER & PAGE NUMBERS (ALL PAGES)
      // ==================================================
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        if (i === 1) continue; // Skip header/footer on cover page

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLOR_RGB.muted);

        // Top Header
        doc.text("RepoIQ AI — Executive Engineering Report", PAGE_LEFT, 12);
        doc.setDrawColor(...COLOR_RGB.border);
        doc.setLineWidth(0.2);
        doc.line(PAGE_LEFT, 14, PAGE_RIGHT, 14);

        // Bottom Footer
        doc.line(PAGE_LEFT, 283, PAGE_RIGHT, 283);
        doc.text(`Repository: ${repoName}`, PAGE_LEFT, 288);
        doc.text(`Page ${i} of ${totalPages}`, PAGE_RIGHT, 288, { align: "right" });
      }

      doc.save(`${repoName.replace(/[\\/]/g, "_")}_RepoIQ_Analysis.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF report:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={downloadReport}
      disabled={isGenerating}
      className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm border border-slate-700/50 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
    >
      {isGenerating ? (
        <svg className="w-4 h-4 animate-spin text-slate-300" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      {isGenerating ? "Generating Report PDF..." : "Download Report PDF"}
    </button>
  );
}

export default DownloadRepositoryReport;