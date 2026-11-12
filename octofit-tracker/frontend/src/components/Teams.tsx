import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { _id?: string; name: string; mascot?: string; members: string[] };
type TeamResponse = { teams: Team[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    getJson<TeamResponse>('/api/teams')
      .then(({ teams: results }) => setTeams(results))
      .catch(() => setHasError(true));
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {hasError ? (
          <p role="alert">Unable to load teams.</p>
        ) : teams === undefined ? (
          <p role="status">Loading teams...</p>
        ) : teams.length === 0 ? (
          <p>No teams yet.</p>
        ) : (
          <ul>
            {teams.map((team, index) => (
              <li key={team._id ?? index}>
                {team.name}{team.mascot && ` - ${team.mascot}`} ({team.members.length} members)
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
