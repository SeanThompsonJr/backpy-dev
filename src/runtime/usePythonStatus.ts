import { useSyncExternalStore } from 'react'
import { python } from './python-client'

export const usePythonStatus = () => useSyncExternalStore(python.subscribe, python.getStatus)
