import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { Mail, Lock, Loader2, Sparkles } from 'lucide-react'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError('E-mail ou senha incorretos.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-dolce-rosa via-dolce-creme to-white">
      {/* Elementos decorativos no fundo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-dolce-rosa/20 rounded-full blur-2xl"></div>
      </div>

      <div className="relative max-w-sm w-full space-y-8 p-8 md:p-10 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 z-10">
        
        {/* Cabecalho / Logo */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-dolce-marrom to-gray-800 rounded-2xl shadow-lg flex items-center justify-center mb-6 border border-gray-700 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-dolce-rosa rounded-full blur-xl opacity-20"></div>
            <Sparkles className="w-8 h-8 text-dolce-creme relative z-10" />
          </div>
          <h2 className="text-3xl font-extrabold text-dolce-marrom tracking-tight mb-2">
            Bem-vindo(a)
          </h2>
          <p className="text-sm font-medium text-gray-500 text-center">
            Acesse o sistema para organizar a sua confeitaria.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          
          {/* Alerta de Erro */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 shadow-sm animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Campo E-mail */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-11 pr-4 py-3.5 bg-white/70 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-dolce-rosa focus:border-transparent transition-all font-medium"
                  placeholder="Seu e-mail de acesso"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-11 pr-4 py-3.5 bg-white/70 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-dolce-rosa focus:border-transparent transition-all font-medium"
                  placeholder="Sua senha secreta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl text-sm font-extrabold text-white bg-dolce-marrom hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dolce-marrom shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
