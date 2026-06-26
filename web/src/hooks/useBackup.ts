import { useState } from 'react'
import { collection, getDocs, doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useQueryClient } from '@tanstack/react-query'

const COLLECTIONS = [
  'clientes',
  'produtos',
  'insumos',
  'pedidos',
  'producao',
  'despesas',
  'configuracoes'
]

export function useBackup() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const queryClient = useQueryClient()

  const exportData = async () => {
    setIsExporting(true)
    try {
      const backupData: Record<string, any[]> = {}
      
      for (const colName of COLLECTIONS) {
        const snapshot = await getDocs(collection(db, colName))
        backupData[colName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      }

      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        collections: backupData
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toISOString().split('T')[0]
      a.download = `dolce-neves-backup-${dateStr}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      return true
    } catch (error) {
      console.error('Erro ao exportar backup:', error)
      throw error
    } finally {
      setIsExporting(false)
    }
  }

  const importData = async (file: File) => {
    setIsImporting(true)
    try {
      const text = await file.text()
      const backup = JSON.parse(text)
      
      if (!backup.collections) {
        throw new Error('Arquivo de backup inválido')
      }

      for (const colName of Object.keys(backup.collections)) {
        if (!COLLECTIONS.includes(colName)) continue
        
        const docs = backup.collections[colName]
        for (const docData of docs) {
          const { id, ...data } = docData
          if (id) {
            await setDoc(doc(db, colName, id), data)
          }
        }
      }

      // Invalida todos os caches do react-query para recarregar a tela
      await queryClient.invalidateQueries()
      
      return true
    } catch (error) {
      console.error('Erro ao importar backup:', error)
      throw error
    } finally {
      setIsImporting(false)
    }
  }

  return { exportData, importData, isExporting, isImporting }
}
