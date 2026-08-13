
const mongoose = require("mongoose");

const repositorySchema = new mongoose.Schema(
  {
    // Unique ID used by RepoIQ internally
    repositoryId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Owner of this repository
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // GitHub repository URL
    repoUrl: {
      type: String,
      required: true,
      trim: true,
    },

    // GitHub owner / organization
    owner: {
      type: String,
      default: "",
      trim: true,
    },

    // Repository name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Local cloned repository path
    repoPath: {
      type: String,
      default: "",
    },

    // Current analysis status
    status: {
      type: String,
      enum: [
        "processing",
        "ready",
        "failed",
      ],
      default: "processing",
    },

    // Last successful analysis
    lastAnalyzedAt: {
      type: Date,
      default: null,
    },

    // Error from the latest analysis
    analysisError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Fast lookup:
 *
 * Find all repositories belonging to a user.
 */
repositorySchema.index({
  userId: 1,
  createdAt: -1,
});

/*
 * Prevent the same GitHub repository
 * from being added multiple times by
 * the same user.
 */
repositorySchema.index(
  {
    userId: 1,
    repoUrl: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "Repository",
  repositorySchema
);

