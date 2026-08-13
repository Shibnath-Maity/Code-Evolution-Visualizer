import { useState, useEffect, useMemo } from "react";
import { useAnalysis } from "../context/AnalysisContext";

import TopContributors from "../components/TopContributors";
import ContributorStats from "../components/ContributorStats";
import ContributionDistribution from "../components/ContributionDistribution";
import ContributorAI from "../components/ContributorAI";
import ContributorSummaryBar from "../components/ContributorSummaryBar";
import {
  TechnicalFocusCard,
  TopLanguagesCard,
  MostModifiedFilesCard,
} from "../components/ContributorInsightCards";
import TimeRangeFilter from "../components/TimeRangeFilter";
import { 
  Users, 
  AlertCircle, 
  Sparkles, 
  UserCheck, 
  MousePointerClick, 
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  BarChart3
} from "lucide-react";

function normalizeContributorName(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .split("|")[0]
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function Contributors() {
  const { analysis } = useAnalysis();

  const [activeContributor, setActiveContributor] = useState(null);
  const [rangeDays, setRangeDays] = useState(90);

  const showRecentCommits = false;

  const allCommits = useMemo(
    () => analysis?.allCommits ?? [],
    [analysis]
  );
  
  const fileAnalysis = useMemo(
    () => analysis?.fileAnalysis ?? {},
    [analysis]
  );

  const contributorList = useMemo(() => {
    const map = new Map();

    allCommits.forEach((commit) => {
      if (!commit) return;

      const rawName =
        commit.author_name ||
        commit.author ||
        commit.name ||
        "";

      const name = String(rawName)
        .replace(/<[^>]+>/g, "")
        .split("|")[0]
        .replace(/\s+/g, " ")
        .trim();

      if (!name) return;

      const key = name.toLowerCase();

      if (!map.has(key)) {
        map.set(key, {
          name,
          commits: 0,
          additions: 0,
          deletions: 0,
        });
      }

      const contributor = map.get(key);

      contributor.commits += 1;
      contributor.additions += Number(commit.additions || 0);
      contributor.deletions += Number(commit.deletions || 0);
    });

    return Array.from(map.values()).sort(
      (a, b) => b.commits - a.commits
    );
  }, [allCommits]);

  // Preserve active selection
  useEffect(() => {
    if (!contributorList.length) {
      setActiveContributor(null);
      return;
    }

    setActiveContributor((current) => {
      if (!current) {
        const first = contributorList[0];
        return first?.name || first?.author || first?.author_name || first?.login || null;
      }

      const exists = contributorList.some((c) => {
        const name = c.name || c.author || c.author_name || c.login || "";
        return normalizeContributorName(name) === normalizeContributorName(current);
      });

      if (exists) return current;

      const first = contributorList[0];
      return first?.name || first?.author || first?.author_name || first?.login || null;
    });
  }, [contributorList]);

  // Reset filter on repository change
  useEffect(() => {
    setRangeDays(90);
  }, [analysis]);

  const cutoff = useMemo(() => {
    if (!rangeDays) return null;
    return Date.now() - rangeDays * 24 * 60 * 60 * 1000;
  }, [rangeDays]);

  const statsCommits = useMemo(() => {
    if (!cutoff) return allCommits;

    return allCommits.filter(
      (c) => c.date && new Date(c.date).getTime() >= cutoff
    );
  }, [allCommits, cutoff]);

  const aggregates = useMemo(() => {
    return allCommits.reduce((map, commit) => {
      const author = commit.author_name || commit.author || commit.name;
      if (!author) return map;

      if (!map[author]) {
        map[author] = { additions: 0, deletions: 0, lastActive: null };
      }

      map[author].additions += commit.additions || 0;
      map[author].deletions += commit.deletions || 0;

      if (!map[author].lastActive || new Date(commit.date) > new Date(map[author].lastActive)) {
        map[author].lastActive = commit.date;
      }

      return map;
    }, {});
  }, [allCommits]);

  // Insights calculation
  const contributorInsights = useMemo(() => {
    if (!activeContributor) {
      return { focus: [], languages: [], files: [] };
    }

    const selected = normalizeContributorName(activeContributor);

    const contributorCommits = allCommits.filter((c) => {
      const author = normalizeContributorName(c.author_name || c.author || c.name);
      return author === selected;
    });

    const hasCommitFiles = contributorCommits.some(
      (c) => (c.files && c.files.length > 0) || (c.changedFiles && c.changedFiles.length > 0)
    );

    const allFiles = fileAnalysis?.allFiles || [];
    const hasFileContributors = allFiles.some((f) => Array.isArray(f.contributors));

    if (hasCommitFiles) {
      const languageMap = {};
      const fileMap = {};

      contributorCommits.forEach((commit) => {
        const files = commit.files || commit.changedFiles || [];
        files.forEach((file) => {
          const filePath = typeof file === "string" ? file : file.path;
          if (!filePath) return;

          const count = typeof file === "object" ? file.changes || 1 : 1;
          fileMap[filePath] = (fileMap[filePath] || 0) + count;

          const ext = filePath.split(".").pop()?.toLowerCase();
          if (ext) {
            languageMap[ext] = (languageMap[ext] || 0) + count;
          }
        });
      });

      const maxChanges = Math.max(0, ...Object.values(fileMap));
      const totalLang = Object.values(languageMap).reduce((a, b) => a + b, 0);

      const languages = Object.entries(languageMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([ext, count]) => ({
          name: ext.toUpperCase(),
          pct: totalLang ? Math.round((count / totalLang) * 100) : 0,
          count,
        }));

      const files = Object.entries(fileMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([path, changes]) => ({
          path,
          changes,
          pct: maxChanges ? Math.round((changes / maxChanges) * 100) : 0,
        }));

      const directoryMap = {};
      Object.entries(fileMap).forEach(([path, count]) => {
        const parts = path.split("/");
        const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : "Root";
        directoryMap[dir] = (directoryMap[dir] || 0) + count;
      });

      const totalDir = Object.values(directoryMap).reduce((a, b) => a + b, 0);
      const focus = Object.entries(directoryMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, count]) => ({
          label,
          pct: totalDir ? Math.round((count / totalDir) * 100) : 0,
        }));

      return { languages, files, focus };
    }

    if (hasFileContributors) {
      const contributorFiles = allFiles.filter((f) =>
        f.contributors?.some(
          (contribName) => normalizeContributorName(contribName) === selected
        )
      );

      if (!contributorFiles.length) {
        return { focus: [], languages: [], files: [] };
      }

      const languageMap = {};
      const focusMetrics = { Functions: 0, Classes: 0, Conditions: 0, Async: 0 };

      contributorFiles.forEach((file) => {
        const ext = file.path?.split(".").pop()?.toLowerCase();
        if (ext) {
          languageMap[ext] = (languageMap[ext] || 0) + (file.changes || 1);
        }

        const metrics = file.metrics || {};
        focusMetrics.Functions += Number(metrics.functions || 0);
        focusMetrics.Classes += Number(metrics.classes || 0);
        focusMetrics.Conditions += Number(metrics.conditions || 0);
        focusMetrics.Async += Number(metrics.asyncFunctions || 0);
      });

      const totalLang = Object.values(languageMap).reduce((a, b) => a + b, 0);
      const languages = Object.entries(languageMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([ext, count]) => ({
          name: ext.toUpperCase(),
          pct: totalLang ? Math.round((count / totalLang) * 100) : 0,
          count,
        }));

      const maxChanges = Math.max(0, ...contributorFiles.map((f) => Number(f.changes || 0)));

      const files = contributorFiles
        .sort((a, b) => (b.changes || 0) - (a.changes || 0))
        .slice(0, 5)
        .map((file) => ({
          path: file.path,
          changes: Number(file.changes || 0),
          pct: maxChanges
            ? Math.round((Number(file.changes || 0) / maxChanges) * 100)
            : 0,
        }));

      const totalFocus = Object.values(focusMetrics).reduce((a, b) => a + b, 0);
      const focus = Object.entries(focusMetrics)
        .map(([label, value]) => ({
          label,
          pct: totalFocus ? Math.round((value / totalFocus) * 100) : 0,
        }))
        .filter((item) => item.pct > 0)
        .sort((a, b) => b.pct - a.pct);

      return { languages, files, focus };
    }

    return { focus: [], languages: [], files: [] };
  }, [activeContributor, allCommits, fileAnalysis]);

  const activeRank = useMemo(() => {
    const selected = normalizeContributorName(activeContributor);
    const index = contributorList.findIndex((c) => {
      const name = c.name || c.author || c.author_name || c.login || "";
      return normalizeContributorName(name) === selected;
    });
    return Math.max(0, index);
  }, [contributorList, activeContributor]);

  const handleSelectNext = () => {
    if (!contributorList.length) return;
    const nextIndex = (activeRank + 1) % contributorList.length;
    const nextContrib = contributorList[nextIndex];
    setActiveContributor(
      nextContrib.name || nextContrib.author || nextContrib.author_name || nextContrib.login || null
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200 pb-20 relative overflow-hidden">
      {/* Background Glows & Patterns */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-[1700px] mx-auto px-4 sm:px-8 py-10 space-y-10">
        {/* Modern Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl blur-md opacity-50 group-hover:opacity-100 transition duration-300" />
              <div className="relative bg-slate-900 border border-slate-700/60 p-4 rounded-2xl text-indigo-400 shadow-xl">
                <Users size={28} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                  Contributors
                </h1>
                {contributorList.length > 0 && (
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 backdrop-blur-md">
                    {contributorList.length} Active
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-1 font-medium">
                Individual developer metrics, impact analysis, and real-time AI profiles
              </p>
            </div>
          </div>

          {analysis && (
            <div className="self-start md:self-auto bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl ring-1 ring-white/5">
              <TimeRangeFilter
                value={rangeDays}
                onChange={setRangeDays}
              />
            </div>
          )}
        </header>

        {!analysis ? (
          /* Empty State */
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-800/80 shadow-2xl p-12 text-center max-w-md mx-auto my-20 space-y-5">
            <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl w-fit mx-auto border border-red-500/20">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                No Repository Selected
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Analyze a codebase repository to view granular developer activity, code attribution, and automated AI insights.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <section className="transition-all duration-300">
              <ContributorStats
                contributors={contributorList}
                allCommits={statsCommits}
              />
            </section>

            {/* Interactive Selector Alert Banner */}
            <div className="relative overflow-hidden flex items-center justify-between bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-950/60 border border-indigo-500/20 rounded-2xl px-5 py-4 text-sm text-indigo-200 backdrop-blur-md shadow-xl group">
              <div className="absolute top-0 right-0 w-64 h-full bg-indigo-500/5 blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3.5 z-10">
                <div className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
                </div>
                <MousePointerClick size={20} className="text-indigo-400 shrink-0" />
                <span>
                  <strong className="font-semibold text-white">Interactive Focus:</strong> Select any engineer from the leaderboards below to inspect deep individual performance profiles.
                </span>
              </div>
            </div>

            {/* Main Leaderboard & Distribution Grid */}
            <section className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-7 bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-800/80 shadow-xl p-2 hover:border-slate-700/80 transition-all duration-300">
                <TopContributors
                  contributors={contributorList}
                  aggregates={aggregates}
                  activeContributor={activeContributor}
                  onSelect={setActiveContributor}
                />
              </div>

              <div className="xl:col-span-5 bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-800/80 shadow-xl p-2 hover:border-slate-700/80 transition-all duration-300">
                <ContributionDistribution
                  contributors={contributorList}
                />
              </div>
            </section>

            {/* Selected Contributor AI Profile Section */}
            {activeContributor ? (
              <section className="space-y-8 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Active Contributor Header Spotlight */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
                  <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 shadow-inner">
                        <UserCheck size={30} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase tracking-widest font-bold text-indigo-400">
                            Active Contributor Profile
                          </span>
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
                          {activeContributor}
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      <div className="flex items-center gap-2 text-xs font-semibold bg-slate-800/80 text-slate-300 px-4 py-2 rounded-xl border border-slate-700/60 shadow-md">
                        <Sparkles size={15} className="text-indigo-400" />
                        <span>Rank #{activeRank + 1} of {contributorList.length}</span>
                      </div>

                      {contributorList.length > 1 && (
                        <button
                          onClick={handleSelectNext}
                          className="flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
                          title="View Next Contributor"
                        >
                          <span>Next</span>
                          <ChevronRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary Metrics Bar */}
                <ContributorSummaryBar
                  contributorName={activeContributor}
                  allCommits={allCommits}
                  rank={activeRank}
                />

                {/* AI Insights Engine */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                  <div className={showRecentCommits ? "xl:col-span-8" : "xl:col-span-12"}>
                    <ContributorAI
                      key={activeContributor}
                      contributorName={activeContributor}
                      allCommits={allCommits}
                    />
                  </div>
                </div>

                {/* Technical Breakdown Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  <TechnicalFocusCard focus={contributorInsights.focus} />
                  <TopLanguagesCard languages={contributorInsights.languages} />
                  <MostModifiedFilesCard files={contributorInsights.files} />
                </div>
              </section>
            ) : (
              <div className="p-10 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 backdrop-blur-md">
                <ShieldAlert size={36} className="mx-auto text-slate-500 mb-3" />
                <p className="text-slate-400 font-medium">Select a contributor above to load developer profiles.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Contributors;