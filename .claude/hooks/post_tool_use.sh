#!/usr/bin/env bash
set -euo pipefail

# Basic command log for traceability.
mkdir -p .claude/logs
printf '%s | %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "${1:-unknown}" >> .claude/logs/tool-usage.log

exit 0
