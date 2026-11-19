import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Panel } from '../types'

// 「새 땅」 상태판: 게임 엔진이 저장 파일 곁에 쓰는 panel.json을 읽어 채팅 옆 패널과 입력창 위 띠에 그린다.
// 게임 폴더(작업 폴더에 trpg-game.json이 있는 곳)에서만 켜진다. 엔진을 부르는 Bash 명령이 끝날 때마다 다시 읽는다.
const PANE = 'trpg-panel'
const MARKER = 'trpg-game.json'
const DEFAULT_SAVE = '.newland/save.json'

const panel = atom({ plugin: 'trpg-panel', key: 'panel' } as const, null as Panel | null)
const isOn = atom({ plugin: 'trpg-panel', key: 'isOn' } as const, false)

async function savePath($: EngineInterface): Promise<string | null> {
  try {
    const cfg = JSON.parse(await $.fs.read(MARKER)) as { save?: string }

    return typeof cfg.save === 'string' && cfg.save !== '' ? cfg.save : DEFAULT_SAVE
  } catch {
    return null
  }
}

function panelPath(save: string): string {
  const i = Math.max(save.lastIndexOf('/'), save.lastIndexOf('\\'))

  return (i >= 0 ? save.slice(0, i + 1) : '') + 'panel.json'
}

async function refresh($: EngineInterface): Promise<void> {
  const save = await savePath($)
  if (save === null) {
    return
  }
  try {
    const p = JSON.parse(await $.fs.read(panelPath(save))) as Panel
    await update($, panel, () => p)
  } catch {
    // 아직 게임이 없다(새 게임을 만들기 전)
  }
}

function bar(now: number, max: number, width: number): string {
  const filled = max > 0 ? Math.round((Math.max(0, now) / max) * width) : 0

  return '█'.repeat(filled) + '░'.repeat(Math.max(0, width - filled))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const active = (await savePath($)) !== null
    await update($, isOn, () => active)
    if (!active) {
      return next(e) // 게임 폴더가 아니면 아무것도 보이지 않는다
    }
    await refresh($)
    await $.command.register({ name: 'trpg-panel', description: '「새 땅」 상태판을 연다' })
    const opened = await $.ui.open({ id: PANE, title: '새 땅' })
    $.ui.status(opened.isPlaced ? '새 땅 패널 열림' : '새 땅: 이 화면에는 패널 자리가 없음')

    return next(e)
  })

  // 엔진을 부르는 명령(그 밖의 Bash도)이 끝나면 상태판을 다시 읽는다.
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const r = await next(e)
    if (await read($, isOn)) {
      await refresh($)
    }

    return r
  })

  on('command.run', { command: 'trpg-panel' }, async $ => {
    await refresh($)
    const opened = await $.ui.open({ id: PANE, title: '새 땅' })

    return { text: opened.isPlaced ? '상태판을 열었습니다.' : '이 화면에는 패널을 놓을 자리가 없습니다. 입력창 위의 띠로 대신 보입니다.' }
  })

  // 패널 자리가 없는 화면(모바일 등)에서도 보이도록 입력창 위에 한 줄 띠를 그린다.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const p = await read($, panel)
    if (e.props.hasSurvey || !(await read($, isOn)) || p === null) {
      return next(e)
    }
    const { Box, Text } = $.ui.resolve(e)
    const fight = p.combat !== '' ? '  ⚔ 싸움 중' : ''

    return (
      <Box>
        <Text>{p.name + ' ' + p.level + '레벨  체력 ' + p.hp + '/' + p.hp_max + ' ' + bar(p.hp, p.hp_max, 8) + '  방어도 ' + p.ac + '  ' + p.where + fight}</Text>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const p = await read($, panel)
    if (p === null) {
      return (
        <Box flexDirection="column">
          <Text dimColor>아직 게임이 없습니다. /newland 로 시작하세요.</Text>
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        <Text weight="bold">{p.name + ' — ' + p.level + '레벨'}</Text>
        <Text>{'체력 ' + p.hp + ' / ' + p.hp_max + '  ' + bar(p.hp, p.hp_max, 12) + '  방어도 ' + p.ac}</Text>
        <Text dimColor>{p.where}</Text>
        <Text> </Text>
        {p.combat !== '' && <Text weight="bold">싸움</Text>}
        {p.combat !== '' && <Text>{p.combat}</Text>}
        {p.combat !== '' && <Text> </Text>}
        <Text>{p.status}</Text>
        {p.party.length > 0 && <Text> </Text>}
        {p.party.map(line => (
          <Text dimColor>{line}</Text>
        ))}
      </Box>
    )
  })
}
