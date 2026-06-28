# Contributing to Best Practices Research Benchmark

Thanks for your interest in contributing!

## How to Add a New Benchmark Task

1. **Fork this repo**
2. **Add your task** to `data/tasks.json` with this format:
   ```json
   {
     "id": "your-task-id",
     "type": "feature|fixer|refactor|integration|testing|architecture",
     "familiarity": "high|low",
     "description": "Clear, specific task description",
     "tech": "Tech stack comma-separated",
     "output_dir": "your-output-dir"
   }
   ```
3. **Run the benchmark** for your task (both conditions)
4. **Add your results** to `data/scores.jsonl`
5. **Submit a PR** with your task definition and results

## Scoring Guidelines

Use the 6-dimension rubric in `docs/RUBRIC.md`:
- Anti-Pattern Avoidance (20%)
- Best Practice Adherence (20%)
- Completeness (20%)
- Error Handling (15%)
- Security (10%)
- Code Quality (15%)

Score each dimension 0-5 (half-point increments allowed).

## Code of Conduct

Be respectful, constructive, and focused on improving AI-generated code quality.
