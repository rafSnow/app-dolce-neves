import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, QueryConstraint } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useFirestoreCollection<T>(collectionName: string, queryConstraints: QueryConstraint[] = []) {
  return useQuery({
    queryKey: [collectionName, ...queryConstraints],
    queryFn: async () => {
      const q = query(collection(db, collectionName), ...queryConstraints)
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T)
    }
  })
}

export function useFirestoreMutation<T>(collectionName: string) {
  const queryClient = useQueryClient()

  const addMutation = useMutation({
    mutationFn: async (data: Omit<T, 'id'>) => {
      const docRef = await addDoc(collection(db, collectionName), data as any)
      return { id: docRef.id, ...data }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [collectionName] })
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<T> }) => {
      const docRef = doc(db, collectionName, id)
      await updateDoc(docRef, data as any)
      return { id, ...data }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [collectionName] })
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Usando Soft Delete por RN-IN-04
      const docRef = doc(db, collectionName, id)
      await updateDoc(docRef, { ativo: false })
      return id
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [collectionName] })
  })

  const setMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<T> }) => {
      const docRef = doc(db, collectionName, id)
      await setDoc(docRef, data as any, { merge: true })
      return { id, ...data }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [collectionName] })
  })

  return { add: addMutation, update: updateMutation, remove: deleteMutation, set: setMutation }
}
