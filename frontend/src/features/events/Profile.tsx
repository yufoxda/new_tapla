import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { client, setAuthToken } from '../../api/client'
import { User, LogOut, Plus, ChevronRight, Sparkles, Check, Save } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'

export default function Profile() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // 1. 自分が作った予定
  const { data: myEvents, isLoading: loadingMy } = useQuery({
    queryKey: ['events', 'my'],
    queryFn: async () => {
      const res = await client.api.events.my.$get()
      if (!res.ok) throw new Error('Failed to fetch my events')
      return res.json()
    }
  })

  // 2. 自分が投票した予定
  const { data: votedEvents, isLoading: loadingVoted } = useQuery({
    queryKey: ['events', 'voted'],
    queryFn: async () => {
      const res = await client.api.events.voted.$get()
      if (!res.ok) throw new Error('Failed to fetch voted events')
      return res.json()
    }
  })

  // 3. 自分のマスター空き状況を取得
  const { data: globalAvailability } = useQuery({
    queryKey: ['global-availability'],
    queryFn: async () => {
      const res = await client.api.answers['global-availability'].$get()
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  // ローカルでの編集用状態
  const [localGlobal, setLocalGlobal] = useState<Record<string, 'attend' | 'absent'>>({})

  // 初期値セット
  useEffect(() => {
    if (globalAvailability) {
      const dict: Record<string, 'attend' | 'absent'> = {}
      globalAvailability.forEach(item => {
        dict[item.date] = item.status as 'attend' | 'absent'
      })
      setLocalGlobal(dict)
    }
  }, [globalAvailability])

  // 表示用の日付スロット
  const autofillPreview = useMemo(() => {
    const times = ['18:00', '19:00', '20:00', '21:00']
    const dates = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 0; i < 7; i++) {
        const d = new Date(today)
        d.setDate(today.getDate() + i)
        dates.push(d)
    }
    return { times, dates }
  }, [])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = Object.entries(localGlobal).map(([date, status]) => ({ date, status }))
      await client.api.answers['global-availability'].$put({ json: payload })
    },
    onSuccess: () => {
        alert('マスター設定を保存しました。今後の自動入力に反映されます。')
        queryClient.invalidateQueries({ queryKey: ['global-availability'] })
    }
  })

  const handleLogout = () => {
    setAuthToken('')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="bg-white border-b border-gray-50 sticky top-0 z-10 px-4 py-4 flex justify-between items-center max-w-5xl mx-auto w-full">
        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2 tracking-tighter">
          <User className="w-5 h-5 text-blue-600" />
          DASHBOARD
        </h1>
        <button onClick={handleLogout} className="text-gray-300 hover:text-red-500 transition p-2">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-20">
        <div className="text-center">
            <Link to="/events/new" className="inline-flex items-center gap-3 bg-blue-600 text-white px-10 py-5 rounded-full font-black shadow-2xl shadow-blue-100 hover:bg-blue-700 transition transform active:scale-95 uppercase text-xs tracking-[0.2em]">
                <Plus className="w-4 h-4" />
                Create New Event
            </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-16">
          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">My Events</h3>
            <div className="space-y-3">
              {loadingMy ? <div className="h-20 bg-gray-50 rounded-2xl animate-pulse" /> : 
               myEvents?.length === 0 ? <p className="text-xs text-gray-400 p-8 border-2 border-dashed border-gray-50 rounded-3xl text-center">No created events.</p> :
               myEvents?.map((e: any) => (
                <Link key={e.id} to={`/events/${e.id}`} className="group block bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                  <div className="font-black text-gray-800 group-hover:text-blue-600 transition text-lg">{e.title}</div>
                  <div className="text-[10px] font-bold text-gray-300 mt-2 uppercase">{new Date(e.createdAt).toLocaleDateString()}</div>
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Voted</h3>
            <div className="space-y-3">
              {loadingVoted ? <div className="h-20 bg-gray-50 rounded-2xl animate-pulse" /> : 
               votedEvents?.length === 0 ? <p className="text-xs text-gray-400 p-8 border-2 border-dashed border-gray-50 rounded-3xl text-center">No voted events.</p> :
               votedEvents?.map((e: any) => (
                <Link key={e.id} to={`/events/${e.id}`} className="group block bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition flex justify-between items-center">
                  <div>
                    <div className="font-black text-gray-800 group-hover:text-blue-600 transition text-lg">{e.title}</div>
                    <div className="text-[10px] font-bold text-gray-300 mt-2 uppercase">Last Update: {new Date(e.createdAt).toLocaleDateString()}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-blue-400 transition" />
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* マスター空き状況設定 */}
        <section className="pt-16 border-t border-gray-100">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="flex items-center gap-2 font-black text-gray-400 uppercase text-[10px] tracking-[0.2em] mb-4">
                <Sparkles className="w-3 h-3 text-blue-500" />
                Master Availability
            </div>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed font-medium">
              Tap slots below to set your <span className="text-blue-600 font-bold">default schedule</span>. These will be automatically applied to any new event invitation.
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-8">
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-2xl shadow-gray-200/50 inline-block max-w-full">
                <div className="overflow-x-auto touch-pan-x">
                    <div className="grid" style={{ gridTemplateColumns: `50px repeat(${autofillPreview.dates.length}, 46px)` }}>
                        <div className="bg-gray-50/50 p-2 border-b border-r border-gray-50" />
                        {autofillPreview.dates.map((date, i) => (
                            <div key={i} className="bg-gray-50/50 p-1 border-b border-r border-gray-50 flex flex-col items-center justify-center min-h-[46px]">
                                <div className="text-[10px] text-gray-400 font-black leading-none mb-0.5">{date.getMonth() + 1}/</div>
                                <div className="text-sm font-black text-gray-800">{date.getDate()}</div>
                            </div>
                        ))}

                        {autofillPreview.times.map(time => (
                            <div key={time} className="contents">
                                <div className="bg-gray-50/30 p-1 border-b border-r border-gray-50 flex items-center justify-center font-mono text-[10px] font-bold text-gray-400">{time}</div>
                                {autofillPreview.dates.map((date, i) => {
                                    const iso = new Date(date)
                                    iso.setHours(parseInt(time.split(':')[0]), 0, 0, 0)
                                    const key = iso.toISOString()
                                    const isAttending = localGlobal[key] === 'attend'
                                    
                                    return (
                                        <div key={i} className="border-b border-r border-gray-50 p-0.5 flex items-center justify-center">
                                            <button 
                                                onClick={() => setLocalGlobal(prev => ({ ...prev, [key]: isAttending ? 'absent' : 'attend' }))}
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                                                isAttending 
                                                ? 'bg-blue-600 text-white scale-90 shadow-lg shadow-blue-100' 
                                                : 'bg-white border border-gray-100 text-transparent hover:border-blue-200'
                                            }`}>
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

            <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-full font-black shadow-xl hover:bg-black transition active:scale-95 uppercase text-[10px] tracking-widest"
            >
                <Save className="w-4 h-4" />
                {saveMutation.isPending ? 'Saving...' : 'Save Master Patterns'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
