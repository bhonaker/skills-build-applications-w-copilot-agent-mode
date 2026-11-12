import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Workout = { _id?: string; title: string; reason: string; focus?: string; minutes?: number; difficulty?: string };
type WorkoutResponse = { suggestions: Workout[] };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[]>();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    getJson<WorkoutResponse>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`)
      .then(({ suggestions: results }) => setSuggestions(results))
      .catch(() => setHasError(true));
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns for mona@example.com.</p>
        {hasError ? (
          <p role="alert">Unable to load workout suggestions.</p>
        ) : suggestions === undefined ? (
          <p role="status">Loading workout suggestions...</p>
        ) : suggestions.length === 0 ? (
          <p>No workout suggestions yet.</p>
        ) : (
          <ul>
            {suggestions.map((workout, index) => (
              <li key={workout._id ?? index}>
                <strong>{workout.title}</strong>
                {workout.focus && ` - ${workout.focus}`}
                {workout.minutes !== undefined && `, ${workout.minutes} minutes`}
                {workout.difficulty && `, ${workout.difficulty}`}
                <p>{workout.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
