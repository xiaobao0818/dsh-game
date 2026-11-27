#!/usr/bin/env bash
# Cocos Creator 3.8 Web Mobile 构建（macOS）。
# 首次导入资源/构建引擎较慢；Cocos CLI 偶发以非 0 退出，重试并按产物判定成功。
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COCOS="${COCOS_CREATOR:-/Applications/CocosCreator.app/Contents/MacOS/CocosCreator}"
BUILD="$ROOT/build"
if [ ! -x "$COCOS" ]; then
  echo "找不到 Cocos Creator：$COCOS（可用 COCOS_CREATOR 环境变量指定）" >&2
  exit 2
fi
for i in 1 2 3; do
  echo "== Cocos build pass $i =="
  env -u ELECTRON_RUN_AS_NODE "$COCOS" --project "$ROOT" \
    --build "platform=web-mobile;debug=true;buildPath=$BUILD" --nologin || true
  if [ -f "$BUILD/web-mobile/index.html" ]; then
    echo "== build ok: $BUILD/web-mobile =="
    exit 0
  fi
  sleep 1
done
echo "build failed: 见 $ROOT/temp/builder/log" >&2
exit 1
