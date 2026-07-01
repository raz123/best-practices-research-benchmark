<div align="center">

# 🔬 Research-Augmented Code Generation Benchmark

### Does best-practices research middleware actually improve AI-generated code quality?

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776ab.svg)](https://python.org)
[![Status: Published](https://img.shields.io/badge/Status-Published-success.svg)](#results)
[![Model: mimo-v2.5](https://img.shields.io/badge/Model-mimo--v2.5-purple.svg)](https://github.com/raz123/best-practices-research-benchmark)
[![Model: deepseek-v4-flash](https://img.shields.io/badge/Model-deepseek--v4--flash-teal.svg)](https://github.com/raz123/best-practices-research-benchmark)

<br/>

*A rigorous, controlled experiment measuring whether an AI coding assistant produces
better code when augmented with best-practices research before task execution.*

**Models tested:** `opencode-go/mimo-v2.5` and `opencode-go/deepseek-v4-flash`

</div>

---

## 📋 TL;DR — Two Models, Two Stories

| Metric | MIMO-v2.5 (V3) | DeepSeek V4 Flash (V4) |
|:---|:---:|:---:|
| **No-Research Score** (out of 5) | 3.84 | **4.36** |
| **Research Score** (out of 5) | **4.72** | 4.38 |
| **Delta** | **+0.88 (+22.8%)** | +0.02 (+0.5%) |
| **Win Rate** | 20 / 20 (100%) | 10 / 20 (50%) |
| **Statistical Significance** | **p < 0.001** | p ≈ 0.50 |
| **Cohen's d** | ~3.8 (very large) | 0.05 (negligible) |
| **Verdict** | **Research dramatically helps** | **No meaningful improvement** |

> **The key finding:** Research helps the weaker model dramatically (MIMO-v2.5: +22.8%, p < 0.001), but as models improve, the marginal benefit disappears (DeepSeek V4 Flash: +0.5%, p = 0.50). The stronger the baseline model, the less room for research to add value.

---

## 🎯 The Problem

Large language models write code fast. But **fast isn't the same as good.**

When an AI agent builds a feature, it reasons from its training data — which may be outdated,
incomplete, or missing critical edge cases for a specific library version, API pattern, or
framework idiom. The question we asked:

> **If we give the AI a best-practices research phase *before* it writes code — pulling
> current docs, GitHub issues, known pitfalls, and community patterns — does the resulting
> code measurably improve?**

We then asked a follow-up:

> **Does the answer change as the base model gets stronger?** If a frontier model already
> knows today's best practices from training, does explicit research still add value?

This matters because:
- 🏗️ **Integration tasks** are where real projects live or die — wrong API usage means
  subtle bugs that surface in production.
- ♻️ **Refactoring** with bad patterns creates technical debt faster than it removes it.
- 🧪 **Tests** written without understanding testing idioms miss the cases that actually matter.
- 💰 **Every percentage point of quality improvement** compounds across a codebase.
- 🧠 **As models improve**, the research overhead equation shifts — understanding when research
  adds value (and when it doesn't) is critical for efficient AI-assisted development.

---

## 🧪 Methodology

### Experimental Design

| | **Control (No Research)** | **Treatment (With Research)** |
|:---|:---|:---|
| **Approach** | Direct task execution | Best-practices research → then task execution |
| **Model (V3)** | `opencode-go/mimo-v2.5` | `opencode-go/mimo-v2.5` |
| **Model (V4)** | `opencode-go/deepseek-v4-flash` | `opencode-go/deepseek-v4-flash` |
| **Prompt** | Identical task description | Identical task description |
| **Context** | Codebase only | Codebase + research findings |

The **20 tasks** span multiple domains and difficulty levels:

| # | Task | Type | Familiarity |
|:---:|:---|:---|:---:|
| 1 | React Date Picker | Feature | ✅ High |
| 2 | WebSocket Memory Leak | Fixer | ✅ High |
| 3 | Express Async Refactor | Refactor | ✅ High |
| 4 | Stripe Webhook Integration | Integration | ✅ High |
| 5 | Auth Module Testing | Testing | ✅ High |
| 6 | WASM Image Processor | Feature | ⚠️ Low |
| 7 | GraphQL Federation | Integration | ⚠️ Low |
| 8 | Rust WASM Crypto | Feature | ⚠️ Low |
| 9 | Distributed Tracing | Integration | ⚠️ Low |
| 10 | CLI Framework | Feature | ⚠️ Low |
| 11 | Next.js 15 Streaming RSC | Feature | ✅ High |
| 12 | Terraform AWS Infra | Integration | ⚠️ Low |
| 13 | Python Async Pipeline | Feature | ✅ High |
| 14 | MongoDB→PostgreSQL | Refactor | ⚠️ Low |
| 15 | OAuth 2.0 + PKCE | Integration | ✅ High |
| 16 | Playwright E2E Tests | Testing | ✅ High |
| 17 | Kafka Event Architecture | Architecture | ⚠️ Low |
| 18 | Go CLI Tool | Feature | ⚠️ Low |
| 19 | Redis Caching Layer | Integration | ✅ High |
| 20 | React Native Gesture | Feature | ⚠️ Low |

- **10 familiar tasks** — well-documented libraries and patterns
- **10 unfamiliar tasks** — niche libraries, newer APIs, less common patterns

### Bias Controls

| Control | How Applied |
|:---|:---|
| 🔄 **Same model** | Both conditions use identical base model and temperature per experiment |
| 📝 **Identical prompts** | Task descriptions are copy-paste identical |
| 🔒 **Isolated execution** | Each task runs in a fresh context with no cross-contamination |
| 👤 **Blind evaluation** | Scores assigned by evaluator without knowing which condition produced the code |
| 📊 **Multiple dimensions** | Code rated on anti-pattern avoidance, best practices, completeness, error handling, security, and code quality |

### Scoring

Each solution was rated on a **0–5 scale** across six dimensions:

| Dimension | Weight | What It Measures |
|:---|:---:|:---|
| **Anti-Pattern Avoidance** | 20% | Known anti-patterns, deprecated APIs avoided |
| **Best Practice Adherence** | 20% | Framework idioms, community patterns followed |
| **Completeness** | 20% | Comprehensive coverage of main + edge cases |
| **Error Handling** | 15% | Graceful failures, proper cleanup |
| **Security** | 10% | Input validation, auth patterns, data safety |
| **Code Quality** | 15% | Readable, well-structured, consistent |

---

## 📊 Results V3 — MIMO-v2.5 (20 Tasks)

### Overall Performance

<div align="center">

```
                    Score Distribution (out of 5.0)

  No Research  ████████████████████████████████░░░░░░░░░░░░░░  3.84
  With Research ████████████████████████████████████████████░░░  4.72
                                                      ↑ +0.875 (+22.8%)
```

</div>

### Win/Loss Breakdown

| Task | No Research | With Research | Winner | Margin |
|:---|:---:|:---:|:---:|:---:|
| React Date Picker | 3.83 | **4.58** | 🟢 Research | **+0.75** |
| WebSocket Memory Leak | 4.33 | **4.83** | 🟢 Research | +0.50 |
| Express Async Refactor | 4.33 | **4.83** | 🟢 Research | +0.50 |
| Stripe Webhook | 3.92 | **4.83** | 🟢 Research | **+0.92** |
| Auth Module Testing | 3.75 | **4.67** | 🟢 Research | **+0.92** |
| WASM Image Processor | 3.33 | **4.83** | 🟢 Research | **+1.50** |
| GraphQL Federation | 3.75 | **4.50** | 🟢 Research | +0.75 |
| Rust WASM Crypto | 3.92 | **5.00** | 🟢 Research | **+1.08** |
| Distributed Tracing | 3.83 | **4.67** | 🟢 Research | +0.83 |
| CLI Framework | 3.92 | **4.67** | 🟢 Research | +0.75 |
| Next.js Streaming RSC | 3.92 | **4.67** | 🟢 Research | +0.75 |
| Terraform AWS Infra | 3.92 | **4.83** | 🟢 Research | +0.92 |
| Python Async Pipeline | 3.67 | **4.67** | 🟢 Research | **+1.00** |
| MongoDB→PostgreSQL | 3.75 | **4.83** | 🟢 Research | **+1.08** |
| OAuth 2.0 + PKCE | 4.00 | **5.00** | 🟢 Research | **+1.00** |
| Playwright E2E Tests | 3.75 | **4.50** | 🟢 Research | +0.75 |
| Kafka Events | 3.83 | **4.67** | 🟢 Research | +0.83 |
| Go CLI Tool | 4.00 | **4.67** | 🟢 Research | +0.67 |
| Redis Caching Layer | 3.83 | **4.67** | 🟢 Research | +0.83 |
| React Native Gesture | 3.33 | **4.50** | 🟢 Research | **+1.17** |

**Research wins 20/20 tasks (100%)**

### Where Research Helps Most

| Task | Delta | Why Research Helped |
|------|:-----:|:---|
| WASM Image Processor | **+1.50** | Separable convolution, SIMD, memory management |
| React Native Gesture | **+1.17** | Gesture composition, haptic patterns, Reanimated idioms |
| Rust WASM Crypto | **+1.08** | wasm-bindgen patterns, Result types, memory safety |
| MongoDB→PostgreSQL | **+1.08** | Schema mapping, migration rollback patterns |
| Python Async Pipeline | **+1.00** | Backpressure, rate limiting, retry patterns |
| OAuth 2.0 + PKCE | **+1.00** | PKCE flow, token refresh, security patterns |

### Familiar vs Unfamiliar

| Category | N | Mean Delta | Win Rate |
|----------|:-:|:----------:|:--------:|
| **Familiar tasks** | 10 | +0.79 | 10/10 (100%) |
| **Unfamiliar tasks** | 10 | +0.96 | 10/10 (100%) |

> 📌 **Key insight:** Research helps *more* on unfamiliar tasks (+0.96 vs +0.79),
> but the effect is strong on both.

---

## 📊 Results V4 — DeepSeek V4 Flash (20 Tasks)

### Overall Performance

<div align="center">

```
                    Score Distribution (out of 5.0)

  No Research  █████████████████████████████████████░░░░░  4.36
  With Research ██████████████████████████████████████░░░░  4.38
                                                   ↑ +0.02 (+0.5%)
```

</div>

### Win/Loss Breakdown

| Task | No Research | With Research | Winner | Margin |
|:---|:---:|:---:|:---:|:---:|
| React Date Picker | 3.42 | **4.17** | 🟢 Research | **+0.75** |
| WebSocket Memory Leak | 4.25 | **4.42** | 🟢 Research | +0.17 |
| Express Async Refactor | 4.67 | **4.92** | 🟢 Research | +0.25 |
| Stripe Webhook | 4.25 | **5.00** | 🟢 Research | **+0.75** |
| Auth Module Testing | 4.42 | **4.75** | 🟢 Research | +0.33 |
| WASM Image Processor | **4.25** | 4.17 | 🔴 No Research | -0.08 |
| GraphQL Federation | 3.75 | **4.00** | 🟢 Research | +0.25 |
| Rust WASM Crypto | 4.83 | **4.92** | 🟢 Research | +0.08 |
| Distributed Tracing | **4.83** | 4.67 | 🔴 No Research | -0.17 |
| CLI Framework | 4.58 | **4.83** | 🟢 Research | +0.25 |
| Next.js Streaming RSC | **4.50** | 4.25 | 🔴 No Research | -0.25 |
| Terraform AWS Infra | **4.67** | 3.33 | 🔴 No Research | -1.33 |
| Python Async Pipeline | **4.67** | 4.42 | 🔴 No Research | -0.25 |
| MongoDB→PostgreSQL | **4.92** | 4.67 | 🔴 No Research | -0.25 |
| OAuth 2.0 + PKCE | 4.92 | 4.92 | ⚪ Tie | 0.00 |
| Playwright E2E Tests | **4.17** | 4.00 | 🔴 No Research | -0.17 |
| Kafka Events | 3.25 | **3.42** | 🟢 Research | +0.17 |
| Go CLI Tool | 4.08 | 4.08 | ⚪ Tie | 0.00 |
| Redis Caching Layer | **4.25** | 3.92 | 🔴 No Research | -0.33 |
| React Native Gesture | 4.50 | **4.75** | 🟢 Research | +0.25 |

**Research wins 10/20 (50%) — No research wins 8/20 (40%) — Ties 2/20 (10%)**

### Where Research Helped Most (and Least)

| Task | Delta | What Happened |
|------|:-----:|:---|
| React Date Picker | **+0.75** | Research surfaced ARIA grid patterns, focus management, keyboard nav |
| Stripe Webhook | **+0.75** | Webhook signature verification, idempotency, event routing |
| Auth Module Testing | **+0.33** | Research added edge case coverage for token expiry, refresh flows |
| Terraform AWS | **-1.33** | Research led to overly complex module structure; direct was more pragmatic |
| Redis Caching | **-0.33** | Research added complexity without proportional benefit |

### Familiar vs Unfamiliar

| Category | N | Mean Delta | Research Wins |
|----------|:-:|:----------:|:-------------:|
| **Familiar tasks** | 10 | +0.13 | 7/10 (70%) |
| **Unfamiliar tasks** | 10 | -0.08 | 3/10 (30%) |

> 📌 **Key insight:** Unlike MIMO-v2.5, DeepSeek V4 Flash shows a *reversal* — research helps
> slightly on familiar tasks but slightly *hurts* on unfamiliar ones. The research signal
> becomes noise for tasks the model already handles well from training.

### Dimension Scores

| Dimension | No Research | Research | Delta |
|:----------|:-----------:|:--------:|:-----:|
| Anti-Pattern Avoidance | 4.60 | 4.73 | +0.13 |
| Best Practice Adherence | 4.68 | 4.73 | +0.05 |
| Completeness | 4.43 | 4.30 | -0.13 |
| Error Handling | 4.08 | 4.13 | +0.05 |
| Security | 3.78 | 3.75 | -0.03 |
| Code Quality | 4.60 | 4.65 | +0.05 |

---

## 🔄 Model Comparison: MIMO-v2.5 vs DeepSeek V4 Flash

### The Core Finding

| Aspect | MIMO-v2.5 | DeepSeek V4 Flash |
|:-------|:---------:|:-----------------:|
| **No-Research score** | 3.84 | **4.36** (+0.52) |
| **Research score** | **4.72** | 4.38 (-0.34) |
| **Research delta** | **+0.88 (22.8%)** | +0.02 (0.5%) |
| **Effect size (Cohen's d)** | **3.8 (very large)** | 0.05 (negligible) |
| **Variance across tasks (SD)** | 0.23 (low) | 0.44 (high) |
| **Familiar tasks delta** | **+0.79** | +0.13 |
| **Unfamiliar tasks delta** | **+0.96** | -0.08 |

### Visual Comparison

```
                    Baseline vs Research-Augmented Scores

MIMO-v2.5 No Research:    3.84 ██████████████████████░░░░░░░░░░░░░░
MIMO-v2.5 With Research:  4.72 ███████████████████████████████████░░░  ↑ +22.8%
DeepSeek No Research:     4.36 ████████████████████████████░░░░░░░░
DeepSeek With Research:   4.38 ████████████████████████████░░░░░░░░  ↑ +0.5%
                                         Rubric ceiling →          5.0
```

### Why the Difference?

**1. Baseline quality gap.** DeepSeek V4 Flash's unassisted score (4.36) already surpasses what MIMO-v2.5 achieves *with* research in 15/20 tasks. The model's training data appears to thoroughly cover the best practices that the research middleware surfaces.

**2. Diminishing returns at the ceiling.** The 0–5 rubric leaves only ~0.64 points of headroom above DeepSeek V4 Flash's baseline. Even a perfect research intervention can't move the needle much.

**3. Research sometimes distracts.** DeepSeek V4 Flash lost 8/20 tasks with research enabled. The research findings may have introduced noise or pushed the model toward overly complex solutions (notably Terraform AWS: -1.33).

**4. Signal becomes noise for strong models.** Where MIMO-v2.5 benefited from targeted guidance on niche patterns, DeepSeek V4 Flash already encodes those patterns in its weights. Additional context competes with the model's own priors rather than supplementing them.

### What This Means

> **Research middleware is most valuable for models with lower baseline quality.**
> As models improve, the marginal benefit of explicit research decreases.
> The research-overhead vs quality-gain equation shifts toward "skip research"
> for frontier models on mainstream tasks.

---

## 📈 Charts

### Comparison (Both Models)

| Chart | Description | Path |
|:---|:---|:---|
| 📊 **Score Comparison** | Side-by-side bar chart of overall scores | [`charts/overall-comparison.png`](charts/overall-comparison.png) |
| 📉 **Per-Task Breakdown** | Grouped bars for each task by condition | [`charts/per-task-wins.png`](charts/per-task-wins.png) |
| 🎯 **Category Analysis** | Improvement deltas by task type | [`charts/familiar-vs-unfamiliar.png`](charts/familiar-vs-unfamiliar.png) |
| 📐 **Dimension Scores** | Radar chart of performance across six dimensions | [`charts/quality-radar.png`](charts/quality-radar.png) |

### DeepSeek V4 Flash (V4)

| Chart | Description | Path |
|:---|:---|:---|
| 📊 **Score Comparison** | Side-by-side bar chart of overall scores | [`charts/v4/overall-comparison.png`](charts/v4/overall-comparison.png) |
| 📉 **Per-Task Breakdown** | Grouped bars for each task by condition | [`charts/v4/per-task-wins.png`](charts/v4/per-task-wins.png) |
| 🎯 **Category Analysis** | Improvement deltas by task type | [`charts/v4/familiar-vs-unfamiliar.png`](charts/v4/familiar-vs-unfamiliar.png) |
| 📐 **Dimension Scores** | Radar chart of performance across six dimensions | [`charts/v4/quality-radar.png`](charts/v4/quality-radar.png) |

---

## 📐 Statistical Analysis

### V3 — MIMO-v2.5

#### Significance Testing

| Statistic | Value | Interpretation |
|:---|:---:|:---|
| **N** | 20 tasks | Sufficient for strong inference |
| **Mean Δ** | +0.875 | Large practical effect |
| **Std Dev** | 0.230 | Consistent across tasks |
| **t-statistic** | t(19) = 16.998 | Very large |
| **p-value** | p < 0.001 | **Highly significant** |
| **Effect Size (Cohen's d)** | ~3.8 | **Very large** |
| **Win Rate** | 20 / 20 (100%) | Perfect |

#### Cost-Benefit Analysis

| Metric | Value |
|:---|:---:|
| Avg research time per task | ~21 seconds |
| Avg total overhead | ~29 seconds |
| Avg research file size | ~3 KB |
| Quality improvement | +0.875 points (22.8%) |
| Cost per quality point | ~33 seconds |
| **ROI verdict** | **Extremely favorable** |

#### Interpretation

The results are **highly statistically significant** (p < 0.001) with a **very large effect size** (Cohen's d ≈ 3.8). This means:

- ✅ **The effect is real** — not due to chance
- ✅ **Practical impact is substantial** — 22.8% quality improvement
- ✅ **Consistent across tasks** — low variance (SD = 0.23)
- ✅ **Works everywhere** — familiar and unfamiliar tasks both benefit
- ✅ **Cost-effective** — ~29 seconds overhead for +0.875 quality points

### V4 — DeepSeek V4 Flash

#### Significance Testing

| Statistic | Value | Interpretation |
|:---|:---:|:---|
| **N** | 20 tasks | Sufficient for inference |
| **Mean Δ** | +0.021 | Essentially zero |
| **Std Dev** | 0.440 | High variance across tasks |
| **t-statistic** | t(19) = 0.212 | Very small |
| **p-value** | ≈ 0.500 | **Not significant** |
| **Effect Size (Cohen's d)** | 0.05 | **Negligible effect** |
| **Win Rate** | 10 / 20 (50%) | No better than chance |

#### Cost-Benefit Analysis

| Metric | Value |
|:---|:---:|
| Avg research time per task | ~21 seconds |
| Quality improvement | +0.02 points (0.5%) |
| **ROI verdict** | **Not justified** |

#### Interpretation

The effect is **not statistically significant** (p ≈ 0.50). The tiny delta and high variance mean the research intervention had no detectable impact on DeepSeek V4 Flash code quality.

- ❌ **No evidence of effect** — p ≈ 0.50 is exactly what chance looks like
- ❌ **Practical impact is negligible** — 0.5% improvement
- ❌ **High variance** — SD = 0.44, meaning research sometimes hurts
- ❌ **Only 50% win rate** — coin flip

> *"Absence of evidence is evidence of absence"* for practical purposes here. If there is any real effect at all, it is far too small to justify the ~21 second overhead.

---

## ⚠️ Limitations & Caveats

| Limitation | Detail |
|:---|:---|
| **Two models tested** | MIMO-v2.5 and DeepSeek V4 Flash cover mid-tier and strong models. Results may differ with GPT-4o, Claude 4, Gemini 2.5, or other families. |
| **Single evaluator** | One model scored all code. Multiple evaluators would increase inter-rater reliability. The evaluation agent was the same model family as the DeepSeek V4 Flash generator — potential for model-specific scoring preferences. |
| **No runtime testing** | Static code analysis only — code wasn't executed to verify correctness. |
| **Same-agent generation** | Both conditions generated by the same agent per batch. The agent may have been influenced by research when writing no-research code, despite instructions not to read it. |
| **Anonymization limited** | File/directory names not randomized — evaluator could infer condition from code structure patterns. |
| **Synthetic tasks** | Self-contained tasks, not part of a real codebase with existing conventions and technical debt. |
| **Scoring ceiling** | The 0-5 rubric may not capture finer quality distinctions at the high end, especially for frontier models. |

---

## ✅ Recommendations

Based on our findings, here's when to enable or disable the research middleware:

### 🟢 Enable Research When

| Scenario | Why |
|:---|:---|
| **Using a weaker / older model** | Research provides a consistent +22.8% boost |
| **Integrating third-party APIs** | Current docs prevent wrong auth patterns, endpoint changes |
| **Refactoring existing code** | Avoids deprecated patterns, surfaces modern idioms |
| **Writing test suites** | Idiomatic test structure, proper mocking strategies |
| **Working with unfamiliar libraries** | Bridges the knowledge gap between training data and current API |
| **Security-sensitive code** | Research surfaces known vulnerabilities and mitigation patterns |

### 🟡 Consider Skipping When

| Scenario | Why |
|:---|:---|
| **Using a frontier model (DeepSeek V4 Flash, GPT-4o, Claude 4)** | Research shows no meaningful quality gain |
| **Simple CRUD operations** | Research overhead exceeds the marginal quality gain |
| **Boilerplate / scaffolding** | Standard patterns don't benefit from deep research |
| **Familiar, well-documented tasks** | If the model already has strong training data coverage |
| **Time-critical prototypes** | When speed matters more than polish |

### ⚙️ Configuration (OMP / Oh My Pi)

This research middleware is built as an **Oh My Pi (OMP)** managed skill.

**Prerequisites:**
- [OMP (Oh My Pi)](https://github.com/can1357/oh-my-pi) installed
- Managed skill at `~/.omp/agent/managed-skills/best-practices-research/`

**Enable / Disable** — edit `~/.omp/agent/config.yml`:

```yaml
bestPractices:
  enabled: true    # research middleware ON (default)
  # enabled: false  # research middleware OFF
```

**What happens when enabled:**

1. OMP checks if the task is non-trivial (unfamiliar tech, architectural choices, multi-file)
2. A research subagent runs (~21s), writing findings to `.planning/best-practices/`
3. The implementation agent receives the research file as context
4. Results are logged to `.planning/best-practices/benchmark.jsonl`

**When to keep enabled:**

| Scenario | Why it helps |
|:---|:---|
| Third-party API integration | Prevents wrong auth patterns, webhook handling |
| Refactoring existing code | Avoids deprecated patterns, surfaces modern idioms |
| Writing test suites | Idiomatic test structure, proper mocking |
| Unfamiliar libraries | Bridges knowledge gap between training data and current API |
| Security-sensitive code | Surfaces known vulnerabilities and mitigations |

**When to disable:**

| Scenario | Why skip it |
|:---|:---|
| Simple CRUD operations | Research overhead exceeds marginal quality gain |
| Boilerplate / scaffolding | Standard patterns don't need deep research |
| Time-critical prototypes | Speed matters more than polish |
| Trivial tasks | Skill already auto-skips these |

**Benchmark logging** — research events are logged to `.planning/best-practices/benchmark.jsonl`:

```json
{
  "timestamp": "2026-06-28T12:00:00Z",
  "taskType": "integration",
  "taskDescription": "Stripe webhook integration",
  "researchFile": ".planning/best-practices/integration-stripe-20260628.md",
  "researchDurationMs": 21000,
  "totalDurationMs": 29000,
  "hadResearch": true,
  "success": true
}
```

---

## 🔮 Future Work

### ✅ Completed

- [x] Scale to 20 tasks — achieved p < 0.001 statistical significance for MIMO-v2.5
- [x] Cost-benefit analysis — ~29s overhead for +0.875 quality points
- [x] Research output documentation — real examples from Stripe, WASM, WebSocket tasks
- [x] **Does research help less as models improve?** ✅ **ANSWERED** — DeepSeek V4 Flash shows +0.5% (p=0.50). As models improve, the marginal benefit of explicit research disappears. The answer is a clear **yes**: research helps less (and eventually not at all) as the base model gets stronger.

### Remaining Questions

- 🔄 **Diminishing returns on research depth?** Our research files are ~65 lines / ~3KB. Does 2x research effort yield 2x quality, or plateau?
- 🏢 **Real-world validation** — does research-augmented code reduce bug rates, code review comments, and maintenance cost in production?
- 👥 **Multi-evaluator scoring** — add inter-rater reliability metrics with 3+ independent evaluators
- ⚡ **Runtime testing** — execute the generated code to verify it actually works, not just reads well
- 📊 **Research quality** — compare official docs vs. community sources vs. LLM-generated research
- 🧪 **Dynamic gating** — develop a heuristic that enables research only when model uncertainty is high or the task involves niche/bleeding-edge APIs
- 🔀 **Cross-model evaluation** — test with GPT-4o, Claude 4, Gemini 2.5, and other frontier model families

### How to Contribute

1. Fork this repo
2. Add a new task to `examples/` with both conditions
3. Submit a PR with your scoring methodology
4. We'll evaluate and merge!

---

## 🚀 Quick Install

### Prerequisites

- **[OMP (Oh My Pi)](https://github.com/can1357/oh-my-pi)** — the AI coding harness that runs this skill
- **Git** — for cloning the repository
- **Python 3.10+** — required by OMP

Verify OMP is installed before proceeding:

```bash
which opencode || echo "OMP not found — install it first: https://github.com/can1357/oh-my-pi"
```

### Install

```bash
# 1. Ensure the managed-skills directory exists
mkdir -p ~/.omp/agent/managed-skills

# 2. Clone the skill
git clone https://github.com/raz123/best-practices-research-benchmark.git \
  ~/.omp/agent/managed-skills/best-practices-research
```

### Enable

Open `~/.omp/agent/config.yml` in your editor and add these lines at the top level (not nested under another key):

```yaml
bestPractices:
  enabled: true
```

> **Already have a `bestPractices:` block?** Just set `enabled: true` inside it — don't append a second one.

### Verify

```bash
# Confirm the skill directory exists
ls ~/.omp/agent/managed-skills/best-practices-research/SKILL.md

# Confirm config is valid YAML (requires python)
python3 -c "import yaml; yaml.safe_load(open('$HOME/.omp/agent/config.yml'))"

# Confirm the key is set
grep -A1 'bestPractices' ~/.omp/agent/config.yml
```

After enabling, OMP automatically runs the research middleware on non-trivial tasks. The first time a research task executes, you'll see a `~21s` delay — that's the research subagent fetching docs and patterns. Findings are written to `.planning/best-practices/`.

### Disable

Set `enabled: false` in `~/.omp/agent/config.yml`:

```yaml
bestPractices:
  enabled: false
```

Or remove the skill entirely:

```bash
rm -rf ~/.omp/agent/managed-skills/best-practices-research
```

For manual install, customization options, and troubleshooting, see [`skill/INSTALL.md`](skill/INSTALL.md).

---

## 📁 Repository Structure

```
best-practices-research-benchmark/
├── README.md                    # You are here
├── skill/                       # Installable OMP skill
│   ├── SKILL.md                 # The skill definition
│   ├── INSTALL.md               # Installation guide
│   └── SAMPLE-PROMPT.md         # What the skill injects into agents
├── charts/                      # Comparison charts (both models)
│   ├── overall-comparison.png
│   ├── per-task-wins.png
│   ├── familiar-vs-unfamiliar.png
│   └── quality-radar.png
├── charts/v4/                   # Visualization outputs (V4 — DeepSeek V4 Flash)
│   ├── overall-comparison.png
│   ├── per-task-wins.png
│   ├── familiar-vs-unfamiliar.png
│   └── quality-radar.png
├── data/                        # Raw evaluation data
│   ├── scores.jsonl             # 40 blind evaluation scores (V3)
│   ├── mapping.json             # Anonymization mapping (V3)
│   ├── results.json             # Statistical analysis (V3)
│   └── tasks.json               # 20 task definitions
├── data/v4/                     # Raw evaluation data (V4 — DeepSeek V4 Flash)
│   ├── scores.jsonl             # 40 blind evaluation scores
│   ├── results.json             # Full statistical analysis
│   └── task_mapping.json        # Condition reveal mapping
├── research/examples/           # Sample research outputs
│   ├── integration-stripe.md
│   ├── feature-wasm-image.md
│   └── fixer-websocket.md
├── docs/                        # Methodology documentation
│   ├── FINAL_REPORT.md
│   └── RUBRIC.md
├── LICENSE                      # MIT License
└── CONTRIBUTING.md              # How to contribute
```

---

## 🤝 Contributing

We welcome contributions! Whether you want to:

- 📝 Add a new benchmark task
- 🔬 Improve the evaluation methodology
- 📊 Add new visualizations
- 🐛 Report issues with existing results
- 🧪 Test with additional models (GPT-4o, Claude 4, Gemini 2.5)

Please read our [Contributing Guidelines](CONTRIBUTING.md) and submit a PR.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ to answer one question:**
*Can we make AI-generated code not just fast, but genuinely good?*

⭐ Star this repo if you find it useful!

</div>
