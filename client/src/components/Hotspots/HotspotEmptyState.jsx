export default function HotspotEmptyState({ searchTerm }) {
  if (searchTerm) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">
        No files match "{searchTerm}".
      </div>
    );
  }

  return (
    <div className="p-8 text-center text-gray-500 text-sm space-y-2 py-4">
      <p className="font-semibold text-slate-700">
        No hotspot data is available for this repository.
      </p>
      <div className="text-xs text-gray-400 space-y-1 text-left max-w-sm mx-auto">
        <p>This usually means:</p>
        <p>• The repository has very little commit history.</p>
        <p>• File-level analytics were not generated.</p>
        <p>• Hotspots are generated after file-change analytics.</p>
        <p>• The analysis is still processing.</p>
      </div>
    </div>
  );
}