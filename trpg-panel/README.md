# 새 땅 — Claude Code 플러그인판

Claude가 진행자(GM)가 되고, 규칙·주사위·전투·세계는 게임 실행 파일(NewLand.exe)이 계산하는 1인 다크 판타지 TRPG입니다.
채팅 옆에는 「새 땅」 상태판이 뜹니다.

## 설치

1. 게임 실행 파일(NewLand.exe — 따로 받습니다)을 아무 폴더에 풀어 둡니다.
2. Claude Code에서:
   ```
   /plugin install trpg-panel --marketplace ksm4616-byte/trpg-panel
   ```
3. 게임용 폴더를 하나 만들고 그 폴더에서 Claude Code를 엽니다. 그 폴더에 `trpg-game.json`을 둡니다
   (없으면 처음 `/newland`를 칠 때 Claude가 물어보고 만들어 줍니다):
   ```json
   { "engine": "C:/Games/NewLand/NewLand.exe", "save": ".newland/save.json" }
   ```

## 하는 법

- `/newland` — 게임을 시작하거나 이어 합니다. 저장이 없으면 캐릭터 만들기부터 합니다.
- 평소에는 하고 싶은 말이나 행동을 그대로 치면 됩니다.
- `[GM]`으로 시작하거나 통째로 괄호 `( … )`에 넣은 말은 진행자에게 묻는 말입니다(장면이 진행되지 않습니다).
- `/trpg-panel` — 닫힌 상태판을 다시 엽니다.

상태판은 `trpg-game.json`이 있는 폴더에서만 켜집니다. 패널 자리는 Claude Code를 여는 화면에 따라 다르고,
자리가 없는 화면에서는 입력창 위의 한 줄 띠로 보입니다.
