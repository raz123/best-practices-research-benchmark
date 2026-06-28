---
name: best-practices-research
description: Pre-delegation middleware that researches best practices before implementing non-trivial tasks. Writes findings to `.planning/best-practices/` and logs to `benchmark.jsonl`.
---

## Gate Check

Before doing ANYTHING, read `~/.omp/agent/config.yml`. If `bestPractices.enabled` is not `true`, **skip this entire workflow** and delegate directly. No exceptions.

## When to Use

Apply this skill when ALL of these hold:
- Task is non-trivial (unfamiliar tech, architectural choices, multi-file changes)
- The orchestrator is about to call `task()` to delegate implementation
- The task involves a domain where established patterns exist (frameworks, APIs, protocols, design patterns)

## When to Skip

Skip this skill when:
- Task is trivial (rename, small bugfix, config change)
- You already have high confidence in the approach (familiar territory, clear spec)
- User explicitly says "skip research" or "just do it"
- The task is exploratory/spike (no implementation yet)

## Workflow

### Step 1: Check Config
```bash
# Read config file, check bestPractices.enabled
# If not true, stop here — delegate directly
```

### Step 2: Identify Task Slug and Type

Generate a URL-safe slug from the task description:
- Lowercase, hyphens for spaces, ≤40 chars
- Examples: `sse-notification-system`, `auth-middleware-refactor`, `nextjs15-api-routes`

Classify task type: `feature`, `fixer`, `refactor`, `architecture`, `testing`, `integration`

### Step 3: Research via Subagent

Delegate a research task:
```
task(
  agent: "task",
  id: "BpResearch-{slug}",
  role: "Best practices researcher for {task type}",
  assignment: """
    Research best practices for: {task description}
    
    Task type: {type}
    Tech stack: {inferred from context}
    
    Research scope:
    1. Official documentation patterns for this domain
    2. Common anti-patterns to avoid
    3. Performance considerations
    4. Error handling patterns
    5. Testing strategies relevant to this task
    6. Security considerations if applicable
    
    Write findings to: .planning/best-practices/{slug}-{YYYYMMDD}.md
    Format: concise bullet points, no fluff, actionable items only.
    Max length: 80 lines. If it needs more, you're researching too much.
    
    After writing, log to .planning/best-practices/benchmark.jsonl:
    {json with timestamp, taskType, taskDescription, researchFile, researchDurationMs, hadResearch: true}
  """
)
```

### Step 4: Capture Research Path

The research agent returns the file path. Store it as `{research_path}`.

### Step 5: Delegate Implementation

Pass the research file to the implementation agent:
```
task(
  agent: "task",
  id: "Impl-{slug}",
  role: "Implementation: {task type}",
  assignment: """
    {original task description and requirements}
    
    BEST PRACTICES: Read {research_path} before implementing.
    Follow the patterns and avoid the anti-patterns documented there.
    
    {rest of original assignment}
  """
)
```

### Step 6: Log Success

After the implementation agent completes, append to benchmark.jsonl:
```json
{"timestamp": "{ISO8601}", "taskType": "{type}", "taskDescription": "{desc}", "researchFile": "{path}", "researchDurationMs": {ms}, "totalDurationMs": {ms}, "hadResearch": true, "success": true}
```

If research was skipped (gate check or trivial task), still log:
```json
{"timestamp": "{ISO8601}", "taskType": "{type}", "taskDescription": "{desc}", "researchFile": null, "researchDurationMs": 0, "totalDurationMs": {ms}, "hadResearch": false, "success": true}
```

## Benchmark Log Format

File: `.planning/best-practices/benchmark.jsonl`

Each line is one JSON object:
| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | string | ISO 8601 |
| `taskType` | string | `feature`, `fixer`, `refactor`, `architecture`, `testing`, `integration` |
| `taskDescription` | string | Short task summary |
| `researchFile` | string\|null | Path to research file, null if skipped |
| `researchDurationMs` | number | How long research took, 0 if skipped |
| `totalDurationMs` | number | Total time from delegation start to completion (includes research if any) |
| `hadResearch` | boolean | Whether research was performed |
| `success` | boolean | Whether the implementation succeeded |

## Example Flow

```
User: "Build a real-time notification system using SSE in Next.js 15"

Orchestrator:
  1. Checks config: bestPractices.enabled = true ✓
  2. Identifies: non-trivial, unfamiliar SSE patterns in Next.js 15
  3. Slug: sse-notification-nextjs15
  4. Delegates research → writes .planning/best-practices/sse-notification-nextjs15-20260628.md
  5. Delegates implementation with research reference
  6. Logs benchmark entry
```

## Directory Structure

```
.planning/best-practices/
├── {slug}-{YYYYMMDD}.md      # Research findings
└── benchmark.jsonl            # All research events
```

Create `.planning/best-practices/` if it doesn't exist.
