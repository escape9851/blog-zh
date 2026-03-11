#!/usr/bin/env bash
set -euo pipefail

# Soft guardrail: block obvious destructive commands unless explicitly intended.
if [[ "${1:-}" =~ (git\ reset\ --hard|rm\ -rf\ /|mkfs|dd\ if=) ]]; then
  echo "[HOOK BLOCK] Potentially destructive command detected: $1" >&2
  exit 2
fi

exit 0
