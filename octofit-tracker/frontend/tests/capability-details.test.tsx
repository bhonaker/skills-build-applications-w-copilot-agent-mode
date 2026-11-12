import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import App from '../src/App.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('shows team, ranking, and workout details from the API', async () => {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/api/teams')) {
      return Response.json({ teams: [{ _id: 'team1', name: 'Octocats', mascot: 'Mona', members: ['user1', 'user2'] }] });
    }
    if (url.endsWith('/api/leaderboard')) {
      return Response.json({ leaderboard: [{ teamName: 'Octocats', rank: 2, totalPoints: 90 }] });
    }
    if (url.includes('/api/workouts/suggestions/')) {
      return Response.json({ suggestions: [{ _id: 'workout1', title: 'Intervals', focus: 'endurance', minutes: 30, difficulty: 'moderate', reason: 'Build endurance' }] });
    }
    return new Response(null, { status: 404 });
  }));
  const renderRoute = (route: string) => render(<MemoryRouter initialEntries={[route]}><App /></MemoryRouter>);

  const teams = renderRoute('/teams');
  expect(await screen.findByText(/Octocats/)).toHaveTextContent('Octocats - Mona (2 members)');
  teams.unmount();

  const leaderboard = renderRoute('/leaderboard');
  expect(await screen.findByText(/Octocats/)).toHaveAttribute('value', '2');
  expect(screen.getByText(/Octocats/)).toHaveTextContent('90 points');
  leaderboard.unmount();

  renderRoute('/workouts');
  expect(await screen.findByText('Intervals')).toBeInTheDocument();
  expect(screen.getByText('Build endurance')).toBeInTheDocument();
  expect(screen.getByText('Intervals').parentElement).toHaveTextContent('endurance, 30 minutes, moderate');
});
