function buildRepositoryContext(analytics) {
  if (!analytics) {
    return "No repository information is available.";
  }

  let context = `
You are an AI assistant for a Code Evolution Visualizer.

You are analyzing a software repository.

Repository information:
`;

  if (analytics.repoInfo) {
    context += `
Repository:
${JSON.stringify(analytics.repoInfo, null, 2)}
`;
  }

  if (analytics.stats) {
    context += `
Statistics:
${JSON.stringify(analytics.stats, null, 2)}
`;
  }

  if (analytics.contributors) {
    context += `
Contributors:
${JSON.stringify(analytics.contributors, null, 2)}
`;
  }

  if (analytics.hotspots) {
    context += `
Hotspots:
${JSON.stringify(analytics.hotspots, null, 2)}
`;
  }

  if (analytics.fileChanges) {
    context += `
File Changes:
${JSON.stringify(analytics.fileChanges, null, 2)}
`;
  }

  if (analytics.timeline) {
    context += `
Timeline:
${JSON.stringify(analytics.timeline, null, 2)}
`;
  }

  if (analytics.recentCommits) {
    context += `
Recent Commits:
${JSON.stringify(analytics.recentCommits, null, 2)}
`;
  }

  context += `

Instructions:
- Answer questions using the repository information above.
- Do not invent repository facts.
- If the information is insufficient, clearly say so.
- Explain technical concepts in simple language.
`;

  return context;
}

module.exports = {
  buildRepositoryContext,
};