let currentRepository = {
  repositoryId: null,
  repoPath: null,
  architecture: null,
};

function setCurrentRepository(
  repositoryId,
  repoPath,
  architecture
) {
  currentRepository = {
    repositoryId,
    repoPath,
    architecture,
  };

  console.log("✅ Repository Saved");
  console.log(currentRepository);
}

function getCurrentRepository() {
  return currentRepository;
}

module.exports = {
  setCurrentRepository,
  getCurrentRepository,
};