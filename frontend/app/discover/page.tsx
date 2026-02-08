'use client'
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseclient';

export default function DiscoverPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
    const fetchEvents = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select(`*, communities(name)`)
                .order('event_date', { ascending: true });
                
                if (error) throw error;
                if (data) setEvents(data);
            } catch (err) {
                console.error('Error loading events:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    if (loading) {
        return <div className="max-w-6xl mx-auto p-6 text-center">Loading opportunities...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900">Discover Opportunities</h1>
                <p className="text-gray-500">.</p>
            </header>

            {/* Empty State: Shows if Supabase tables are empty */}
            {events.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-white">
                    <p className="text-gray-400">No upcoming events found. Check back later!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                        <div key={event.id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
                                    {event.communities?.name || 'General'}
                                </span>
                                {/* REQ-10: Show activity point value for each event */}
                                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
                                    {event.ktu_points || 0} Points
                                </span>
                            </div>
                            
                            <h2 className="text-xl font-bold text-gray-800 leading-tight">{event.event_name}</h2>
                            <p className="text-gray-400 text-xs mt-2 font-medium">
                                📅 {new Date(event.event_date).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </p>
                            
                            <p className="text-gray-600 text-sm mt-4 line-clamp-2">
                                {event.description || 'No description available for this event.'}
                            </p>

                            <button className="w-full mt-6 py-2 px-4 bg-gray-50 text-blue-600 font-bold text-sm rounded-lg hover:bg-blue-600 hover:text-white transition-all border border-blue-100">
                                View Full Details
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}