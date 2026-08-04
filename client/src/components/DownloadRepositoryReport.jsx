import jsPDF from "jspdf";
import Chart from "chart.js/auto";

// ===========================
// Chart color palette (kept consistent across all charts)
// ===========================
const PALETTE = [
  "#2563eb", "#16a34a", "#dc2626", "#d97706",
  "#7c3aed", "#0891b2", "#db2777", "#65a30d",
  "#4f46e5", "#ea580c",
];

// Text/UI colors used throughout the PDF (RGB triples for jsPDF)
const COLOR_PRIMARY = [30, 64, 175]; // deep blue — headings, cover title
const COLOR_ACCENT = [37, 99, 235]; // brighter blue — divider lines
const COLOR_TEXT = [31, 41, 55]; // near-black — body copy
const COLOR_MUTED = [107, 114, 128]; // gray — labels, footer, meta text

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

    // ===========================
    // Helper Functions
    // ===========================

    const addHeading = (text, { subheading = false } = {}) => {
      const blockHeight = subheading ? 12 : 16;

      if (y + blockHeight > 280) {
        doc.addPage();
        y = 20;
      }

      if (subheading) {
        // Smaller section label, no divider — used for nested groups
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLOR_PRIMARY);
        doc.text(text, 20, y);
        y += 9;
      } else {
        doc.setFontSize(19);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLOR_PRIMARY);
        doc.text(text, 20, y);

        // Divider rule under the heading for a cleaner, printed-report feel
        y += 3;
        doc.setDrawColor(...COLOR_ACCENT);
        doc.setLineWidth(0.6);
        doc.line(20, y, 190, y);
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

      doc.setFontSize(11.5);

      // Label in muted bold, value in regular dark text — clearer than
      // a single run of "Label: value"
      const labelText = `${label}:`;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLOR_MUTED);
      doc.text(labelText, 20, y);

      const labelWidth = doc.getTextWidth(labelText) + 2;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLOR_TEXT);

      const lines = doc.splitTextToSize(String(value), 170 - labelWidth);
      doc.text(lines, 20 + labelWidth, y);

      y += Math.max(lines.length * 6.5, 6.5) + 1;
    };

    // Adds a chart image with a caption, starting a new page if it won't fit.
    // Returns true if the chart was drawn, false if it was skipped.
    const addChartImage = (title, dataUrl, imgWidthMm = 170, imgHeightMm = 100) => {
      if (!dataUrl) return false;

      if (y + imgHeightMm + 15 > 285) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLOR_PRIMARY);
      doc.text(title, 20, y);
      doc.setTextColor(...COLOR_TEXT);
      doc.setFont("helvetica", "normal");
      y += 7;

      doc.addImage(dataUrl, "PNG", 20, y, imgWidthMm, imgHeightMm);
      y += imgHeightMm + 12;

      return true;
    };

    // ===========================
    // Cover
    // ===========================

    // Full-width banner behind the title for a proper cover-page feel
    doc.setFillColor(...COLOR_PRIMARY);
    doc.rect(0, 0, 210, 45, "F");

    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Repository Analysis Report", 20, 26);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(219, 234, 254); // light blue
    doc.text(repoUrl || "Repository URL not provided", 20, 35);

    doc.setTextColor(...COLOR_TEXT);
    y = 58;

    doc.setFontSize(10.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...COLOR_MUTED);
    doc.text(`Generated ${new Date().toLocaleString()}`, 20, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLOR_TEXT);

    y += 14;

    // ===========================
    // Repository Statistics
    // ===========================

    y += 2;
    addHeading("Repository Statistics");

    addLine(
      "Total Commits",
      stats?.totalCommits || 0
    );

    addLine(
      "Contributors",
      Object.keys(contributors || {}).length
    );

    addLine(
      "Files",
      fileAnalysis?.totalFiles || 0
    );

    addLine(
      "Hotspots",
      hotspots?.length || 0
    );

    y += 8;

    // ===========================
    // Project Health Score
    // ===========================

    addHeading("Project Health Score");

    const calculateHealthScore = () => {
      // If the caller already computed one, trust it.
      if (typeof stats?.healthScore === "number") {
        return Math.round(stats.healthScore);
      }

      let score = 100;
      const contributorCount = Object.keys(contributors || {}).length;
      const totalFiles = fileAnalysis?.totalFiles || 0;
      const hotspotCount = hotspots?.length || 0;

      // Bus factor: too few contributors is risky
      if (contributorCount === 1) score -= 25;
      else if (contributorCount <= 3) score -= 10;

      // Hotspot ratio: churn concentrated in a small set of files
      if (totalFiles > 0) {
        const hotspotRatio = hotspotCount / totalFiles;
        if (hotspotRatio > 0.3) score -= 20;
        else if (hotspotRatio > 0.15) score -= 10;
      }

      // No commit activity data at all
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

    addLine("Overall Score", `${healthScore} / 100 (Grade: ${healthGrade})`);

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

    y += 8;

    // ===========================
    // Language Distribution
    // ===========================

    addHeading("Language Distribution");

    const languages = languageAnalysis?.languages || [];

    if (languages.length === 0) {
      addLine("Info", "No language information available");
    } else {
      languages.forEach((lang, index) => {
        addLine(
          `${index + 1}. ${lang.language}`,
          `${lang.percentage}% (${lang.files} files)`
        );
      });
    }

    y += 8;

    // ===========================
    // Repository Architecture
    // ===========================

    addHeading("Repository Architecture");

    if (!architecture) {
      addLine("Info", "Architecture not available");
    } else {
      addLine("Repository Name", architecture.name || "Unknown");

      addLine(
        "Total Root Folders",
        architecture.folders?.length || 0
      );

      addLine(
        "Total Root Files",
        architecture.files?.length || 0
      );

      if (architecture.folders?.length) {
        addHeading("Root Folders");

        architecture.folders.forEach((folder, index) => {
          addLine(`${index + 1}`, folder.name);
        });
      }

      if (architecture.files?.length) {
        addHeading("Root Files");

        architecture.files.forEach((file, index) => {
          addLine(`${index + 1}`, file.name);
        });
      }
    }

    y += 8;

    // ===========================
    // Recent Commits
    // ===========================

    addHeading("Recent Commits");

    const commits = (recentCommits || []).slice(0, 10);

    if (commits.length === 0) {
      addLine("Info", "No recent commits found");
    } else {
      commits.forEach((commit, index) => {
        addLine(
          `${index + 1}. Commit`,
          commit.message || "No commit message"
        );
        addLine(
          "Author",
          commit.author_name || commit.author || "Unknown"
        );
        addLine(
          "Date",
          commit.date
            ? new Date(commit.date).toLocaleString()
            : "Unknown"
        );
        addLine(
          "Hash",
          commit.hash
            ? commit.hash.substring(0, 7)
            : "-"
        );
        y += 5;
      });
    }

    y += 8;

    // ===========================
    // Code Evolution
    // ===========================

    addHeading("Code Evolution");

    if (!codeEvolution || codeEvolution.length === 0) {
      addLine("Info", "No code evolution data available");
    } else {
      codeEvolution.slice(0, 10).forEach((item, index) => {
        addLine(
          `${index + 1}. ${item.date || "Unknown"}`,
          `Commits: ${item.commits || 0}`
        );
      });
    }

    y += 8;

    // ===========================
    // Contributors
    // ===========================

    addHeading("Contributors");

    const contributorList = Object.values(
      contributors || {}
    );

    if (contributorList.length === 0) {
      addLine("Info", "No contributors found");
    } else {
      contributorList.forEach((contributor, index) => {
        addLine(
          `${index + 1}. ${contributor.name || "Unknown"}`,
          `${contributor.commits || 0} commits`
        );
      });
    }

    y += 8;

    // ===========================
    // Most Changed Files
    // ===========================

    addHeading("Most Changed Files");

    const changedFiles = fileAnalysis?.mostChangedFiles || [];

    if (changedFiles.length === 0) {
      addLine("Info", "No file analysis available");
    } else {
      changedFiles.slice(0, 10).forEach((file, index) => {
        addLine(
          `${index + 1}. ${file.file}`,
          `${file.changes} changes`
        );
      });
    }

    y += 8;

    // ===========================
    // Top Hotspots
    // ===========================

    addHeading("Top Hotspots");

    const hotspotList = (hotspots || []).slice(0, 10);

    if (hotspotList.length === 0) {
      addLine("Info", "No hotspots found");
    } else {
      hotspotList.forEach((hotspot, index) => {
        const filePath = hotspot.file || hotspot.path || "Unknown file";
        const changeCount =
          hotspot.changes ?? hotspot.commitCount ?? hotspot.count ?? 0;

        addLine(
          `${index + 1}. ${filePath}`,
          `${changeCount} changes`
        );
      });
    }

    y += 8;

    // ===========================
    // Summary
    // ===========================

    addHeading("Summary");

    addLine(
      "Repository Health",
      `${healthScore}/100 (${healthGrade})`
    );

    addLine(
      "Total Files",
      fileAnalysis?.totalFiles || 0
    );

    addLine(
      "Languages",
      languageAnalysis?.languages?.length || 0
    );

    addLine(
      "Recent Activity",
      recentCommits?.length || 0
    );

    addLine(
      "Overall Status",
      healthScore >= 80
        ? "Excellent"
        : healthScore >= 60
        ? "Good"
        : "Needs Improvement"
    );

    y += 8;

    // ===========================
    // Recommendations
    // ===========================

    addHeading("Recommendations");

    const recommendations = [];

    if ((hotspots?.length || 0) > 10) {
      recommendations.push([
        "Hotspots",
        "Refactor highly modified files.",
      ]);
    }

    if (contributorCount <= 1) {
      recommendations.push([
        "Bus Factor",
        "Increase contributor participation.",
      ]);
    }

    if ((stats?.totalCommits || 0) < 20) {
      recommendations.push([
        "Commit Activity",
        "Increase development frequency.",
      ]);
    }

    if ((languageAnalysis?.languages?.length || 0) === 1) {
      recommendations.push([
        "Languages",
        "Project uses a single language.",
      ]);
    }

    if (recommendations.length === 0) {
      addLine("Info", "No specific recommendations — repository looks healthy.");
    } else {
      recommendations.forEach(([label, value]) => {
        addLine(label, value);
      });
    }

    // ===========================================================
    // Visual Analytics — build chart images, then lay out the page
    // ===========================================================

    const [
      languageChartImg,
      contributorsChartImg,
      hotspotsChartImg,
      commitActivityChartImg,
    ] = await Promise.all([
      // Language Distribution (Pie)
      languages.length
        ? renderChartToImage({
            type: "pie",
            data: {
              labels: languages.map((l) => l.language),
              datasets: [
                {
                  data: languages.map((l) => l.percentage),
                  backgroundColor: languages.map(
                    (_, i) => PALETTE[i % PALETTE.length]
                  ),
                },
              ],
            },
            options: {
              plugins: {
                legend: { position: "right", labels: { font: { size: 13 } } },
                title: { display: false },
              },
            },
          })
        : Promise.resolve(null),

      // Top Contributors (Bar)
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
                },
              ],
            },
            options: {
              indexAxis: "y",
              plugins: { legend: { display: false } },
              scales: { x: { beginAtZero: true } },
            },
          })
        : Promise.resolve(null),

      // Top Hotspots (Bar)
      hotspotList.length
        ? renderChartToImage({
            type: "bar",
            data: {
              labels: hotspotList.map((h) => {
                const p = h.file || h.path || "Unknown";
                // Trim long paths so labels stay readable
                return p.length > 28 ? "…" + p.slice(-27) : p;
              }),
              datasets: [
                {
                  label: "Changes",
                  data: hotspotList.map(
                    (h) => h.changes ?? h.commitCount ?? h.count ?? 0
                  ),
                  backgroundColor: PALETTE[2],
                },
              ],
            },
            options: {
              indexAxis: "y",
              plugins: { legend: { display: false } },
              scales: { x: { beginAtZero: true } },
            },
          })
        : Promise.resolve(null),

      // Commit Activity Over Time (Line)
      codeEvolution && codeEvolution.length
        ? renderChartToImage({
            type: "line",
            data: {
              labels: codeEvolution.map((c) => c.date || ""),
              datasets: [
                {
                  label: "Commits",
                  data: codeEvolution.map((c) => c.commits || 0),
                  borderColor: PALETTE[4],
                  backgroundColor: PALETTE[4] + "33",
                  fill: true,
                  tension: 0.3,
                  pointRadius: 2,
                },
              ],
            },
            options: {
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } },
            },
          })
        : Promise.resolve(null),
    ]);

    const anyCharts =
      languageChartImg || contributorsChartImg || hotspotsChartImg || commitActivityChartImg;

    if (anyCharts) {
      doc.addPage();
      y = 20;

      addHeading("Repository Visual Analytics");
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

    addHeading("Executive Summary");
    y += 2;

    const healthLabel =
      healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : "Needs Improvement";
    const riskLabel =
      contributorCount <= 1 || hotspotRatioPct > 30
        ? "High"
        : contributorCount <= 3 || hotspotRatioPct > 15
        ? "Moderate"
        : "Low";

    addLine("Repository Health", `${healthLabel} (${healthScore}/100, Grade ${healthGrade})`);
    addLine("Overall Risk", riskLabel);

    y += 4;

    // Helper for wrapped, justified-feeling body paragraphs
    const addParagraph = (text, { spacingAfter = 8 } = {}) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(11.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLOR_TEXT);
      const lines = doc.splitTextToSize(text, 170);
      doc.text(lines, 20, y, { lineHeightFactor: 1.35 });
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

    // --- Overview paragraph ---
    addParagraph(
      `${repoName} was analyzed across ${totalCommits} commit${
        totalCommits === 1 ? "" : "s"
      } from ${contributorCount} contributor${contributorCount === 1 ? "" : "s"}, spanning ${totalFiles} file${
        totalFiles === 1 ? "" : "s"
      }${langCount ? ` and ${langCount} language${langCount === 1 ? "" : "s"}` : ""}. ` +
        `The codebase currently scores ${healthScore} out of 100 (Grade ${healthGrade}), placing its overall health in the "${healthLabel}" range` +
        `${topLanguage ? `, with ${topLanguage} as the dominant language in the project` : ""}. ` +
        `${hotspotList.length ? `${hotspotList.length} file${hotspotList.length === 1 ? " has" : "s have"} been identified as change hotspots, indicating where development activity and churn are concentrated.` : "No significant change hotspots were detected in this analysis."}`
    );

    // --- Strengths ---
    doc.setFontSize(13.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR_PRIMARY);
    doc.text("Strengths", 20, y);
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
        `The codebase spans ${langCount} languages in a organized way, reflecting a reasonably structured separation of concerns (e.g. markup, styling, and logic kept distinct).`
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
      doc.setFontSize(11.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(22, 163, 74); // green check
      doc.text("\u2714", 20, y);
      doc.setTextColor(...COLOR_TEXT);
      const lines = doc.splitTextToSize(s, 162);
      doc.text(lines, 27, y);
      y += lines.length * 6.3 + 3;
    });

    y += 5;

    // --- Weaknesses ---
    if (y > 255) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(13.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR_PRIMARY);
    doc.text("Weaknesses", 20, y);
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
      doc.setFontSize(11.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(220, 38, 38); // red bullet
      doc.text("\u2022", 20, y);
      doc.setTextColor(...COLOR_TEXT);
      const lines = doc.splitTextToSize(w, 162);
      doc.text(lines, 27, y);
      y += lines.length * 6.3 + 3;
    });

    y += 5;

    // --- Recommendation ---
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(13.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR_PRIMARY);
    doc.text("Recommendation", 20, y);
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

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(20, 284, 190, 284);

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLOR_MUTED);

      doc.text(
        `Page ${i} of ${pages}`,
        190,
        290,
        { align: "right" }
      );

      doc.text(
        "Generated by Code Evolution Visualizer",
        20,
        290
      );
    }

    doc.save("Repository_Report.pdf");
  };

  return (
    <button
      onClick={downloadReport}
      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow"
    >
      Download Report
    </button>
  );
}

export default DownloadRepositoryReport;