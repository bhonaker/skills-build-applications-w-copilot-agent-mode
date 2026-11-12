import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    getJson<LeaderboardResponse>('/api/leaderboard')
      .then(({ leaderboard: results }) => setLeaderboard(results))
      .catch(() => setHasError(true));
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {hasError ? (
          <p role="alert">Unable to load the leaderboard.</p>
        ) : leaderboard === undefined ? (
          <p role="status">Loading leaderboard...</p>
        ) : leaderboard.length === 0 ? (
          <p>No leaderboard scores yet.</p>
        ) : (
          <ol>
            {leaderboard.map((entry) => (
              <li key={entry.rank} value={entry.rank}>
                {entry.teamName}: {entry.totalPoints} points
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
