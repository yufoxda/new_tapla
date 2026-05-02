import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { client } from '../../api/client'
import { CalendarDays, Plus } from 'lucide-react'

export default function EventList() {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await client.api.events.$get()
      if (!res.ok) throw new Error('Failed to fetch events')
      return res.json()
    }
  })

  if (isLoading) return <div className="p-8 text-center">Loading...</div>
  if (error) return <div className="p-8 text-center text-red-500">Error loading events</div>

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarDays className="w-8 h-8 text-blue-600" />
          予定調整
        </h1>
        <Link
          to="/events/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          新規作成
        </Link>
      </div>

      <div className="grid gap-4">
        {events?.length === 0 ? (
          <p className="text-gray-500 text-center py-8">イベントがありません</p>
        ) : (
          events?.map((event: any) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="block bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2">{event.title}</h2>
              {event.description && (
                <p className="text-gray-600 line-clamp-2 mb-4">{event.description}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                {event.candidates.slice(0, 3).map((cand: any) => (
                  <span key={cand.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    {new Date(cand.date).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                ))}
                {event.candidates.length > 3 && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">他 {event.candidates.length - 3} 件</span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
