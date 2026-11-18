import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Activity, Progress } from '../types'
import { parseList } from './parse'

const PANE = 'codence-progress'
const EVERY_MS = 3000
const BAR = 10

const progress = atom({ plugin: 'codence', key: 'progress' } as const, null, {
  shape: 'progress-3',
})
const activity = atom({ plugin: 'codence', key: 'activity' } as const, [], {
  shape: 'activity-1',
})
const ACTIVITY = 8

const tail = (path: string, parts = 3) => path.split('/').slice(-parts).join('/')

function describe(e: Record<string, unknown>): string {
  const text = (key: string) => (typeof e[key] === 'string' ? (e[key] as string) : undefined)
  const tool = String(e.tool)
  const path = text('file_path') ?? text('notebook_path')
  if (path) return `${tool} ${tail(path)}`
  if (tool === 'Bash') return `Bash ${text('description') ?? text('command') ?? ''}`
  if (tool === 'Grep' || tool === 'Glob') return `${tool} ${text('pattern') ?? ''}`
  if (tool === 'Agent') return `Agent ${text('description') ?? ''}`
  if (tool === 'Skill') return `Skill ${text('skill') ?? ''}`

  return tool
}

async function lines($: EngineInterface, argv: string[], root: string): Promise<string[]> {
  const run = await $.process.run(argv, { cwd: root }).catch(() => undefined)
  if (!run || run.exitCode !== 0) return []

  return run.stdout.split('\n').filter(line => line.trim() !== '')
}

async function load($: EngineInterface): Promise<Progress | null> {
  const git = await $.process
    .run(['git', 'rev-parse', '--show-toplevel', '--abbrev-ref', 'HEAD'])
    .catch(() => undefined)
  if (!git || git.exitCode !== 0) return null
  const [root, branch] = git.stdout.trim().split('\n')
  if (!root || !branch || branch === 'HEAD') return null
  const name = branch.replaceAll('/', '-')
  const list = await $.fs.read(`${root}/.codence/lists/${name}.md`).catch(() => undefined)
  if (typeof list !== 'string') return null
  const decisions = await $.fs
    .read(`${root}/.codence/decisions/${name}.md`)
    .catch(() => '')

  const [changes, commits] = await Promise.all([
    lines($, ['git', 'status', '--short', '--untracked-files=all'], root),
    lines($, ['git', 'log', '--format=%h %s', '-3'], root),
  ])

  return {
    ...parseList(branch, list, typeof decisions === 'string' ? decisions : ''),
    changes,
    commits,
  }
}

const percent = (done: number, total: number) =>
  total === 0 ? 0 : Math.round((done / total) * 100)

function slots(now: Progress): { done: number; working: number; parked: number; rest: number } {
  const at = (count: number) => (now.total === 0 ? 0 : Math.round((count / now.total) * BAR))
  const done = at(now.done)
  const working = Math.min(BAR - done, now.current ? Math.max(1, at(now.done + 1) - done) : 0)
  const parked = Math.min(BAR - done - working, now.parked > 0 ? Math.max(1, at(now.parked)) : 0)

  return { done, working, parked, rest: BAR - done - working - parked }
}

let shown = ''
let opened = false
let seen: { branch: string; finished: Set<string> } | undefined

async function refresh($: EngineInterface) {
  const loaded = await load($)
  const before = await read($, progress)
  let now = loaded
  if (loaded) {
    const known = seen?.branch === loaded.branch ? seen.finished : undefined
    const fresh = known ? loaded.finished.filter(one => !known.has(one)) : []
    const lastDone =
      fresh.at(-1) ?? (before?.branch === loaded.branch ? before.lastDone : undefined)
    now = { ...loaded, lastDone }
    seen = { branch: loaded.branch, finished: new Set(loaded.finished) }
    for (const one of fresh) {
      $.ui.toast(`済み ${loaded.done}/${loaded.total}: ${one.slice(0, 60)}`)
    }
    if (fresh.length > 0 && loaded.done === loaded.total) {
      $.ui.toast(`codence: ${loaded.branch} のリストがすべて済みました`)
    }
  } else {
    seen = undefined
  }
  const text = JSON.stringify(now)
  if (text === shown) return
  shown = text
  await update($, progress, () => now)
  if (now && !opened) {
    opened = true
    void $.ui.open({ id: PANE, title: 'codence' })
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    $.ui.status(undefined)
    await $.command.register({
      name: 'codence-progress',
      description: 'Show how far the codence test list of this branch has got',
    })
    $.clock.every(EVERY_MS, () => void refresh($))
    await refresh($)

    return next(e)
  })

  on('command.run', { command: 'codence-progress' }, async $ => {
    await refresh($)
    await $.ui.open({ id: PANE, title: 'codence' })

    return { text: 'codence の進み具合のパネルを開きました。' }
  })

  on('tool.call', async ($, e, next) => {
    const id = e.tool_use_id ?? `${e.tool}-${await $.clock.now()}`
    const label = describe(e as unknown as Record<string, unknown>).slice(0, 80)
    await update($, activity, list =>
      [...list, { id, label, isDone: false, isError: false }].slice(-ACTIVITY),
    )
    const ran = await next(e)
    const isError = 'deny' in ran || ('isError' in ran && ran.isError === true)
    await update($, activity, list =>
      list.map(one => (one.id === id ? { ...one, isDone: true, isError } : one)),
    )
    if (e.tool === 'Edit' || e.tool === 'Write') await refresh($)

    return ran
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const now = await read($, progress)
    if (!now || e.props.hasSurvey) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const bar = slots(now)
    const left = now.total - now.done

    return (
      <Box>
        <Text dimColor>codence </Text>
        <Text color="success">{'▰'.repeat(bar.done)}</Text>
        <Text color="warning">{'▰'.repeat(bar.working)}</Text>
        <Text color="error">{'▰'.repeat(bar.parked)}</Text>
        <Text dimColor>{'▱'.repeat(bar.rest)}</Text>
        <Text color={left === 0 ? 'success' : undefined}>
          {' '}
          {now.done}/{now.total} {percent(now.done, now.total)}%
        </Text>
        {now.current && (
          <Text color="warning" wrap="truncate-end">
            {' · ▶ '}
            {now.current}
          </Text>
        )}
        {now.parked > 0 && <Text color="error"> · 保留 {now.parked}</Text>}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Progress: Bar } = $.ui.resolve(e)
    const now = await read($, progress)
    const recent = await read($, activity)
    if (!now) {
      return (
        <Box flexDirection="column">
          <Text dimColor>このブランチの codence のリストはありません。</Text>
        </Box>
      )
    }
    const left = now.total - now.done

    return (
      <Box flexDirection="column">
        <Text bold wrap="truncate-end">
          {now.branch}
        </Text>
        <Bar
          label={left === 0 ? 'すべて済み' : `残り ${left}`}
          value={now.done}
          max={Math.max(1, now.total)}
          valueText={`${now.done}/${now.total}（${percent(now.done, now.total)}%）`}
          color={left === 0 ? 'success' : 'claude'}
        />
        <Text> </Text>
        {now.groups.map(group =>
          group.total > 0 ? (
            <Bar
              label={`${group.mark === '~' ? '▶ ' : ''}${group.title}`}
              value={group.done}
              max={group.total}
              valueText={`${group.done}/${group.total}`}
              color={
                group.done === group.total ? 'success' : group.mark === '~' ? 'warning' : 'subtle'
              }
            />
          ) : (
            <Text wrap="truncate-end" dimColor={group.mark === 'x'}>
              {group.mark === 'x' ? '✔ ' : group.mark === '~' ? '▶ ' : '・ '}
              {group.title}
            </Text>
          ),
        )}
        <Text> </Text>
        {now.scenario && <Text wrap="wrap">シナリオ: {now.scenario}</Text>}
        <Text color={now.current ? 'warning' : undefined} wrap="wrap">
          ▶ 作業中: {now.current ?? 'なし'}
        </Text>
        {now.currentDetail && (
          <Text dimColor wrap="wrap">
            {'  '}
            {now.currentDetail}
          </Text>
        )}
        {now.lastDone && (
          <Text color="success" wrap="wrap">
            ✔ 直前に済んだ: {now.lastDone}
          </Text>
        )}
        {now.parked > 0 && <Text color="warning">保留 {now.parked} 件</Text>}
        {now.decisions > 0 && (
          <Text dimColor wrap="wrap">
            判断 {now.decisions} 件 · 最新: {now.lastDecision}
          </Text>
        )}
        <Text> </Text>
        <Text bold>最近の動き</Text>
        {recent.length === 0 && <Text dimColor>まだありません</Text>}
        {recent.map(one => (
          <Text
            wrap="truncate-end"
            dimColor={one.isDone && !one.isError}
            color={one.isError ? 'error' : one.isDone ? undefined : 'warning'}
          >
            {one.isError ? '✘ ' : one.isDone ? '✔ ' : '… '}
            {one.label}
          </Text>
        ))}
        <Text> </Text>
        <Text bold>コミットしていない変更 {now.changes.length} 件</Text>
        {now.changes.slice(0, 6).map(line => (
          <Text dimColor wrap="truncate-start">
            {line}
          </Text>
        ))}
        {now.changes.length > 6 && <Text dimColor>ほか {now.changes.length - 6} 件</Text>}
        <Text> </Text>
        <Text bold>最近のコミット</Text>
        {now.commits.map(line => (
          <Text dimColor wrap="truncate-end">
            {line}
          </Text>
        ))}
      </Box>
    )
  })
}
