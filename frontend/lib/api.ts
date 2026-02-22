const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

// ─────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────
async function handleResponse(res: Response) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// ─────────────────────────────────────────────
// HEALTH
// ─────────────────────────────────────────────
export async function checkHealth() {
  const res = await fetch(`${BACKEND_URL}/api/health`);
  return handleResponse(res);
}

// ─────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────
export async function fetchProfile(token: string) {
  const res = await fetch(`${BACKEND_URL}/api/profile`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function createProfile(token: string, data: {
  full_name: string;
  github_link?: string;
  linkedin_id?: string;
  department?: string;
  semester?: string;
  roll_number?: string;
  phone?: string;
  skills?: string[];
  interests?: string[];
}) {
  const res = await fetch(`${BACKEND_URL}/api/profile`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateProfile(token: string, data: {
  full_name?: string;
  github_link?: string;
  linkedin_id?: string;
  department?: string;
  semester?: string;
  roll_number?: string;
  phone?: string;
  skills?: string[];
  interests?: string[];
}) {
  const res = await fetch(`${BACKEND_URL}/api/profile`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function searchProfiles(token: string, filters: {
  department?: string;
  skill?: string;
  interest?: string;
}) {
  const params = new URLSearchParams();
  if (filters.department) params.append('department', filters.department);
  if (filters.skill) params.append('skill', filters.skill);
  if (filters.interest) params.append('interest', filters.interest);

  const res = await fetch(`${BACKEND_URL}/api/profile/search?${params.toString()}`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

// ─────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────
export async function fetchEvents() {
  const res = await fetch(`${BACKEND_URL}/api/events`);
  return handleResponse(res);
}

export async function fetchEvent(id: string) {
  const res = await fetch(`${BACKEND_URL}/api/events/${id}`);
  return handleResponse(res);
}

export async function createEvent(token: string, data: {
  community_id: string;
  title: string;
  description?: string;
  location?: string;
  event_date: string;
  category?: string;
  max_participants?: number;
}) {
  const res = await fetch(`${BACKEND_URL}/api/events`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateEvent(token: string, id: string, data: {
  title?: string;
  description?: string;
  location?: string;
  event_date?: string;
  category?: string;
  max_participants?: number;
  status?: string;
}) {
  const res = await fetch(`${BACKEND_URL}/api/events/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}