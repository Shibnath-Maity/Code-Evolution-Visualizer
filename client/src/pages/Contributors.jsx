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
  ShieldAlert
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
    <div className="min-h-screen bg-slate-50/60 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white pb-16">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-3.5 rounded-2xl text-white shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
                <Users size={26} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Contributors
                </h1>
                {contributorList.length > 0 && (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                    {contributorList.length} Active
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5 font-medium">
                Individual metrics, code impacts, and interactive AI developer profiles
              </p>
            </div>
          </div>

          {analysis && (
            <div className="self-start sm:self-auto bg-white p-1 rounded-xl shadow-xs border border-slate-200">
              <TimeRangeFilter
                value={rangeDays}
                onChange={setRangeDays}
              />
            </div>
          )}
        </header>

        {!analysis ? (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-xs p-12 text-center max-w-lg mx-auto my-16 space-y-4">
            <div className="bg-red-50 text-red-500 p-4 rounded-2xl w-fit mx-auto ring-1 ring-red-100">
              <AlertCircle size={28} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                No Repository Selected
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Please analyze a repository to view contributor breakdown, code patterns, and AI insights.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <section className="transition-all duration-300">
              <ContributorStats
                contributors={contributorList}
                allCommits={statsCommits}
              />
            </section>

            {/* Hint Banner */}
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 via-violet-50 to-white border border-indigo-100 rounded-xl px-4 py-3 text-xs sm:text-sm text-indigo-900 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
                <MousePointerClick size={18} className="text-indigo-600 shrink-0" />
                <span>
                  <strong className="font-semibold">Interactive Selection:</strong> Click on any contributor in the leaderboard below to reveal their personalized AI evaluation.
                </span>
              </div>
            </div>

            {/* Leaderboards */}
            <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all p-1 ring-1 ring-slate-900/5">
                <TopContributors
                  contributors={contributorList}
                  aggregates={aggregates}
                  activeContributor={activeContributor}
                  onSelect={setActiveContributor}
                />
              </div>

              <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all p-1 ring-1 ring-slate-900/5">
                <ContributionDistribution
                  contributors={contributorList}
                />
              </div>
            </section>

            {/* Active Contributor AI & Insight Section */}
            {activeContributor ? (
              <section className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-800 gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30 backdrop-blur-xs">
                      <UserCheck size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-400">
                          Active Contributor Insights
                        </span>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                        {activeContributor}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 align-self-start sm:align-self-auto">
                    <div className="flex items-center gap-2 text-xs font-medium bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 shadow-inner">
                      <Sparkles size={14} className="text-indigo-300" />
                      <span>Rank #{activeRank + 1} of {contributorList.length}</span>
                    </div>

                    {contributorList.length > 1 && (
                      <button
                        onClick={handleSelectNext}
                        className="flex items-center gap-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                        title="View Next Contributor"
                      >
                        <span>Next</span>
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <ContributorSummaryBar
                  contributorName={activeContributor}
                  allCommits={allCommits}
                  rank={activeRank}
                />

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  <div className={showRecentCommits ? "xl:col-span-8" : "xl:col-span-12"}>
                    <ContributorAI
                      key={activeContributor}
                      contributorName={activeContributor}
                      allCommits={allCommits}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <TechnicalFocusCard focus={contributorInsights.focus} />
                  <TopLanguagesCard languages={contributorInsights.languages} />
                  <MostModifiedFilesCard files={contributorInsights.files} />
                </div>
              </section>
            ) : (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <ShieldAlert size={32} className="mx-auto text-slate-400 mb-2" />
                <p className="text-slate-600 font-medium">Select a contributor above to load insights.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Contributors;