import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { client } from '../../api/client'
import { ArrowLeft, Check, Save } from 'lucide-react'

type AnswerStatus = 'attend' | 'absent'

export default function EventAnswer() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [comment, setComment] = useState('')
  const [localAnswers, setLocalAnswers] = useState<Record<string, AnswerStatus>>({})

  const { data: event, isLoading: loadingEvent } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const res = await client.api.events[':id'].$get({ param: { id: id! } })
      if (!res.ok) throw new Error('Failed to fetch event')
      return res.json()
    },
    enabled: !!id
  })

  const { data: autofillData } = useQuery({
    queryKey: ['autofill', event?.candidates?.map((c: any) => c.date).join(',')],
    queryFn: async () => {
      if (!event?.candidates?.length) return []
      const datesParam = event.candidates.map((c: any) => c.date).join(',')
      const res = await client.api.users.me.autofill.$get({ query: { dates: datesParam } })
      if (!res.ok) throw new Error('Failed to fetch autofill data')
      return res.json()
    },
    enabled: !!event?.candidates?.length
  })

  useEffect(() => {
    if (!event) return
    const initial: Record<string, AnswerStatus> = {}
    event.candidates.forEach((cand: any) => {
      const auto = autofillData?.find((a: any) => a.date === cand.date)
      initial[cand.id] = (auto?.status === 'attend') ? 'attend' : 'absent'
    })
    setLocalAnswers(initial)
  }, [event, autofillData])

  const { uniqueDates, timeSlots } = useMemo(() => {
    if (!event?.candidates) return { uniqueDates: [], timeSlots: [] }
    const datesSet = new Set<string>()
    const timesSet = new Set<string>()
    event.candidates.forEach((c: any) => {
      const d = new Date(c.date)
      const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
      const timeStr = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
      datesSet.add(dateStr)
      timesSet.add(timeStr)
    })
    return { uniqueDates: Array.from(datesSet).sort(), timeSlots: Array.from(timesSet).sort() }
  }, [event])

  const getCandidateId = (dateStr: string, timeStr: string) => {
    return event?.candidates.find((c: any) => {
      const d = new Date(c.date)
      const cd = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
      const ct = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
      return cd === dateStr && ct === timeStr
    })?.id
  }

  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        comment,
        candidateAnswers: Object.entries(localAnswers).map(([candidateId, status]) => ({
          candidateId,
          status: status as 'attend' | 'absent' | 'pending'
        }))
      }
      const res = await client.api.events[':eventId'].answers.me.$put({
        param: { eventId: id! },
        json: payload
      })
      if (!res.ok) throw new Error('Failed to submit answer')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers', id] })
      navigate(`/events/${id}`)
    }
  })

  if (loadingEvent) return <div className="p-8 text-center text-gray-500 font-medium italic">読み込み中...</div>

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="max-w-screen-xl mx-auto p-4 sm:p-8">
        <Link to={`/events/${id}`} className="inline-flex items-center text-gray-400 hover:text-gray-900 mb-8 font-bold text-xs uppercase tracking-widest transition">
          <ArrowLeft className="w-3 h-3 mr-1" />
          Back to Summary
        </Link>

        <h1 className="text-2xl font-black text-gray-900 mb-10 text-center">{event?.title}</h1>

        <div className="flex justify-center">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-2xl shadow-gray-200/50">
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
                        const candId = getCandidateId(date, time)
                        if (!candId) return <div key={date} className="bg-gray-50/10 border-b border-r border-gray-50"></div>
                        
                        const isAttending = localAnswers[candId] === 'attend'
                        return (
                            <div key={date} className="border-b border-r border-gray-50 p-0.5 flex items-center justify-center">
                            <button
                                onClick={() => setLocalAnswers(prev => ({ ...prev, [candId]: isAttending ? 'absent' : 'attend' }))}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-75 ${
                                    isAttending 
                                    ? 'bg-blue-600 text-white scale-90' 
                                    : 'bg-white border border-gray-100 text-transparent hover:border-blue-200'
                                }`}
                            >
                                <Check className={`w-5 h-5 stroke-[4px] ${isAttending ? 'opacity-100' : 'opacity-0'}`} />
                            </button>
                            </div>
                        )
                        })}
                    </div>
                    ))}
                </div>
                </div>
            </div>
        </div>

        <div className="mt-12 max-w-sm mx-auto">
             <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm italic"
                placeholder="Leave a message..."
                rows={2}
              />
        </div>
      </div>

      <div className="fixed bottom-8 left-0 right-0 px-4 flex justify-center z-20">
        <button
          onClick={() => submitMutation.mutate()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-20 py-4 rounded-full font-black shadow-xl shadow-blue-200 transition transform active:scale-95 uppercase text-xs tracking-widest"
        >
          Confirm Availability
        </button>
      </div>
    </div>
  )
}
