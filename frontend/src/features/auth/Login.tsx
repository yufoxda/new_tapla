import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setAuthToken } from '../../api/client'

export default function Login() {
  // 初期値としてバックエンドで許可した 'dev-token' を入れておく
  const [token, setToken] = useState('dev-token')
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (token) {
      setAuthToken(token)
      navigate('/profile')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-800">Welcome</h1>
        <p className="text-gray-500 text-center mb-8">仮認証（Mock Auth）でログインします</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auth Token
            </label>
            <input
              type="text"
              value={token}
              onChange={e => setToken(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="dev-token"
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-200 transition transform active:scale-95">
            Login
          </button>
        </form>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>開発用ヒント:</strong><br />
            現在、バックエンドは <code>dev-token</code> という文字列を正しい認証として受け入れるように設定されています。そのままログインボタンを押してください。
          </p>
        </div>
      </div>
    </div>
  )
}
