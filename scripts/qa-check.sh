#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[QA] Running baseline checks..."

if [[ -f api/blog.js ]]; then
  node --check api/blog.js
  echo "[QA] api/blog.js syntax: OK"
fi

if [[ -f index.html ]]; then
  grep -q "<main id=\"content\">" index.html
  echo "[QA] index.html main content marker: OK"
fi

if [[ -f admin/index.html ]]; then
  grep -q "媒体管理" admin/index.html
  echo "[QA] admin/index.html media section marker: OK"
fi

echo "[QA] Baseline checks passed."
