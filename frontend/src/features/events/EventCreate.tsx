import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { client } from '../../api/client'
import { ArrowLeft, Eye } from 'lucide-react'

export default function EventCreate() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [dayCount, setDayCount] = useState(3)
  const [startTime, setStartTime] = useState('18:00')
  const [hourCount, setHourCount] = useState(4)

  // プレビュー用の候補リスト生成ロジック
  const { uniqueDates, timeSlots } = useMemo(() => {
    const dates: string[] = []
    const times: string[] = []
    try {
        const startBase = new Date(`${startDate}T${startTime}:00`)
        if (isNaN(startBase.getTime())) return { uniqueDates: [], timeSlots: [] }

        for (let d = 0; d < dayCount; d++) {
            const date = new Date(startBase)
            date.setDate(date.getDate() + d)
            dates.push(`${date.getMonth() + 1}/${date.getDate()}`)
        }
        for (let h = 0; h < hourCount; h++) {
            const date = new Date(startBase)
            date.setHours(date.getHours() + h)
            times.push(String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0'))
        }
    } catch (e) { return { uniqueDates: [], timeSlots: [] } }
    return { uniqueDates: Array.from(new Set(dates)), timeSlots: Array.from(new Set(times)) }
  }, [startDate, dayCount, startTime, hourCount])

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await client.api.events.$post({
        json: {
          title,
          description: description || undefined,
          dates: uniqueDates,
          times: timeSlots
        }
      })
      if (!res.ok) throw new Error('Failed to create event')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      navigate(`/events/${data.id}`)
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        <Link to="/profile" className="inline-flex items-center text-gray-400 hover:text-gray-900 mb-8 font-bold text-xs uppercase tracking-widest transition">
          <ArrowLeft className="w-3 h-3 mr-1" />
          Back to My Page
        </Link>
        
        <h1 className="text-4xl font-black text-gray-900 mb-12 tracking-tighter text-center">New Event</h1>

        <form onSubmit={e => { e.preventDefault(); createMutation.mutate() }} className="space-y-12">
            {/* Input Section */}
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-10">
                <div className="space-y-4">
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full px-0 py-2 bg-transparent border-b-2 border-gray-100 focus:border-blue-600 outline-none text-2xl font-black placeholder:text-gray-200 transition-colors"
                        placeholder="Event Title"
                    />
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full px-0 py-2 bg-transparent border-b border-gray-100 focus:border-blue-600 outline-none text-sm italic text-gray-500 placeholder:text-gray-200 resize-none"
                        placeholder="Optional description..."
                        rows={1}
                    />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Date</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Days</label>
                        <input type="number" min="1" max="14" value={dayCount} onChange={e => setDayCount(Number(e.target.value))} className="w-full p-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Time</label>
                        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hours</label>
                        <input type="number" min="1" max="24" value={hourCount} onChange={e => setHourCount(Number(e.target.value))} className="w-full p-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" />
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 font-black text-gray-400 uppercase text-[10px] tracking-widest ml-1">
                    <Eye className="w-3 h-3" />
                    Preview Matrix
                </div>
                <div className="flex justify-center">
                    <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/20 inline-block overflow-hidden max-w-full">
                        <div className="overflow-x-auto">
                            <div className="grid" style={{ gridTemplateColumns: `50px repeat(${uniqueDates.length}, 40px)` }}>
                                <div className="p-2 border-b border-r border-gray-50" />
                                {uniqueDates.map(date => (
                                    <div key={date} className="p-1 border-b border-r border-gray-50 text-center flex flex-col justify-center min-h-[40px] bg-gray-50/50">
                                        <div className="text-xs font-black text-gray-800">{date}</div>
                                    </div>
                                ))}
                                {timeSlots.map(time => (
                                    <div key={time} className="contents">
                                        <div className="p-1 border-b border-r border-gray-50 text-[9px] font-bold text-gray-400 font-mono flex items-center justify-center bg-gray-50/50">{time}</div>
                                        {uniqueDates.map(date => (
                                            <div key={date} className="border-b border-r border-gray-50 flex items-center justify-center h-10">
                                                <div className="w-5 h-5 rounded-md bg-blue-50 border border-blue-100" />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 px-8 rounded-full shadow-2xl shadow-blue-200 transition transform active:scale-95 uppercase text-xs tracking-widest"
            >
                {createMutation.isPending ? 'Processing...' : 'Create & Share Event'}
            </button>
        </form>
      </div>
    </div>
  )
}
