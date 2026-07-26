import {
  X,
  FileCode2,
  Plus,
  Minus,
  GitCommit,
  Flame,
} from "lucide-react";

function HotspotDetails({ selectedHotspot, onClose }) {
  if (!selectedHotspot) return null;

  const changes = selectedHotspot.changes || 0;
  const additions = selectedHotspot.additions || 0;
  const deletions = selectedHotspot.deletions || 0;
  const commits = selectedHotspot.commits || 0;

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">

        <div className="flex items-center gap-4">

          <div className="bg-orange-100 p-3 rounded-xl">
            <FileCode2
              size={24}
              className="text-orange-500"
            />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {selectedHotspot.file}
            </h2>

            <p className="text-sm text-gray-500">
              Hotspot file details
            </p>
          </div>

        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition"
        >
          <X size={20} />
        </button>

      </div>

      {/* Content */}
      <div className="p-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {/* Changes */}
          <div className="bg-orange-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-orange-500">
              <Flame size={16} />
              <span className="text-sm">
                Changes
              </span>
            </div>

            <p className="text-2xl font-bold text-orange-600 mt-2">
              {changes}
            </p>
          </div>

          {/* Additions */}
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-600">
              <Plus size={16} />
              <span className="text-sm">
                Additions
              </span>
            </div>

            <p className="text-2xl font-bold text-green-600 mt-2">
              +{additions}
            </p>
          </div>

          {/* Deletions */}
          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-600">
              <Minus size={16} />
              <span className="text-sm">
                Deletions
              </span>
            </div>

            <p className="text-2xl font-bold text-red-600 mt-2">
              -{deletions}
            </p>
          </div>

          {/* Commits */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500">
              <GitCommit size={16} />
              <span className="text-sm">
                Commits
              </span>
            </div>

            <p className="text-2xl font-bold text-slate-900 mt-2">
              {commits}
            </p>
          </div>

        </div>

        {/* Details */}
        <div className="mt-6 border border-gray-100 rounded-xl p-5">

          <h3 className="font-semibold text-slate-900 mb-4">
            File Information
          </h3>

          <div className="space-y-3 text-sm">

            <div className="flex justify-between">
              <span className="text-gray-500">
                File
              </span>

              <span className="font-medium text-slate-900">
                {selectedHotspot.file}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">
                Changes
              </span>

              <span className="font-medium">
                {changes}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">
                Commits
              </span>

              <span className="font-medium">
                {commits}
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default HotspotDetails;