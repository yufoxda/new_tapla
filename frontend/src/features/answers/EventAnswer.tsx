import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { client } from '../../api/client'
import { ArrowLeft, Check } from 'lucide-react'
import type { z } from 'zod'
import { EventSchema, EventDateSchema, EventTimeSchema } from '@backend/features/events/schema'
import { UserSchema } from '@backend/features/users/schema'

type EventType = z.infer<typeof EventSchema>
type UserType = z.infer<typeof UserSchema>
type DateType = z.infer<typeof EventDateSchema>
type TimeType = z.infer<typeof EventTimeSchema>
type AnswerStatus = boolean

export default function EventAnswer() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [userLabel, setUserLabel] = useState('')
  const [comment, setComment] = useState('')
  // Key: "dateId:timeId", Value: status
  const [localAnswers, setLocalAnswers] = useState<Record<string, AnswerStatus>>({})

  const { data: event, isLoading: loadingEvent } = useQuery<EventType>({
    queryKey: ['event', id],
    queryFn: async () => {
      const res = await client.api.events[':id'].$get({ param: { id: id! } })
      if (!res.ok) throw new Error('Failed to fetch event')
      return res.json()
    },
    enabled: !!id
  })

  // ログインユーザー情報を取得してデフォルトの名前をセット
  useQuery<UserType | null>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await client.api.users.$get()
      if (res.ok) {
        const data = await res.json() as UserType
        setUserLabel((prev: string) => prev || data.displayName)
        return data
      }
      return null
    }
  })

  useEffect(() => {
    if (!event) return
    const initial: Record<string, AnswerStatus> = {}
    event.dates.forEach((d: DateType) => {
      event.times.forEach((t: TimeType) => {
        initial[`${d.id}:${t.id}`] = false
      })
    })
    setLocalAnswers(initial)
  }, [event])

  const submitMutation = useMutation({
    mutationFn: async () => {
      const votes = Object.entries(localAnswers).map(([key, status]) => {
        const [eventDateId, eventTimeId] = key.split(':')
        return { eventDateId, eventTimeId, status }
      })

      const res = await client.api.events[':eventId'].answers.$put({
        param: { eventId: id! },
        json: {
          userLabel,
          comment,
          votes
        }
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

        <div className="max-w-sm mx-auto mb-10 space-y-4">
            <input
                type="text"
                value={userLabel}
                onChange={e => setUserLabel(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                placeholder="Your Name"
            />
        </div>

        <div className="flex justify-center">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-2xl shadow-gray-200/50">
                <div className="overflow-x-auto">
                <div 
                    className="grid" 
                    style={{ 
                        gridTemplateColumns: `50px repeat(${event?.dates.length || 0}, 46px)`,
                    }}
                >
                    {/* Header Row */}
                    <div className="bg-gray-50/50 p-2 border-b border-r border-gray-50 flex items-center justify-center text-[9px] font-black text-gray-300 uppercase tracking-tighter">Time</div>
                    {event?.dates.map((d: DateType) => (
                        <div key={d.id} className="bg-gray-50/50 p-1 border-b border-r border-gray-50 flex flex-col items-center justify-center min-h-[46px]">
                            <div className="text-xs font-black text-gray-800">{d.dateLabel}</div>
                        </div>
                    ))}

                    {/* Data Rows */}
                    {event?.times.map((t: TimeType) => (
                    <div className="contents" key={t.id}>
                        <div className="bg-gray-50/30 p-1 border-b border-r border-gray-50 flex items-center justify-center font-mono text-[10px] font-bold text-gray-400">
                        {t.timeLabel}
                        </div>
                        {event?.dates.map((d: DateType) => {
                        const cellKey = `${d.id}:${t.id}`
                        const isAttending = localAnswers[cellKey] === true
                        return (
                            <div key={d.id} className="border-b border-r border-gray-50 p-0.5 flex items-center justify-center">
                            <button
                                onClick={() => setLocalAnswers(prev => ({ ...prev, [cellKey]: !isAttending }))}
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
          disabled={submitMutation.isPending || !userLabel}
          className="bg-blue-600 hover:bg-blue-700 text-white px-20 py-4 rounded-full font-black shadow-xl shadow-blue-200 transition transform active:scale-95 uppercase text-xs tracking-widest disabled:opacity-50"
        >
          {submitMutation.isPending ? 'Submitting...' : 'Confirm Availability'}
        </button>
      </div>
    </div>
  )
}
