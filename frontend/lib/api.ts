const BACKEND_URL = 'http://localhost:4000';

export async function fetchProfile(token: string) {
  const res = await fetch(`${BACKEND_URL}/api/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Profile fetch failed');
  }

  return res.json();
}

export async function fetchEvents() {
  const res = await fetch(`${BACKEND_URL}/api/events`);

  if (!res.ok) {
    throw new Error('Events fetch failed');
  }

  return res.json();
}