# Installing best-practices-research on OMP

## Quick Install

```bash
# 1. Clone or download the skill
cd ~/.omp/agent/managed-skills/
git clone https://github.com/raz123/best-practices-research-benchmark.git best-practices-research

# 2. Enable in config
# Edit ~/.omp/agent/config.yml and add:
```

```yaml
bestPractices:
  enabled: true
```

```bash
# 3. Verify
cat ~/.omp/agent/config.yml | grep bestPractices
# Should show: bestPractices: enabled: true
```

## Manual Install

If you prefer not to clone the full repo:

```bash
# 1. Create the skill directory
mkdir -p ~/.omp/agent/managed-skills/best-practices-research/

# 2. Download SKILL.md
curl -o ~/.omp/agent/managed-skills/best-practices-research/SKILL.md \
  https://raw.githubusercontent.com/raz123/best-practices-research-benchmark/main/skill/SKILL.md

# 3. Enable in config
# Add to ~/.omp/agent/config.yml:
```

```yaml
bestPractices:
  enabled: true
```

## Verify Installation

After enabling, OMP will automatically:
1. Check `bestPractices.enabled` before delegating non-trivial tasks
2. Run a research subagent (~21 seconds)
3. Write findings to `.planning/best-practices/`
4. Pass research context to the implementation agent

## Disable

```yaml
# In ~/.omp/agent/config.yml:
bestPractices:
  enabled: false
```

Or simply delete the managed skill directory:
```bash
rm -rf ~/.omp/agent/managed-skills/best-practices-research/
```

## What Gets Created

After the first research task runs:
```
.planning/best-practices/
├── {task-slug}-{date}.md    # Research findings (one per task)
└── benchmark.jsonl           # All research events with timing
```

## Customization

The skill can be customized by editing `~/.omp/agent/managed-skills/best-practices-research/SKILL.md`:

- **Research depth**: Change "Max length: 80 lines" to allow deeper research
- **Research scope**: Add/remove items from the 6-point research checklist
- **Skip conditions**: Modify "When to Skip" to change auto-skip behavior
- **Output format**: Change from markdown bullets to any format you prefer
