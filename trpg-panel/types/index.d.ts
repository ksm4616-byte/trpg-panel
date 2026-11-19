// 엔진(ai/cli.gd)이 저장 파일 곁에 쓰는 panel.json 모양.
export type Panel = {
  name: string
  hp: number
  hp_max: number
  ac: number
  level: number
  where: string
  status: string
  combat: string
  party: string[]
}

declare module 'claude-code' {
  interface PluginState {
    'trpg-panel': { panel: Panel | null; isOn: boolean }
  }
}
