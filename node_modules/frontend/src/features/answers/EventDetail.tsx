import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { client } from '../../api/client'
import { ArrowLeft, Users, PlusCircle, MessageSquare } from 'lucide-react'

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()

  const { data: event, isLoading: loadingEvent } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const res = await client.api.events[':id'].$get({ param: { id: id! } })
      if (!res.ok) throw new Error('Failed to fetch event')
      return res.json()
    }
  })

  const { data: allAnswers, isLoading: loadingAnswers } = useQuery({
    queryKey: ['answers', id],
    queryFn: async () => {
      const res = await client.api.answers[':eventId'].$get({ param: { eventId: id! } })
      if (!res.ok) throw new Error('Failed to fetch answers')
      return res.json()
    }
  })

  const { uniqueDates, timeSlots } = useMemo(() => {
    if (!event?.candidates) return { uniqueDates: [], timeSlots: [] }
    const datesSet = new Set<string>()
    const timesSet = new Set<string>()
    event.candidates.forEach((c: any) => {
      const d = new Date(c.date)
      datesSet.add(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'))
      timesSet.add(String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'))
    })
    return { uniqueDates: Array.from(datesSet).sort(), timeSlots: Array.from(timesSet).sort() }
  }, [event])

  const getParticipantCount = (dateStr: string, timeStr: string) => {
    const candId = event?.candidates.find((c: any) => {
        const d = new Date(c.date)
        const cd = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
        const ct = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
        return cd === dateStr && ct === timeStr
    })?.id
    if (!candId || !allAnswers) return 0
    return allAnswers.filter((ans: any) => 
      ans.candidateAnswers.some((ca: any) => ca.candidateId === candId && ca.status === 'attend')
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
                            gridTemplateColumns: `50px repeat(${uniqueDates.length}, 46px)`,
                        }}
                    >
                        {/* Header Row */}
                        <div className="bg-gray-50/50 p-2 border-b border-r border-gray-50 flex items-center justify-center text-[9px] font-black text-gray-300 uppercase tracking-tighter">Time</div>
                        {uniqueDates.map(date => {
                            const d = new Date(date)
                            return (
                                <div key={date} className="bg-gray-50/50 p-1 border-b border-r border-gray-50 flex flex-col items-center justify-center min-h-[46px]">
                                    <div className="text-[10px] text-gray-400 font-black leading-none mb-0.5">{d.getMonth() + 1}/</div>
                                    <div className="text-sm font-black text-gray-800">{d.getDate()}</div>
                                </div>
                            )
                        })}

                        {/* Data Rows */}
                        {timeSlots.map(time => (
                            <div key={time} className="contents">
                                <div className="bg-gray-50/30 p-1 border-b border-r border-gray-50 flex items-center justify-center font-mono text-[10px] font-bold text-gray-400">
                                    {time}
                                </div>
                                {uniqueDates.map(date => {
                                    const count = getParticipantCount(date, time)
                                    const isHot = count > 0 && allAnswers && count === allAnswers.length && allAnswers.length > 1
                                    
                                    return (
                                        <div key={date} className="border-b border-r border-gray-50 p-0.5 flex items-center justify-center">
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
                        <div key={ans.userId} className="p-5 bg-gray-50 rounded-2xl text-sm border border-gray-50">
                            <div className="text-[9px] font-black text-gray-400 mb-2 uppercase tracking-tighter">User_{ans.userId.slice(0,5)}</div>
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
