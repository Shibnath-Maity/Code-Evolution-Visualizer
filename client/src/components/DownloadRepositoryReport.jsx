import jsPDF from "jspdf";
import Chart from "chart.js/auto";

// ===========================
// Design tokens
// ===========================
// Chart series palette — navy/teal/amber/rose editorial set, kept off the
// generic "AI report" defaults (no cream+terracotta, no neon-on-black).
const PALETTE = [
  "#1E40AF", "#0F766E", "#B45309", "#9F1239",
  "#4338CA", "#0891B2", "#65A30D", "#7C2D12",
  "#4C1D95", "#0369A1",
];

// Text/UI colors used throughout the PDF (RGB triples for jsPDF)
const COLOR_PRIMARY = [15, 23, 42]; // slate-900 — headings, cover title
const COLOR_ACCENT = [15, 118, 110]; // teal-700 — divider lines, section rules
const COLOR_GOLD = [180, 131, 33]; // muted gold — the report's single signature accent
const COLOR_TEXT = [30, 41, 59]; // slate-800 — body copy
const COLOR_MUTED = [100, 116, 139]; // slate-500 — labels, footer, meta text
const COLOR_BG_LIGHT = [247, 249, 252]; // near-white — card & zebra-row fill
const COLOR_BORDER = [226, 232, 240]; // slate-200 — hairlines

const GRADE_COLORS = {
  A: { fg: [5, 150, 105], bg: [209, 250, 229] },
  B: { fg: [5, 150, 105], bg: [209, 250, 229] },
  C: { fg: [180, 83, 9], bg: [254, 243, 199] },
  D: { fg: [190, 18, 60], bg: [254, 226, 226] },
  F: { fg: [190, 18, 60], bg: [254, 226, 226] },
};

/**
 * Renders a Chart.js chart off-screen and returns a PNG data URL.
 * Uses animation:false + double rAF to guarantee the canvas is painted
 * before we read it back out, without needing html2canvas.
 */
function renderChartToImage(config, width = 600, height = 360) {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const chart = new Chart(canvas, {
        ...config,
        options: {
          ...config.options,
          responsive: false,
          animation: false,
          devicePixelRatio: 2, // sharper output in the PDF
          font: { family: "Georgia, 'Times New Roman', serif" },
        },
      });

      // Wait two animation frames so the canvas is fully painted
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

function DownloadRepositoryReport({
  repoUrl,
  stats,
  contributors,
  fileAnalysis,
  languageAnalysis,
  architecture,
  codeEvolution,
  hotspots,
  recentCommits,
}) {
  const downloadReport = async () => {
    const doc = new jsPDF();

    let y = 20;
    const PAGE_RIGHT = 190;
    const PAGE_LEFT = 20;
    const CONTENT_W = 170;

    // ===========================
    // Helper Functions
    // ===========================

    // Trims text with an ellipsis so it fits a column/box width exactly,
    // measured against the currently-set font (call after setFont/setFontSize).
    const fitText = (text, maxWidthMm) => {
      let t = String(text ?? "");
      if (doc.getTextWidth(t) <= maxWidthMm) return t;
      while (t.length > 1 && doc.getTextWidth(t + "…") > maxWidthMm) {
        t = t.slice(0, -1);
      }
      return t + "…";
    };

    const addHeading = (text, { subheading = false, eyebrow = null } = {}) => {
      const blockHeight = subheading ? 12 : 18;

      if (y + blockHeight > 280) {
        doc.addPage();
        y = 20;
      }

      if (subheading) {
        doc.setFontSize(12.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLOR_PRIMARY);
        doc.text(text, PAGE_LEFT, y);
        y += 9;
      } else {
        if (eyebrow) {
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...COLOR_ACCENT);
          doc.text(eyebrow.toUpperCase(), PAGE_LEFT, y);
          y += 6;
        }

        doc.setFontSize(19);
        doc.setFont("times", "bold");
        doc.setTextColor(...COLOR_PRIMARY);
        doc.text(text, PAGE_LEFT, y);

        // Short gold signature tick + long teal rule under the heading
        y += 3;
        doc.setDrawColor(...COLOR_GOLD);
        doc.setLineWidth(1.2);
        doc.line(PAGE_LEFT, y, PAGE_LEFT + 10, y);
        doc.setDrawColor(...COLOR_ACCENT);
        doc.setLineWidth(0.4);
        doc.line(PAGE_LEFT + 12, y, PAGE_RIGHT, y);
        y += 9;
      }

      doc.setTextColor(...COLOR_TEXT);
      doc.setFont("helvetica", "normal");
    };

    const addLine = (label, value) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(11);
      const labelText = `${label}`;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLOR_ACCENT);
      doc.text(labelText, PAGE_LEFT, y);

      const labelWidth = doc.getTextWidth(labelText) + 4;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLOR_TEXT);

      const lines = doc.splitTextToSize(String(value), CONTENT_W - labelWidth);
      doc.text(lines, PAGE_LEFT + labelWidth, y);

      y += Math.max(lines.length * 6.5, 6.5) + 1;
    };

    // Four-across KPI cards with a colored top accent strip.
    const addStatCards = (cards) => {
      const cardW = 39;
      const cardH = 28;
      const gap = (CONTENT_W - cardW * cards.length) / (cards.length - 1);

      if (y + cardH + 10 > 285) {
        doc.addPage();
        y = 20;
      }

      cards.forEach((c, i) => {
        const cx = PAGE_LEFT + i * (cardW + gap);

        doc.setFillColor(...COLOR_BG_LIGHT);
        doc.roundedRect(cx, y, cardW, cardH, 1.5, 1.5, "F");
        doc.setFillColor(...c.color);
        doc.roundedRect(cx, y, cardW, 1.6, 0.8, 0.8, "F");

        doc.setFont("times", "bold");
        doc.setFontSize(19);
        doc.setTextColor(...COLOR_PRIMARY);
        doc.text(String(c.value), cx + cardW / 2, y + 15, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...COLOR_MUTED);
        doc.text(c.label.toUpperCase(), cx + cardW / 2, y + 22, { align: "center" });
      });

      y += cardH + 10;
    };

    // Grade badge (pill) + big score, used for the Project Health section.
    const addHealthBadge = (score, grade) => {
      const colors = GRADE_COLORS[grade] || { fg: COLOR_MUTED, bg: COLOR_BG_LIGHT };

      if (y + 34 > 285) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(...colors.bg);
      doc.roundedRect(PAGE_LEFT, y, 28, 28, 3, 3, "F");
      doc.setFont("times", "bold");
      doc.setFontSize(21);
      doc.setTextColor(...colors.fg);
      doc.text(grade, PAGE_LEFT + 14, y + 18, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(...COLOR_PRIMARY);
      doc.text(`${score} / 100`, PAGE_LEFT + 36, y + 12);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...COLOR_MUTED);
      doc.text("Overall Health Score", PAGE_LEFT + 36, y + 19);

      y += 34;
    };

    // Full data table: navy header row, zebra-striped body, hairline row borders.
    // colWidths (mm) must sum to 170.
    const addTable = (headers, rows, colWidths, { rowHeight = 8, fontSize = 9.5 } = {}) => {
      const drawHeader = () => {
        doc.setFillColor(...COLOR_PRIMARY);
        doc.rect(PAGE_LEFT, y, CONTENT_W, rowHeight, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(fontSize);
        doc.setTextColor(255, 255, 255);
        let cx = PAGE_LEFT;
        headers.forEach((h, i) => {
          doc.text(fitText(h, colWidths[i] - 4), cx + 3, y + rowHeight / 2 + 3);
          cx += colWidths[i];
        });
        y += rowHeight;
      };

      if (y + rowHeight * 2 > 285) {
        doc.addPage();
        y = 20;
      }
      drawHeader();

      if (rows.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(fontSize);
        doc.setTextColor(...COLOR_MUTED);
        doc.text("No data available", PAGE_LEFT + 3, y + rowHeight / 2 + 3);
        y += rowHeight + 8;
        return;
      }

      rows.forEach((row, ri) => {
        if (y + rowHeight > 285) {
          doc.addPage();
          y = 20;
          drawHeader();
        }

        if (ri % 2 === 1) {
          doc.setFillColor(...COLOR_BG_LIGHT);
          doc.rect(PAGE_LEFT, y, CONTENT_W, rowHeight, "F");
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(fontSize);
        doc.setTextColor(...COLOR_TEXT);
        let cx = PAGE_LEFT;
        row.forEach((cell, i) => {
          doc.text(fitText(cell, colWidths[i] - 4), cx + 3, y + rowHeight / 2 + 3);
          cx += colWidths[i];
        });

        doc.setDrawColor(...COLOR_BORDER);
        doc.setLineWidth(0.2);
        doc.line(PAGE_LEFT, y + rowHeight, PAGE_RIGHT, y + rowHeight);

        y += rowHeight;
      });

      y += 8;
    };

    // Adds a chart image with a caption, starting a new page if it won't fit.
    const addChartImage = (title, dataUrl, imgWidthMm = 170, imgHeightMm = 96) => {
      if (!dataUrl) return false;

      if (y + imgHeightMm + 18 > 285) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLOR_PRIMARY);
      doc.text(title, PAGE_LEFT, y);
      y += 3;
      doc.setDrawColor(...COLOR_BORDER);
      doc.setLineWidth(0.3);
      doc.line(PAGE_LEFT, y, PAGE_RIGHT, y);
      doc.setTextColor(...COLOR_TEXT);
      doc.setFont("helvetica", "normal");
      y += 6;

      doc.setDrawColor(...COLOR_BORDER);
      doc.setLineWidth(0.3);
      doc.rect(PAGE_LEFT - 1, y - 1, imgWidthMm + 2, imgHeightMm + 2);
      doc.addImage(dataUrl, "PNG", PAGE_LEFT, y, imgWidthMm, imgHeightMm);
      y += imgHeightMm + 14;

      return true;
    };

    // ===========================
    // Cover
    // ===========================

    doc.setFillColor(...COLOR_PRIMARY);
    doc.rect(0, 0, 210, 48, "F");

    // Gold signature rule — the one bold accent, echoed in every heading tick
    doc.setFillColor(...COLOR_GOLD);
    doc.rect(0, 48, 210, 1.4, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR_GOLD);
    doc.text("REPOSITORY ANALYSIS", PAGE_LEFT, 16);

    doc.setFontSize(27);
    doc.setFont("times", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Repository Analysis Report", PAGE_LEFT, 30);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(191, 219, 254); // light blue
    doc.text(repoUrl || "Repository URL not provided", PAGE_LEFT, 40);

    doc.setTextColor(...COLOR_TEXT);
    y = 62;

    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...COLOR_MUTED);
    doc.text(`Generated ${new Date().toLocaleString()}`, PAGE_LEFT, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLOR_TEXT);

    y += 16;

    // ===========================
    // Repository Statistics
    // ===========================

    addHeading("Repository Statistics", { eyebrow: "Overview" });

    addStatCards([
      { label: "Total Commits", value: stats?.totalCommits || 0, color: PALETTE[0] },
      { label: "Contributors", value: Object.keys(contributors || {}).length, color: PALETTE[1] },
      { label: "Files", value: fileAnalysis?.totalFiles || 0, color: PALETTE[2] },
      { label: "Hotspots", value: hotspots?.length || 0, color: PALETTE[3] },
    ]);

    // ===========================
    // Project Health Score
    // ===========================

    addHeading("Project Health Score", { eyebrow: "Diagnostics" });

    const calculateHealthScore = () => {
      if (typeof stats?.healthScore === "number") {
        return Math.round(stats.healthScore);
      }

      let score = 100;
      const contributorCount = Object.keys(contributors || {}).length;
      const totalFiles = fileAnalysis?.totalFiles || 0;
      const hotspotCount = hotspots?.length || 0;

      if (contributorCount === 1) score -= 25;
      else if (contributorCount <= 3) score -= 10;

      if (totalFiles > 0) {
        const hotspotRatio = hotspotCount / totalFiles;
        if (hotspotRatio > 0.3) score -= 20;
        else if (hotspotRatio > 0.15) score -= 10;
      }

      if (!stats?.totalCommits) score -= 15;

      return Math.max(0, Math.min(100, score));
    };

    const getGrade = (score) => {
      if (score >= 90) return "A";
      if (score >= 80) return "B";
      if (score >= 70) return "C";
      if (score >= 60) return "D";
      return "F";
    };

    const healthScore = calculateHealthScore();
    const healthGrade = getGrade(healthScore);
    const contributorCount = Object.keys(contributors || {}).length;

    addHealthBadge(healthScore, healthGrade);

    addLine(
      "Bus Factor Risk",
      contributorCount <= 1
        ? "High (single contributor)"
        : contributorCount <= 3
        ? "Moderate"
        : "Low"
    );

    let hotspotRatioPct = 0;
    if (fileAnalysis?.totalFiles) {
      hotspotRatioPct = ((hotspots?.length || 0) / fileAnalysis.totalFiles) * 100;
      addLine("Hotspot Concentration", `${hotspotRatioPct.toFixed(1)}% of files`);
    }

    y += 6;

    // ===========================
    // Language Distribution
    // ===========================

    addHeading("Language Distribution", { eyebrow: "Composition" });

    const languages = languageAnalysis?.languages || [];

    addTable(
      ["#", "Language", "%", "Files"],
      languages.map((lang, i) => [i + 1, lang.language, `${lang.percentage}%`, lang.files]),
      [15, 90, 35, 30]
    );

    // ===========================
    // Repository Architecture
    // ===========================

    addHeading("Repository Architecture", { eyebrow: "Structure" });

    if (!architecture) {
      addLine("Info", "Architecture not available");
    } else {
      addLine("Repository Name", architecture.name || "Unknown");
      addLine("Total Root Folders", architecture.folders?.length || 0);
      addLine("Total Root Files", architecture.files?.length || 0);
      y += 4;

      if (architecture.folders?.length) {
        addHeading("Root Folders", { subheading: true });
        addTable(
          ["#", "Name"],
          architecture.folders.map((f, i) => [i + 1, f.name]),
          [20, 150]
        );
      }

      if (architecture.files?.length) {
        addHeading("Root Files", { subheading: true });
        addTable(
          ["#", "Name"],
          architecture.files.map((f, i) => [i + 1, f.name]),
          [20, 150]
        );
      }
    }

    // ===========================
    // Recent Commits
    // ===========================

    addHeading("Recent Commits", { eyebrow: "Activity" });

    const commits = (recentCommits || []).slice(0, 10);

    addTable(
      ["#", "Commit Message", "Author", "Date", "Hash"],
      commits.map((c, i) => [
        i + 1,
        c.message || "No commit message",
        c.author_name || c.author || "Unknown",
        c.date ? new Date(c.date).toLocaleDateString() : "Unknown",
        c.hash ? c.hash.substring(0, 7) : "-",
      ]),
      [10, 70, 40, 35, 15]
    );

    // ===========================
    // Code Evolution
    // ===========================

    addHeading("Code Evolution", { eyebrow: "Trend" });

    addTable(
      ["#", "Date", "Commits"],
      (codeEvolution || []).slice(0, 10).map((item, i) => [i + 1, item.date || "Unknown", item.commits || 0]),
      [15, 90, 65]
    );

    // ===========================
    // Contributors
    // ===========================

    addHeading("Contributors", { eyebrow: "Team" });

    const contributorList = Object.values(contributors || {});

    addTable(
      ["#", "Contributor", "Commits"],
      contributorList.map((c, i) => [i + 1, c.name || "Unknown", c.commits || 0]),
      [15, 120, 35]
    );

    // ===========================
    // Most Changed Files
    // ===========================

    addHeading("Most Changed Files", { eyebrow: "Churn" });

    const changedFiles = fileAnalysis?.mostChangedFiles || [];

    addTable(
      ["#", "File", "Changes"],
      changedFiles.slice(0, 10).map((f, i) => [i + 1, f.file, f.changes]),
      [15, 120, 35]
    );

    // ===========================
    // Top Hotspots
    // ===========================

    addHeading("Top Hotspots", { eyebrow: "Risk" });

    const hotspotList = (hotspots || []).slice(0, 10);

    addTable(
      ["#", "File", "Changes"],
      hotspotList.map((h, i) => [
        i + 1,
        h.file || h.path || "Unknown file",
        h.changes ?? h.commitCount ?? h.count ?? 0,
      ]),
      [15, 120, 35]
    );

    // ===========================
    // Summary
    // ===========================

    addHeading("Summary", { eyebrow: "Recap" });

    addLine("Repository Health", `${healthScore}/100 (${healthGrade})`);
    addLine("Total Files", fileAnalysis?.totalFiles || 0);
    addLine("Languages", languageAnalysis?.languages?.length || 0);
    addLine("Recent Activity", recentCommits?.length || 0);
    addLine(
      "Overall Status",
      healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : "Needs Improvement"
    );

    y += 6;

    // ===========================
    // Recommendations
    // ===========================

    addHeading("Recommendations", { eyebrow: "Next Steps" });

    const recommendations = [];

    if ((hotspots?.length || 0) > 10) {
      recommendations.push(["Hotspots", "Refactor highly modified files."]);
    }
    if (contributorCount <= 1) {
      recommendations.push(["Bus Factor", "Increase contributor participation."]);
    }
    if ((stats?.totalCommits || 0) < 20) {
      recommendations.push(["Commit Activity", "Increase development frequency."]);
    }
    if ((languageAnalysis?.languages?.length || 0) === 1) {
      recommendations.push(["Languages", "Project uses a single language."]);
    }

    if (recommendations.length === 0) {
      addLine("Info", "No specific recommendations — repository looks healthy.");
    } else {
      recommendations.forEach(([label, value]) => addLine(label, value));
    }

    // ===========================================================
    // Visual Analytics — build chart images, then lay out the page
    // ===========================================================

    const [languageChartImg, contributorsChartImg, hotspotsChartImg, commitActivityChartImg] =
      await Promise.all([
        languages.length
          ? renderChartToImage({
              type: "pie",
              data: {
                labels: languages.map((l) => l.language),
                datasets: [
                  {
                    data: languages.map((l) => l.percentage),
                    backgroundColor: languages.map((_, i) => PALETTE[i % PALETTE.length]),
                    borderColor: "#ffffff",
                    borderWidth: 2,
                  },
                ],
              },
              options: {
                plugins: {
                  legend: {
                    position: "right",
                    labels: { font: { size: 13 }, color: "#1e293b" },
                  },
                  title: { display: false },
                },
              },
            })
          : Promise.resolve(null),

        contributorList.length
          ? renderChartToImage({
              type: "bar",
              data: {
                labels: contributorList
                  .slice()
                  .sort((a, b) => (b.commits || 0) - (a.commits || 0))
                  .slice(0, 10)
                  .map((c) => c.name || "Unknown"),
                datasets: [
                  {
                    label: "Commits",
                    data: contributorList
                      .slice()
                      .sort((a, b) => (b.commits || 0) - (a.commits || 0))
                      .slice(0, 10)
                      .map((c) => c.commits || 0),
                    backgroundColor: PALETTE[0],
                    borderRadius: 3,
                  },
                ],
              },
              options: {
                indexAxis: "y",
                plugins: { legend: { display: false } },
                scales: {
                  x: { beginAtZero: true, ticks: { color: "#475569" }, grid: { color: "#e2e8f0" } },
                  y: { ticks: { color: "#1e293b" }, grid: { display: false } },
                },
              },
            })
          : Promise.resolve(null),

        hotspotList.length
          ? renderChartToImage({
              type: "bar",
              data: {
                labels: hotspotList.map((h) => {
                  const p = h.file || h.path || "Unknown";
                  return p.length > 28 ? "…" + p.slice(-27) : p;
                }),
                datasets: [
                  {
                    label: "Changes",
                    data: hotspotList.map((h) => h.changes ?? h.commitCount ?? h.count ?? 0),
                    backgroundColor: PALETTE[3],
                    borderRadius: 3,
                  },
                ],
              },
              options: {
                indexAxis: "y",
                plugins: { legend: { display: false } },
                scales: {
                  x: { beginAtZero: true, ticks: { color: "#475569" }, grid: { color: "#e2e8f0" } },
                  y: { ticks: { color: "#1e293b" }, grid: { display: false } },
                },
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
                    label: "Commits",
                    data: codeEvolution.map((c) => c.commits || 0),
                    borderColor: PALETTE[1],
                    backgroundColor: PALETTE[1] + "33",
                    fill: true,
                    tension: 0.3,
                    pointRadius: 2,
                    pointBackgroundColor: PALETTE[1],
                  },
                ],
              },
              options: {
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, ticks: { color: "#475569" }, grid: { color: "#e2e8f0" } },
                  x: { ticks: { color: "#475569" }, grid: { display: false } },
                },
              },
            })
          : Promise.resolve(null),
      ]);

    const anyCharts =
      languageChartImg || contributorsChartImg || hotspotsChartImg || commitActivityChartImg;

    if (anyCharts) {
      doc.addPage();
      y = 20;

      addHeading("Repository Visual Analytics", { eyebrow: "Charts" });
      y += 2;

      addChartImage("Language Distribution", languageChartImg);
      addChartImage("Top Contributors", contributorsChartImg);
      addChartImage("Top Hotspots", hotspotsChartImg);
      addChartImage("Commit Activity", commitActivityChartImg);
    }

    // ===========================
    // Executive Summary (final page)
    // ===========================

    doc.addPage();
    y = 20;

    addHeading("Executive Summary", { eyebrow: "Final Assessment" });
    y += 2;

    const healthLabel = healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : "Needs Improvement";
    const riskLabel =
      contributorCount <= 1 || hotspotRatioPct > 30
        ? "High"
        : contributorCount <= 3 || hotspotRatioPct > 15
        ? "Moderate"
        : "Low";

    addHealthBadge(healthScore, healthGrade);
    addLine("Overall Risk", riskLabel);

    y += 4;

    const addParagraph = (text, { spacingAfter = 8 } = {}) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLOR_TEXT);
      const lines = doc.splitTextToSize(text, CONTENT_W);
      doc.text(lines, PAGE_LEFT, y, { lineHeightFactor: 1.35 });
      y += lines.length * 6.3 + spacingAfter;
    };

    const repoName =
      architecture?.name ||
      repoUrl?.split("/").filter(Boolean).pop()?.replace(/\.git$/, "") ||
      "This repository";
    const totalFiles = fileAnalysis?.totalFiles || 0;
    const totalCommits = stats?.totalCommits || 0;
    const langCount = languageAnalysis?.languages?.length || 0;
    const topLanguage = languages[0]?.language;

    addParagraph(
      `${repoName} was analyzed across ${totalCommits} commit${
        totalCommits === 1 ? "" : "s"
      } from ${contributorCount} contributor${contributorCount === 1 ? "" : "s"}, spanning ${totalFiles} file${
        totalFiles === 1 ? "" : "s"
      }${langCount ? ` and ${langCount} language${langCount === 1 ? "" : "s"}` : ""}. ` +
        `The codebase currently scores ${healthScore} out of 100 (Grade ${healthGrade}), placing its overall health in the "${healthLabel}" range` +
        `${topLanguage ? `, with ${topLanguage} as the dominant language in the project` : ""}. ` +
        `${
          hotspotList.length
            ? `${hotspotList.length} file${hotspotList.length === 1 ? " has" : "s have"} been identified as change hotspots, indicating where development activity and churn are concentrated.`
            : "No significant change hotspots were detected in this analysis."
        }`
    );

    // --- Strengths ---
    doc.setFontSize(13.5);
    doc.setFont("times", "bold");
    doc.setTextColor(...COLOR_PRIMARY);
    doc.text("Strengths", PAGE_LEFT, y);
    doc.setTextColor(...COLOR_TEXT);
    y += 8;

    const strengths = [];
    if (totalCommits >= 20)
      strengths.push(
        `A healthy volume of ${totalCommits} commits suggests the project is under active, ongoing development rather than sitting stagnant.`
      );
    if (contributorCount > 3)
      strengths.push(
        `With ${contributorCount} contributors involved, the project is not dependent on a single person, which lowers the risk of stalled progress if one contributor becomes unavailable.`
      );
    if (langCount > 1)
      strengths.push(
        `The codebase spans ${langCount} languages in an organized way, reflecting a reasonably structured separation of concerns (e.g. markup, styling, and logic kept distinct).`
      );
    if (hotspotRatioPct <= 15)
      strengths.push(
        `Only ${hotspotRatioPct.toFixed(1)}% of files are flagged as hotspots, meaning change activity is spread out rather than concentrated in a fragile core of files.`
      );
    if (strengths.length === 0)
      strengths.push(
        "No standout strengths were identified in this pass — the metrics below are close to baseline across the board."
      );

    strengths.forEach((s) => {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }
      doc.setFillColor(5, 150, 105);
      doc.circle(PAGE_LEFT + 1.5, y - 1.5, 1.7, "F");
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLOR_TEXT);
      const lines = doc.splitTextToSize(s, 160);
      doc.text(lines, PAGE_LEFT + 7, y);
      y += lines.length * 6.3 + 3;
    });

    y += 5;

    // --- Weaknesses ---
    if (y > 255) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(13.5);
    doc.setFont("times", "bold");
    doc.setTextColor(...COLOR_PRIMARY);
    doc.text("Weaknesses", PAGE_LEFT, y);
    doc.setTextColor(...COLOR_TEXT);
    y += 8;

    const weaknesses = [];
    if (hotspotRatioPct > 15) {
      const topHotspot = hotspotList[0]?.file || hotspotList[0]?.path;
      weaknesses.push(
        `Change activity is fairly concentrated — ${hotspotRatioPct.toFixed(1)}% of files are flagged as hotspots` +
          `${topHotspot ? `, with ${topHotspot} standing out as the file modified most often` : ""}. Files that change this frequently are worth reviewing for complexity or unclear ownership.`
      );
    }
    if (contributorCount <= 1)
      weaknesses.push(
        "The project currently has a single contributor. This creates a bus-factor risk: if that person is unavailable, there is no one else with direct context on the codebase."
      );
    if (totalCommits < 20)
      weaknesses.push(
        `Commit history is relatively light at ${totalCommits} commit${totalCommits === 1 ? "" : "s"}, which limits how much can be inferred about long-term development patterns and stability.`
      );
    if (langCount === 1)
      weaknesses.push(
        "The project uses a single language throughout, which is not necessarily a problem, but is worth confirming was a deliberate choice rather than a gap in tooling or structure."
      );
    if (weaknesses.length === 0)
      weaknesses.push(
        "No significant weaknesses were identified in this pass — the repository looks solid across the metrics analyzed."
      );

    weaknesses.forEach((w) => {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }
      doc.setFillColor(190, 18, 60);
      doc.circle(PAGE_LEFT + 1.5, y - 1.5, 1.7, "F");
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLOR_TEXT);
      const lines = doc.splitTextToSize(w, 160);
      doc.text(lines, PAGE_LEFT + 7, y);
      y += lines.length * 6.3 + 3;
    });

    y += 5;

    // --- Recommendation ---
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(13.5);
    doc.setFont("times", "bold");
    doc.setTextColor(...COLOR_PRIMARY);
    doc.text("Recommendation", PAGE_LEFT, y);
    doc.setTextColor(...COLOR_TEXT);
    y += 8;

    const recSentences =
      recommendations.length > 0
        ? recommendations.map(([label, v]) => `Regarding ${label.toLowerCase()}: ${v}`).join(" ")
        : "No specific action items came out of this analysis — the repository is in good shape overall.";

    addParagraph(
      `${recSentences} Taken together, prioritizing these items should have the largest impact on the project's health score and long-term maintainability. ` +
        `Re-running this analysis after future changes will help track whether the health score trends upward over time.`,
      { spacingAfter: 4 }
    );

    // ===========================
    // Footer (page numbers) — applied to every page, including new ones
    // ===========================

    const pages = doc.getNumberOfPages();

    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);

      doc.setFillColor(...COLOR_GOLD);
      doc.rect(PAGE_LEFT, 284, 10, 0.8, "F");
      doc.setDrawColor(...COLOR_BORDER);
      doc.setLineWidth(0.3);
      doc.line(PAGE_LEFT + 12, 284.4, PAGE_RIGHT, 284.4);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLOR_MUTED);

      doc.text(`Page ${i} of ${pages}`, PAGE_RIGHT, 290, { align: "right" });
      doc.text("Generated by Code Evolution Visualizer", PAGE_LEFT, 290);
    }

    doc.save("Repository_Report.pdf");
  };

  return (
    <button
      onClick={downloadReport}
      className="bg-[#0F172A] hover:bg-[#1e293b] text-white px-5 py-2 rounded-lg shadow font-medium tracking-wide transition-colors"
    >
      Download Report
    </button>
  );
}

export default DownloadRepositoryReport;