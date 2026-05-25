# Agent Orchestrator

Forked from [ComposioHQ/agent-orchestrator](https://github.com/ComposioHQ/agent-orchestrator).
This fork is diverging significantly — expect breaking changes from upstream.

Spawn parallel AI coding agents, each in its own git worktree. Agents
autonomously fix CI failures, address review comments, and open PRs.

## Prerequisites

- Node.js 20.18.3+
- Git 2.25+
- gh CLI
- tmux (macOS/Linux) or PowerShell 7+ (Windows)

## Quick Start

```bash
pnpm install && pnpm build
pnpm dev
```

Opens the dashboard at http://localhost:3000.

```bash
pnpm test
```

Config lives at `~/.ao/agent-orchestrator.yaml`. Local issues are stored
under `~/.ao/issues/<project-dir>/`.

## License

MIT
