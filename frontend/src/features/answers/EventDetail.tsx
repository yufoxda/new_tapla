import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { client } from '../../api/client'
import { ArrowLeft, PlusCircle, MessageSquare } from 'lucide-react'

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()

  const { data: event, isLoading: loadingEvent } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const res = await client.api.events[':id'].$get({ param: { id: id! } })
      if (!res.ok) throw new Error('Failed to fetch event')
      return res.json() as Promise<any>
    }
  })

  const { data: allAnswers, isLoading: loadingAnswers } = useQuery({
    queryKey: ['answers', id],
    queryFn: async () => {
      const res = await client.api.events[':eventId'].answers.$get({ param: { eventId: id! } })
      if (!res.ok) throw new Error('Failed to fetch answers')
      return res.json() as Promise<any[]>
    }
  })

  const getParticipantCount = (dateId: string, timeId: string) => {
    if (!allAnswers) return 0
    return allAnswers.filter((ans: any) => 
      ans.votes.some((v: any) => v.eventDateId === dateId && v.eventTimeId === timeId && v.status === 'attend')
    ).length
  }

  if (loadingEvent || loadingAnswers) return <div className="p-8 text-center text-gray-400 font-medium animate-pulse italic">Loading results...</div>

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-screen-xl mx-auto p-4 sm:p-8">
        <Link to="/profile" className="inline-flex items-center text-gray-400 hover:text-gray-900 mb-8 font-bold text-xs uppercase tracking-widest transition">
          <ArrowLeft className="w-3 h-3 mr-1" />
          Back to My Page
        </Link>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 mb-16">
            <div className="max-w-xl">
                <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">{event?.title}</h1>
                <p className="text-gray-500 leading-relaxed">{event?.description}</p>
                <div className="mt-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">Created by {event?.creatorDisplayName}</div>
            </div>
            <Link
                to={`/events/${id}/answer`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-full font-black shadow-xl shadow-blue-100 flex items-center justify-center gap-2 transition transform active:scale-95 uppercase text-xs tracking-widest"
            >
                <PlusCircle className="w-4 h-4" />
                Vote Availability
            </Link>
        </div>

        <div className="flex justify-center mb-20">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-2xl shadow-gray-200/50 inline-block">
                <div className="overflow-x-auto">
                    <div 
                        className="grid" 
                        style={{ 
                            gridTemplateColumns: `50px repeat(${event?.dates.length || 0}, 46px)`,
                        }}
                    >
                        {/* Header Row */}
                        <div className="bg-gray-50/50 p-2 border-b border-r border-gray-50 flex items-center justify-center text-[9px] font-black text-gray-300 uppercase tracking-tighter">Time</div>
                        {event?.dates.map((d: any) => (
                            <div key={d.id} className="bg-gray-50/50 p-1 border-b border-r border-gray-50 flex flex-col items-center justify-center min-h-[46px]">
                                <div className="text-xs font-black text-gray-800">{d.dateLabel}</div>
                            </div>
                        ))}

                        {/* Data Rows */}
                        {event?.times.map((t: any) => (
                            <div key={t.id} className="contents">
                                <div className="bg-gray-50/30 p-1 border-b border-r border-gray-50 flex items-center justify-center font-mono text-[10px] font-bold text-gray-400">
                                    {t.timeLabel}
                                </div>
                                {event?.dates.map((d: any) => {
                                    const count = getParticipantCount(d.id, t.id)
                                    const isHot = count > 0 && allAnswers && count === allAnswers.length && allAnswers.length > 1
                                    
                                    return (
                                        <div key={d.id} className="border-b border-r border-gray-50 p-0.5 flex items-center justify-center">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black transition-all ${
                                                count === 0 ? 'text-gray-100' : 
                                                isHot ? 'bg-orange-500 text-white shadow-lg shadow-orange-100 scale-90' : 'text-blue-600 bg-blue-50/50'
                                            }`}>
                                                {count > 0 ? count : '-'}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <div className="max-w-2xl mx-auto border-t border-gray-100 pt-12">
            <div className="flex items-center gap-2 font-black text-gray-300 uppercase text-[10px] tracking-[0.2em] mb-8">
                <MessageSquare className="w-3 h-3" />
                Messages
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
                {allAnswers?.filter((a: any) => a.comment)?.length === 0 ? (
                    <p className="text-gray-300 text-sm italic col-span-2 text-center">No messages yet.</p>
                ) : (
                    allAnswers?.filter((a: any) => a.comment).map((ans: any) => (
                        <div key={ans.id} className="p-5 bg-gray-50 rounded-2xl text-sm border border-gray-50">
                            <div className="text-[10px] font-black text-gray-400 mb-2 tracking-tighter">{ans.userLabel}</div>
                            <p className="text-gray-700 leading-relaxed font-medium">{ans.comment}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  )
}
