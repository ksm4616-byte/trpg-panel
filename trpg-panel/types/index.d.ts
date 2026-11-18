export type Enemy = { label: string; hp: number; max: number; gap: string; state: string }
export type View = {
  ok: boolean
  date: string
  who: string
  hp: number
  hpMax: number
  ac: number
  xp: string
  resources: string
  money: string
  rations: number
  items: string
  round: number
  turn: string
  enemies: Enemy[]
}

declare module 'claude-code' {
  interface PluginState {
    'trpg-panel': { step: number }
  }
}
