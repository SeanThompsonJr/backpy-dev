import { useSyncExternalStore } from 'react'
import { sqlRunner } from './sql-client'

export const useSqlStatus = () => useSyncExternalStore(sqlRunner.subscribe, sqlRunner.getStatus)
