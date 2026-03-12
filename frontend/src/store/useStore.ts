import { create } from 'zustand'

export type SystemStatus = 'READY' | 'PROCESSING' | 'ANALYZING' | 'SECURE' | 'COMPROMISED'

interface SystemState {
  status: SystemStatus
  logs: string[]
  stats: { analyses: number; embedded: number; threats: number }
  systemInitialized: boolean
  setStatus: (status: SystemStatus) => void
  addLog: (msg: string) => void
  incrementStat: (key: keyof SystemState['stats']) => void
  setSystemInitialized: (val: boolean) => void
}

export const useStore = create<SystemState>((set) => ({
  status: 'READY',
  logs: [`[${new Date().toLocaleTimeString()}] KERNEL_READY: DeepSteg AI Suite v1.0.4 initialized.`],
  stats: { analyses: 4, embedded: 2, threats: 1 },
  systemInitialized: false,

  setStatus: (status) => set((state) => ({
    status,
    logs: [...state.logs, `[${new Date().toLocaleTimeString()}] SIGNAL_CHANGE → ${status}`]
  })),

  addLog: (msg) => set((state) => ({
    logs: [...state.logs, `[${new Date().toLocaleTimeString()}] ${msg.toUpperCase()}`]
  })),

  incrementStat: (key) => set((state) => ({
    stats: { ...state.stats, [key]: state.stats[key] + 1 }
  })),

  setSystemInitialized: (val) => set({ systemInitialized: val }),
}))
