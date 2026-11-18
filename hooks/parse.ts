import type { Group, Progress } from '../types'

const ITEM = /^\s*- \[([ x~])\]\s*(?:\[[^\]]*\]\s*)?(.*)$/
const SCENARIO = /^###\s+\[([ x~])\]\s*(.*)$/
const SECTION = /^##\s+(.*)$/
const PARKED = /保留 D\d+/
const DECISION = /^## (D\d+ .*)$/

const short = (text = '') => (text.split(' — ')[0] ?? '').trim()

export type Parsed = Omit<Progress, 'changes' | 'commits' | 'lastDone'>

export function parseList(branch: string, list: string, decisions: string): Parsed {
  const groups: Group[] = []
  let group: Group | undefined
  let done = 0
  let total = 0
  let parked = 0
  let current: string | undefined
  let currentDetail: string | undefined
  let scenario: string | undefined
  const finished: string[] = []

  for (const line of list.split('\n')) {
    const heading = SCENARIO.exec(line)
    const section = heading ? undefined : SECTION.exec(line)
    if (heading || section) {
      group = heading
        ? { title: short(heading[2]), mark: heading[1], done: 0, total: 0 }
        : { title: short(section![1]), done: 0, total: 0 }
      groups.push(group)
      if (heading?.[1] === '~') scenario = group.title
      continue
    }
    const item = ITEM.exec(line)
    if (!item) continue
    total += 1
    if (group) group.total += 1
    if (item[1] === 'x') {
      done += 1
      finished.push(short(item[2]))
      if (group) group.done += 1
    }
    if (PARKED.test(line)) parked += 1
    if (item[1] === '~' && current === undefined) {
      current = short(item[2])
      currentDetail = (item[2] ?? '').split(' — ').slice(1).join(' — ') || undefined
    }
  }

  const logged = decisions.split('\n').flatMap(line => DECISION.exec(line)?.[1] ?? [])

  return {
    branch,
    done,
    total,
    parked,
    groups: groups.filter(one => one.total > 0 || one.mark !== undefined),
    current,
    currentDetail,
    scenario,
    decisions: logged.length,
    lastDecision: logged.at(-1),
    finished,
  }
}
