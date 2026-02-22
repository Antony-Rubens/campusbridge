'use client';

import { useEffect, useState } from 'react';
import { fetchEvents } from '../../lib/api';

export default function DiscoverPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await fetchEvents();
        setEvents(data);
      } catch (err) {
        console.error('Failed to load events', err);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  if (loading) {
    return <div className="p-10 text-center">Loading opportunities…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Discover Opportunities</h1>

      {events.length === 0 ? (
        <p className="text-gray-500 text-center">No events found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white border rounded-xl p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold">{event.event_name}</h2>
              <p className="text-gray-500 text-sm mt-1">
                {new Date(event.event_date).toDateString()}
              </p>
              <p className="text-gray-600 mt-3 text-sm">
                {event.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}