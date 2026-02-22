'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchEvents } from '../../lib/api';

export default function DiscoverPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

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

  // Get unique categories for filter dropdown
  const categories = [...new Set(events
    .map(e => e.category)
    .filter(Boolean)
  )];

  // Filter events by search and category
  const filtered = events.filter(event => {
    const matchesSearch =
      event.title?.toLowerCase().includes(search.toLowerCase()) ||
      event.description?.toLowerCase().includes(search.toLowerCase()) ||
      event.community_name?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = filterCategory
      ? event.category === filterCategory
      : true;

    return matchesSearch && matchesCategory;
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500 text-lg">Loading events...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-600">Discover Events</h1>
        <p className="text-gray-500 mt-1">
          Browse upcoming campus events published by communities
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="Search events, communities..."
          className="flex-1 p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="p-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat: any) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-400 mb-4">
        {filtered.length} event{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Events Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No events found.</p>
          <p className="text-gray-300 text-sm mt-1">
            Try adjusting your search or check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((event) => (
            <div
              key={event.id}
              onClick={() => router.push(`/explore/${event.id}`)}
              className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition cursor-pointer"
            >
              {/* Category badge */}
              {event.category && (
                <span className="inline-block text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 mb-3">
                  {event.category}
                </span>
              )}

              {/* Title */}
              <h2 className="text-lg font-bold text-gray-800 leading-snug">
                {event.title}
              </h2>

              {/* Community */}
              <p className="text-sm text-blue-500 mt-1 font-medium">
                {event.community_name}
              </p>

              {/* Description */}
              <p className="text-gray-500 mt-3 text-sm line-clamp-2">
                {event.description || 'No description provided.'}
              </p>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  📅 {new Date(event.event_date).toDateString()}
                </div>
                {event.location && (
                  <div className="flex items-center gap-1">
                    📍 {event.location}
                  </div>
                )}
              </div>

              {/* Max participants */}
              {event.max_participants && (
                <p className="text-xs text-gray-400 mt-2">
                  👥 Max {event.max_participants} participants
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}