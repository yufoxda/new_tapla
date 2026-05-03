import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { client, setAuthToken } from '../../api/client'
import { User, LogOut, Plus, Sparkles, Calendar as CalendarIcon } from 'lucide-react'
import type { z } from 'zod'
import { UserSchema } from '@backend/features/users/schema'

type UserType = z.infer<typeof UserSchema>

export default function Profile() {
  const navigate = useNavigate()

  const { data: user, isLoading: loadingUser } = useQuery<UserType>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await client.api.users.$get()
      if (!res.ok) throw new Error('Unauthorized')
      return res.json()
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

        {/* My Events Section - Now just a call to action since backend doesn't return my events list */}
        <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Event Management</h3>
            </div>
            <div className="grid gap-4">
                  <div className="bg-white p-12 rounded-[32px] border border-gray-100 shadow-sm text-center space-y-6">
                      <CalendarIcon className="w-12 h-12 text-blue-600 mx-auto" />
                      <p className="text-gray-500 font-medium max-w-sm mx-auto">
                        Create a new event to share with your friends and start scheduling.
                      </p>
                      <Link to="/events/new" className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-200">
                        <Plus className="w-4 h-4" />
                        Create New Event
                      </Link>
                  </div>
            </div>
        </section>
      </div>
    </div>
  )
}
