import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'

export function AppShell() {
  const { logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="font-bold text-xl">Dolce Neves</h1>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          <Link to="/" className="block p-2 rounded hover:bg-gray-100">Dashboard</Link>
          <Link to="/insumos" className="block p-2 rounded hover:bg-gray-100">Insumos</Link>
          <Link to="/produtos" className="block p-2 rounded hover:bg-gray-100">Fichas Técnicas</Link>
          <Link to="/clientes" className="block p-2 rounded hover:bg-gray-100">Clientes</Link>
          <Link to="/pedidos" className="block p-2 rounded hover:bg-gray-100">Pedidos de Venda</Link>
          <Link to="/producao" className="block p-2 rounded hover:bg-gray-100">Produção (Cozinha)</Link>
          <Link to="/despesas" className="block p-2 rounded hover:bg-gray-100">Despesas</Link>
          <Link to="/configuracoes" className="block p-2 rounded hover:bg-gray-100">Configurações</Link>
        </nav>
        <div className="p-4 border-t">
          <button onClick={() => logout()} className="text-red-600 hover:underline text-sm w-full text-left">
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}
