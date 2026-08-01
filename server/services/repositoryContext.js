let currentRepository = {
  repositoryId: null,
  repoPath: null,
};

function setCurrentRepository(repositoryId, repoPath) {
  currentRepository = {
    repositoryId,
    repoPath,
  };

  console.log("✅ Repository Saved");
  console.log(currentRepository);
}

function getCurrentRepository() {
  console.log("📦 Current Repository");
  console.log(currentRepository);

  return currentRepository;
}

module.exports = {
  setCurrentRepository,
  getCurrentRepository,
};