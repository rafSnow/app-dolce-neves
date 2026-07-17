import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { 
  Home, Package, FileText, Users, ShoppingBag, 
  ChefHat, Receipt, Settings, LogOut, Menu, X, Candy
} from 'lucide-react'

export function AppShell() {
  const { logout } = useAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: Home, showInBottomBar: true },
    { to: '/orcamentos', label: 'Orçamentos', icon: FileText, showInBottomBar: true },
    { to: '/pedidos', label: 'Pedidos', icon: ShoppingBag, showInBottomBar: true },
    { to: '/producao', label: 'Produção', icon: ChefHat, showInBottomBar: true },
    { to: '/insumos', label: 'Insumos', icon: Package, showInBottomBar: false },
    { to: '/produtos', label: 'Fichas Técnicas', icon: FileText, showInBottomBar: false },
    { to: '/clientes', label: 'Clientes', icon: Users, showInBottomBar: false },
    { to: '/despesas', label: 'Despesas', icon: Receipt, showInBottomBar: false },
    { to: '/configuracoes', label: 'Configurações', icon: Settings, showInBottomBar: false },
  ]

  const NavItem = ({ to, label, icon: Icon, onClick }: any) => {
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
    return (
      <Link 
        to={to} 
        onClick={onClick}
        className={`flex items-center gap-3 p-3 rounded-xl transition-colors font-medium ${
          isActive 
            ? 'bg-dolce-rosa-claro text-dolce-marrom' 
            : 'text-dolce-marrom/70 hover:bg-dolce-creme hover:text-dolce-marrom'
        }`}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-dolce-rosa' : ''}`} />
        {label}
      </Link>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-transparent">
      
      {/* HEADER MOBILE */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-dolce-rosa-claro px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-dolce-rosa-claro p-1.5 rounded-lg">
            <Candy className="w-5 h-5 text-dolce-rosa" />
          </div>
          <h1 className="font-bold text-lg text-dolce-marrom tracking-tight">Dolce Neves</h1>
        </div>
      </header>

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex w-64 bg-white border-r border-dolce-rosa-claro flex-col fixed inset-y-0 z-10 shadow-sm">
        <div className="p-6 border-b border-dolce-rosa-claro flex items-center gap-3">
          <div className="bg-dolce-rosa-claro p-2 rounded-xl">
            <Candy className="w-6 h-6 text-dolce-rosa" />
          </div>
          <h1 className="font-extrabold text-xl text-dolce-marrom tracking-tight">Dolce Neves</h1>
        </div>
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
          {navLinks.map((link) => (
            <NavItem key={link.to} {...link} />
          ))}
        </nav>
        <div className="p-4 border-t border-dolce-rosa-claro">
          <button 
            onClick={() => logout()} 
            className="flex items-center gap-3 w-full text-left p-3 rounded-xl text-rose-600 hover:bg-rose-50 font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* OVERLAY DO MENU MOBILE */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-dolce-marrom/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* GAVETA / DRAWER MOBILE PARA "MAIS" */}
      <div className={`md:hidden fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-5 border-b border-dolce-rosa-claro flex items-center justify-between bg-dolce-creme/50">
          <h2 className="font-bold text-lg text-dolce-marrom">Menu Completo</h2>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-dolce-marrom/60 hover:text-dolce-marrom hover:bg-dolce-rosa-claro rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          {navLinks.map((link) => (
            <NavItem key={link.to} {...link} onClick={() => setIsMobileMenuOpen(false)} />
          ))}
        </nav>
        <div className="p-4 border-t border-dolce-rosa-claro bg-gray-50/50">
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false)
              logout()
            }} 
            className="flex items-center gap-3 w-full text-left p-3 rounded-xl text-rose-600 hover:bg-rose-50 font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 w-full max-w-full overflow-x-hidden">
        <Outlet />
      </main>

      {/* BOTTOM BAR MOBILE */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-dolce-rosa-claro shadow-[0_-4px_10px_rgba(0,0,0,0.02)] flex justify-around items-center p-2 pb-safe">
        {navLinks.filter(link => link.showInBottomBar).map((link) => {
          const isActive = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to))
          const Icon = link.icon
          return (
            <Link 
              key={link.to}
              to={link.to} 
              className={`flex flex-col items-center gap-1 w-16 p-2 rounded-xl transition-all ${
                isActive ? 'text-dolce-rosa' : 'text-dolce-marrom/50 hover:text-dolce-marrom'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-dolce-rosa-claro' : ''}`}>
                <Icon className={`w-6 h-6 ${isActive ? 'fill-dolce-rosa-claro/50' : ''}`} />
              </div>
              <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'text-dolce-marrom' : ''}`}>
                {link.label}
              </span>
            </Link>
          )
        })}
        {/* Botão Menu (Mais opções) */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center gap-1 w-16 p-2 rounded-xl transition-all ${
            isMobileMenuOpen ? 'text-dolce-rosa' : 'text-dolce-marrom/50 hover:text-dolce-marrom'
          }`}
        >
          <div className={`p-1 rounded-lg ${isMobileMenuOpen ? 'bg-dolce-rosa-claro' : ''}`}>
            <Menu className="w-6 h-6" />
          </div>
          <span className={`text-[10px] font-semibold tracking-wide ${isMobileMenuOpen ? 'text-dolce-marrom' : ''}`}>
            Menu
          </span>
        </button>
      </nav>

    </div>
  )
}
