import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { client, setAuthToken } from '../../api/client'
import { User, LogOut, Plus, ChevronRight, Sparkles, Calendar as CalendarIcon } from 'lucide-react'

export default function Profile() {
  const navigate = useNavigate()

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await client.api.users.me.$get()
      if (!res.ok) throw new Error('Unauthorized')
      return res.json() as Promise<any>
    }
  })

  const { data: myEvents } = useQuery({
    queryKey: ['my-events'],
    queryFn: async () => {
      const res = await client.api.events.my.$get()
      if (!res.ok) return []
      return res.json() as Promise<any[]>
    }
  })

  const handleLogout = () => {
    setAuthToken(null)
    navigate('/')
  }

  if (loadingUser) return <div className="p-8 text-center text-gray-500 font-medium italic animate-pulse">Loading Profile...</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link to="/" className="text-xl font-black tracking-tighter text-blue-600 flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                TAPLA
            </Link>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                <LogOut className="w-5 h-5" />
            </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-12">
        {/* User Card */}
        <section className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shadow-inner">
                <User className="w-10 h-10" />
            </div>
            <div className="text-center md:text-left space-y-1">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">{user?.displayName}</h2>
                <p className="text-xs font-black text-blue-500 uppercase tracking-widest">Active Member</p>
            </div>
        </section>

        {/* My Events */}
        <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Organized Events</h3>
                <Link to="/events/create" className="text-blue-600 hover:text-blue-700 transition flex items-center gap-1 font-black text-[10px] uppercase tracking-widest">
                    <Plus className="w-3 h-3" />
                    New Event
                </Link>
            </div>
            <div className="grid gap-4">
              {myEvents?.length === 0 ? (
                  <div className="bg-white p-12 rounded-[32px] border-2 border-dashed border-gray-100 text-center space-y-4">
                      <CalendarIcon className="w-8 h-8 text-gray-200 mx-auto" />
                      <p className="text-sm text-gray-400 font-medium italic">You haven't organized any events yet.</p>
                  </div>
              ) : (
                myEvents?.map((e: any) => (
                    <Link 
                        key={e.id} 
                        to={`/events/${e.id}`} 
                        className="group bg-white p-6 rounded-3xl border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all flex items-center justify-between"
                    >
                        <div className="space-y-1">
                            <div className="font-black text-gray-800 group-hover:text-blue-600 transition text-lg tracking-tight">{e.title}</div>
                            <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                {new Date(e.createdAt).toLocaleDateString()}
                                <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                {e.dates.length} Days
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                    </Link>
                ))
              )}
            </div>
        </section>
      </div>
    </div>
  )
}
