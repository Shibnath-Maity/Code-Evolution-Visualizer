import "../styles/repository.css";
function formatCount(num) {
  if (num == null) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return num.toString();
}

function RepositoryOverview({ repo }) {
  if (!repo) return null;

  const {
    name,
    owner,
    ownerAvatar,
    description,
    stars,
    forks,
    issues,
    language,
    defaultBranch,
    license,
  } = repo;

  return (
    <div className="repo-card">
      <div className="repo-header">
        {ownerAvatar && (
          <img
            src={ownerAvatar}
            alt={owner ? `${owner}'s avatar` : "Repository owner avatar"}
            className="repo-avatar"
            width="60"
            height="60"
            loading="lazy"
          />
        )}
        <div>
          <h2>{name || "Unnamed repository"}</h2>
          {owner && <p className="repo-owner">@{owner}</p>}
        </div>
      </div>

      {description && <p className="repo-description">{description}</p>}

      <div className="repo-stats">
        <span title={`${stars ?? 0} stars`}>⭐ {formatCount(stars)}</span>
        <span title={`${forks ?? 0} forks`}>🍴 {formatCount(forks)}</span>
        {issues != null && (
          <span title={`${issues} open issues`}>🐞 {formatCount(issues)}</span>
        )}
        {language && <span>💻 {language}</span>}
      </div>

      <div className="repo-footer">
        {defaultBranch && <span>🌿 {defaultBranch}</span>}
        <span>📄 {license || "No license"}</span>
      </div>
    </div>
  );
}

export default RepositoryOverview;