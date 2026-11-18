import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { View } from '../types'

// 시제품: 미리 넣어 둔 견본 장면을 채팅 옆 패널과 입력창 위 띠에 그린다.
// /trpg-demo 를 칠 때마다 다음 장면으로 넘어간다(실제 판에서는 게임 엔진의 저장 파일을 읽게 된다).
const PANE = 'trpg-panel'
const WHO = '아란 — 인간 파이터 1레벨'
const ITEMS = '사슬 갑옷 1, 대검 1, 도리깨 1, 투창 8, 창 1, 단궁 1, 횃불 10, 밧줄 1'
const BASE = { ok: true, date: '새 땅 봄 1일째 · 아침 6시쯤', who: WHO, hpMax: 12, ac: 17, money: '드레이크 18', rations: 10, items: ITEMS }
const SCENES: View[] = [
  { ...BASE, hp: 6, xp: '0 / 300', resources: '재기 2 · 영웅의 기운', round: 1, turn: '행동 남음 · 추가 행동 남음 · 이동 10걸음',
    enemies: [{ label: '털이꾼 2', hp: 11, max: 11, gap: '맞붙음', state: '' }, { label: '털이꾼 1', hp: 11, max: 11, gap: '맞붙음', state: '' }] },
  { ...BASE, hp: 11, xp: '0 / 300', resources: '재기 1 · 영웅의 기운', round: 1, turn: '행동 씀 · 추가 행동 씀 · 이동 10걸음',
    enemies: [{ label: '털이꾼 2', hp: 11, max: 11, gap: '맞붙음', state: '' }, { label: '털이꾼 1', hp: 0, max: 11, gap: '', state: '죽음' }] },
  { ...BASE, hp: 11, xp: '0 / 300', resources: '재기 1 · 영웅의 기운', round: 2, turn: '행동 남음 · 추가 행동 남음 · 이동 10걸음',
    enemies: [{ label: '털이꾼 2', hp: 11, max: 11, gap: '맞붙음', state: '' }, { label: '털이꾼 1', hp: 0, max: 11, gap: '', state: '죽음' }] },
  { ...BASE, hp: 11, xp: '50 / 300', resources: '재기 1 · 영웅의 기운', round: 0, turn: '', enemies: [] },
]
const NOTES = ['전투가 열렸다', '재기로 숨을 고르고 털이꾼 1을 벴다', '털이꾼 2의 칼이 빗나갔다', '털이꾼 2를 베고 이겼다 — 경험치 +50']

const step = atom({ plugin: 'trpg-panel', key: 'step' } as const, 0)
// 게임 폴더에서만 켠다: 작업 폴더에 이 파일이 있을 때만 패널과 띠를 보인다.
const MARKER = 'trpg-game.json'
const isOn = atom({ plugin: 'trpg-panel', key: 'isOn' } as const, false)

async function isGameFolder($: EngineInterface): Promise<boolean> {
  try {
    await $.fs.read(MARKER)

    return true
  } catch {
    return false
  }
}

function bar(now: number, max: number, width: number): string {
  const filled = max > 0 ? Math.round((Math.max(0, now) / max) * width) : 0
  return '█'.repeat(filled) + '░'.repeat(Math.max(0, width - filled))
}

async function scene($: EngineInterface): Promise<View> {
  const k = await read($, step)
  return SCENES[((k % SCENES.length) + SCENES.length) % SCENES.length] as View
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const on = await isGameFolder($)
    await update($, isOn, () => on)
    if (!on) {
      return next(e)  // 게임 폴더가 아니면 아무것도 보이지 않는다
    }
    await $.command.register({ name: 'trpg-panel', description: '게임 상태판을 연다' })
    await $.command.register({ name: 'trpg-demo', description: '견본 장면을 다음으로 넘긴다' })
    const opened = await $.ui.open({ id: PANE, title: '새 땅' })
    $.ui.status(opened.isPlaced ? '새 땅 패널 열림' : '새 땅: 이 화면에는 패널 자리가 없음')

    return next(e)
  })

  on('command.run', { command: 'trpg-panel' }, async $ => {
    const opened = await $.ui.open({ id: PANE, title: '새 땅' })

    return { text: opened.isPlaced ? '게임 상태판을 열었습니다.' : '이 화면에는 패널을 놓을 자리가 없습니다. 입력창 위의 띠로 대신 보입니다.' }
  })

  on('command.run', { command: 'trpg-demo' }, async $ => {
    await update($, step, k => (k + 1) % SCENES.length)
    const k = await read($, step)

    return { text: '장면 ' + (k + 1) + '/' + SCENES.length + ': ' + NOTES[k] }
  })

  // 패널 자리가 없는 화면에서도 보이도록 입력창 위에 한 줄 띠를 그린다.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || !(await read($, isOn))) {
      return next(e)
    }
    const v = await scene($)
    const { Box, Text } = $.ui.resolve(e)
    const fight = v.round > 0
      ? '  ⚔ ' + v.round + '라운드 · ' + v.enemies.map(en => en.label + (en.state !== '' ? '(' + en.state + ')' : ' ' + en.hp + '/' + en.max)).join(', ')
      : ''

    return (
      <Box>
        <Text>{v.who + '  체력 ' + v.hp + '/' + v.hpMax + ' ' + bar(v.hp, v.hpMax, 8) + '  돈 ' + v.money + '  양식 ' + v.rations + fight}</Text>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const v = await scene($)

    return (
      <Box flexDirection="column">
        <Text dimColor>{v.date}</Text>
        <Text weight="bold">{v.who}</Text>
        <Text>{'체력 ' + v.hp + ' / ' + v.hpMax + '  ' + bar(v.hp, v.hpMax, 12)}</Text>
        <Text>{'방어도 ' + v.ac + ' · 경험치 ' + v.xp}</Text>
        <Text>{v.resources}</Text>
        <Text> </Text>
        <Text>{'돈  ' + v.money}</Text>
        <Text>{'양식  ' + v.rations + '일치'}</Text>
        <Text dimColor>{v.items}</Text>
        {v.round > 0 && <Text> </Text>}
        {v.round > 0 && <Text weight="bold">{'전투 ' + v.round + '라운드'}</Text>}
        {v.round > 0 && <Text dimColor>{v.turn}</Text>}
        {v.enemies.map(en => (
          <Text dimColor={en.state !== ''}>
            {en.state !== ''
              ? en.label + ' — ' + en.state
              : en.label + '  ' + en.hp + '/' + en.max + ' ' + bar(en.hp, en.max, 8) + '  ' + en.gap}
          </Text>
        ))}
        <Text> </Text>
        <Text dimColor>/trpg-demo 로 다음 장면</Text>
      </Box>
    )
  })
}
