import { useEffect, useState } from "react";
import axios from "axios";

function CommitDiff({ hash }) {
  const [diff, setDiff] = useState("");

  useEffect(() => {
    if (!hash) return;

    async function fetchDiff() {
      try {
        const res = await axios.get(
          `http://localhost:5000/repository/commit/${hash}/diff`
        );

        setDiff(res.data.data);
      } catch (err) {
        console.error(err);
      }
    }

    fetchDiff();
  }, [hash]);

  return (
    <div>
      <h2>Commit Diff</h2>

      <pre>{diff}</pre>
    </div>
  );
}

export default CommitDiff;