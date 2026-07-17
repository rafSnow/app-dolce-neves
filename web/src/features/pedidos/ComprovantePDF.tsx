import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { PedidoFormData } from './PedidoForm'

// Caso queira usar uma fonte customizada depois, basta registrar aqui.
// Font.register({ family: 'Inter', src: '...' })

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 12,
    color: '#3f3f46', // zinc-700
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    paddingBottom: 20,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d97786', // dolce-rosa
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#71717a',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#3f3f46',
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 120,
    fontWeight: 'bold',
    color: '#52525b',
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    paddingBottom: 4,
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#52525b',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    paddingBottom: 4,
    marginBottom: 4,
  },
  col1: { width: '50%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '20%', textAlign: 'right' },
  totals: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e4e4e7',
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  totalLabel: {
    minWidth: 250,
    textAlign: 'right',
    paddingRight: 10,
    color: '#71717a',
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  grandTotalValue: {
    width: 100,
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 14,
    color: '#d97786',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#a1a1aa',
    fontSize: 10,
  }
})

interface Props {
  pedido: any // Using any here because it can be PedidoFormData or OrcamentoFormData
  nomeNegocio: string
  isOrcamento?: boolean
}

export function ComprovantePDF({ pedido, nomeNegocio, isOrcamento }: Props) {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR')
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.logoText}>{nomeNegocio}</Text>
          <Text style={styles.subtitle}>{isOrcamento ? 'Orçamento de Encomenda' : 'Comprovante de Pedido'}</Text>
        </View>

        {/* DADOS DO CLIENTE E PEDIDO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isOrcamento ? 'Detalhes do Orçamento' : 'Detalhes do Pedido'}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cliente:</Text>
            <Text style={styles.value}>{pedido.clienteNome}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Data de Entrega:</Text>
            <Text style={styles.value}>{formatDate(pedido.dataEntrega)}</Text>
          </View>
          {pedido.status && (
            <View style={styles.row}>
              <Text style={styles.label}>Status:</Text>
              <Text style={styles.value}>{pedido.status}</Text>
            </View>
          )}
        </View>

        {/* ITENS DO PEDIDO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Produto</Text>
            <Text style={styles.col2}>Qtd</Text>
            <Text style={styles.col3}>Unitário</Text>
            <Text style={styles.col4}>Subtotal</Text>
          </View>
          {pedido.itens?.map((item: any, idx: number) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.col1}>{item.produtoNome}</Text>
              <Text style={styles.col2}>{item.quantidade}</Text>
              <Text style={styles.col3}>{formatCurrency(item.precoUnitarioSnapshot)}</Text>
              <Text style={styles.col4}>{formatCurrency(item.valorItem)}</Text>
            </View>
          ))}
        </View>

        {/* RESUMO FINANCEIRO */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal Itens:</Text>
            <Text style={styles.totalValue}>{formatCurrency(pedido.valorTotal)}</Text>
          </View>
          {!isOrcamento && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Sinal (Pago):</Text>
                <Text style={styles.totalValue}>{formatCurrency(pedido.pagamentos?.sinal?.valor || 0)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Restante (Pendente):</Text>
                <Text style={styles.totalValue}>{formatCurrency(pedido.pagamentos?.restante?.valor || 0)}</Text>
              </View>
            </>
          )}
          <View style={[styles.totalRow, { marginTop: 10 }]}>
            <Text style={[styles.totalLabel, { fontWeight: 'bold', color: '#3f3f46' }]}>Total Geral:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(pedido.valorTotal)}</Text>
          </View>
        </View>

        {/* FOOTER */}
        <Text style={styles.footer}>
          Obrigado por adoçar o seu dia com a gente! • {nomeNegocio}
        </Text>
      </Page>
    </Document>
  )
}
