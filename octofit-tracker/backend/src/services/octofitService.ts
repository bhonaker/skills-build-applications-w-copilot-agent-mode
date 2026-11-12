import { Activity, Team, User, Workout } from '../models/index.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isObjectIdArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && /^[\da-f]{24}$/i.test(item));
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) {
    throw Object.assign(new Error('Activity details are required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input;
  if (
    typeof userId !== 'string'
    || !/^[\da-f]{24}$/i.test(userId)
    || typeof teamId !== 'string'
    || !/^[\da-f]{24}$/i.test(teamId)
    || typeof type !== 'string'
    || !type.trim()
    || typeof minutes !== 'number'
    || !Number.isFinite(minutes)
    || minutes <= 0
  ) {
    throw Object.assign(new Error('Valid userId, teamId, type, and positive minutes are required'), { status: 400 });
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) {
    throw Object.assign(new Error('Team details are required'), { status: 400 });
  }

  const { name, mascot, members } = input;
  if (typeof name !== 'string' || !name.trim()) {
    throw Object.assign(new Error('A team name is required'), { status: 400 });
  }
  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('A team mascot is required'), { status: 400 });
  }
  if (members !== undefined && !isObjectIdArray(members)) {
    throw Object.assign(new Error('Team members must be valid user IDs'), { status: 400 });
  }

  const memberIds = members === undefined ? [] : members;
  const existingMembers = await User.find({ _id: { $in: memberIds } }).select('_id');
  if (existingMembers.length !== new Set(memberIds).size) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate([{ $group: { _id: '$team', totalPoints: { $sum: '$points' } } }]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const [recentActivity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find().lean(),
  ]);
  const goalFocus = user.fitnessGoal.toLowerCase();
  const activityFocus = recentActivity?.type.toLowerCase();
  const preferredFocus = workouts.some((workout) => workout.focus.toLowerCase() === goalFocus)
    ? goalFocus
    : activityFocus;
  const orderedWorkouts = [...workouts].sort((left, right) => {
    if (!preferredFocus) return 0;
    return Number(right.focus.toLowerCase() === preferredFocus) - Number(left.focus.toLowerCase() === preferredFocus);
  });
  const reason = recentActivity
    ? `Recommended for your ${user.fitnessGoal} goal and recent ${recentActivity.type} activity.`
    : `Recommended for your ${user.fitnessGoal} goal.`;
  return orderedWorkouts.map((workout) => ({ ...workout, reason }));
}

export { User };
