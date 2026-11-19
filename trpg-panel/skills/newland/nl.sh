#!/usr/bin/env bash
# 「새 땅」 엔진을 부르는 짧은 창구. 게임 폴더(trpg-game.json이 있는 곳)에서:
#   bash <이 파일> <명령> [값…]      예) bash nl.sh call travel '{"to":"검댕목"}'
# 값은 글 그대로, @파일, 또는 - (표준 입력). 결과만 찍는다.
CFG="trpg-game.json"
if [ ! -f "$CFG" ]; then echo '{"error":true,"result":"trpg-game.json이 없다 — 게임 폴더에서 부르거나 먼저 만든다"}'; exit 2; fi
ENGINE=$(sed -n 's/.*"engine"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$CFG" | head -1)
SAVE=$(sed -n 's/.*"save"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$CFG" | head -1)
[ -z "$SAVE" ] && SAVE=".newland/save.json"
mkdir -p .newland
rm -f .newland/out.txt
"$ENGINE" --headless -- --cli "$SAVE" "$@" --plugin --out .newland/out.txt >/dev/null 2>&1
if [ -f .newland/out.txt ]; then cat .newland/out.txt; else echo '{"error":true,"result":"엔진이 답하지 않았다 — trpg-game.json의 engine 경로를 확인한다"}'; fi
