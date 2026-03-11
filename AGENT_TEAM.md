# Multi-Agent Team (Project Local)

This project uses a structured multi-agent workflow inspired by Claude Code subagent practices.

## Agents
- `.claude/agents/orchestrator.md`
- `.claude/agents/analyst.md`
- `.claude/agents/strategist.md`
- `.claude/agents/builder-frontend.md`
- `.claude/agents/builder-backend.md`
- `.claude/agents/reviewer.md`
- `.claude/agents/qa-release.md`

## Workflow
1. Analyst defines reproducible problem and acceptance criteria.
2. Strategist proposes options and selects one plan.
3. Builders implement scoped changes.
4. Reviewer performs severity-ranked findings review.
5. QA validates and gates deployment.
6. Orchestrator publishes final report.

## Local Quality Script
Run:

```bash
bash scripts/qa-check.sh
```

## Notes
- Hooks are configured in `.claude/settings.json`.
- Hook scripts are in `.claude/hooks/`.
- Templates for structured handoff are in `.claude/templates/`.
