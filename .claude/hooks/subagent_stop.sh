#!/usr/bin/env bash
set -euo pipefail

# Enforce structured handoff stub.
mkdir -p .claude/logs
cat <<'TXT' >> .claude/logs/subagent-stop.log
---
Subagent stopped. Ensure output includes:
- Findings
- Changed files
- Risks
- Next action
TXT

exit 0
