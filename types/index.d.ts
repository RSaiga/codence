export type Group = { title: string; mark?: string; done: number; total: number }

export type Progress = {
  branch: string
  done: number
  total: number
  parked: number
  groups: Group[]
  current?: string
  currentDetail?: string
  scenario?: string
  decisions: number
  lastDecision?: string
  finished: string[]
  lastDone?: string
  changes: string[]
  commits: string[]
}

export type Activity = { id: string; label: string; isDone: boolean; isError: boolean }

declare module 'claude-code' {
  interface PluginState {
    codence: { progress: Shaped<Progress | null>; activity: Shaped<Activity[]> }
  }
}
