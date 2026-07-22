import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { InsumosPage } from './features/insumos/InsumosPage'
import { ProdutosPage } from './features/produtos/ProdutosPage'
import { ClientesPage } from './features/clientes/ClientesPage'
import { PedidosPage } from './features/pedidos/PedidosPage'
import { OrcamentosPage } from './features/orcamentos/OrcamentosPage'
import { LoginPage } from './features/auth/LoginPage'
import { AuthGuard } from './features/auth/AuthGuard'
import { ConfiguracoesPage } from './features/configuracoes/ConfiguracoesPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { DespesasPage } from './features/financeiro/DespesasPage'
import { ProducaoPage } from './features/producao/ProducaoPage'
import { useFirestoreCollection } from './hooks/useFirestore'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { ConfirmProvider } from './contexts/ConfirmContext'

function App() {
  const { data: configs } = useFirestoreCollection<any>('configuracoes')

  useEffect(() => {
    const configDoc = configs?.find((c: any) => c.id === 'global') || configs?.[0]
    if (configDoc?.nomeNegocio) {
      document.title = configDoc.nomeNegocio
    } else {
      document.title = 'Dolce Neves'
    }
  }, [configs])

  return (
    <ConfirmProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Rotas Protegidas */}
          <Route element={<AuthGuard />}>
            <Route path="/" element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="insumos" element={<InsumosPage />} />
              <Route path="produtos" element={<ProdutosPage />} />
              <Route path="clientes" element={<ClientesPage />} />
              <Route path="orcamentos" element={<OrcamentosPage />} />
              <Route path="pedidos" element={<PedidosPage />} />
              <Route path="producao" element={<ProducaoPage />} />
              <Route path="despesas" element={<DespesasPage />} />
              <Route path="configuracoes" element={<ConfiguracoesPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
      <Toaster position="top-center" richColors />
    </ConfirmProvider>
  )
}

export default App
