import Store from 'electron-store'
import { app } from 'electron'
import path from 'node:path'
import { DEFAULT_SETTINGS } from '@shared/constants'
import type { AppSettings, StatsRecord } from '@shared/types'

const store = new Store<AppSettings>({
  name: 'settings',
  defaults: {
    ...DEFAULT_SETTINGS,
    outputDir: path.join(app.getPath('pictures'), 'ImageSqueezer_Export'),
    statsHistory: []
  }
})

export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  return store.get(key)
}

export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  store.set(key, value)
}

export function getAllSettings(): AppSettings {
  return store.store
}

export function getStats(): StatsRecord[] {
  return (store.get('statsHistory') as StatsRecord[] | undefined) ?? []
}

export function addStats(record: StatsRecord): void {
  const history = getStats()
  history.unshift(record)
  if (history.length > 100) history.length = 100
  store.set('statsHistory', history)
}
