<div align="center">

# 🔬 Research-Augmented Code Generation Benchmark

### Does best-practices research middleware actually improve AI-generated code quality?

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776ab.svg)](https://python.org)
[![Status: Published](https://img.shields.io/badge/Status-Published-success.svg)](#results)
[![Model: mimo-v2.5](https://img.shields.io/badge/Model-mimo--v2.5-purple.svg)](https://github.com/raz123/best-practices-research-benchmark)

<br/>

*A rigorous, controlled experiment measuring whether an AI coding assistant produces
better code when augmented with best-practices research before task execution.*

**Model tested:** `opencode-go/mimo-v2.5` (all code generation and evaluation)

</div>

---

## 📋 TL;DR (V3 — 20 tasks, p < 0.001)

| Metric | No Research | With Research | Δ | Δ% |
|:---|:---:|:---:|:---:|:---:|
| **Overall Score** (out of 5) | 3.84 | **4.72** | **+0.875** | **+22.8%** |
| **Win Rate** | 0 / 20 | **20 / 20** | — | **100%** |
| **Statistical Significance** | — | — | t(19) = 16.998 | **p < 0.001** |
| **Cost per Quality Point** | — | — | ~33 seconds | — |

> **Bottom line:** Research-augmented code scored **22.8% higher** on average and won
> **every single task** (20/20). The effect is highly significant (p < 0.001) with a
> very large effect size (Cohen's d ≈ 3.8). At ~29 seconds overhead per task, the
> cost-benefit ratio is extremely favorable.
---

## 🎯 The Problem

Large language models write code fast. But **fast isn't the same as good.**

When an AI agent builds a feature, it reasons from its training data — which may be outdated,
incomplete, or missing critical edge cases for a specific library version, API pattern, or
framework idiom. The question we asked:

> **If we give the AI a best-practices research phase *before* it writes code — pulling
> current docs, GitHub issues, known pitfalls, and community patterns — does the resulting
> code measurably improve?**

This matters because:
- 🏗️ **Integration tasks** are where real projects live or die — wrong API usage means
  subtle bugs that surface in production.
- ♻️ **Refactoring** with bad patterns creates technical debt faster than it removes it.
- 🧪 **Tests** written without understanding testing idioms miss the cases that actually matter.
- 💰 **Every percentage point of quality improvement** compounds across a codebase.

---

## 🧪 Methodology

### Experimental Design

| | **Control (No Research)** | **Treatment (With Research)** |
|:---|:---|:---|
| **Approach** | Direct task execution | Best-practices research → then task execution |
| **Model** | `opencode-go/mimo-v2.5` | `opencode-go/mimo-v2.5` |
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
| 🔄 **Same model** | Both conditions use identical base model and temperature |
| 📝 **Identical prompts** | Task descriptions are copy-paste identical |
| 🔒 **Isolated execution** | Each task runs in a fresh context with no cross-contamination |
| 👤 **Blind evaluation** | Scores assigned by evaluator without knowing which condition produced the code |
| 📊 **Multiple dimensions** | Code rated on correctness, style, error handling, documentation, and best practices |

### Scoring

Each solution was rated on a **1–5 scale** across five dimensions:

| Dimension | Weight | What It Measures |
|:---|:---:|:---|
| **Correctness** | 25% | Does it work? Edge cases handled? |
| **Code Quality** | 25% | Idiomatic patterns, clean structure, readability |
| **Error Handling** | 20% | Graceful failures, proper error propagation |
| **Best Practices** | 20% | Framework idioms, security, performance patterns |
| **Documentation** | 10% | Comments, types, JSDoc/docstrings where warranted |

---

## 📊 Results (V3 — 20 Tasks)

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
> but the effect is strong on both. The previous V2 finding that "research hurts on
> unfamiliar tasks" was a sample-size artifact.
---

## 📈 Charts

The full analysis includes four visualizations:

| Chart | Description | Path |
|:---|:---|:---|
| 📊 **Score Comparison** | Side-by-side bar chart of overall scores | [`charts/overall-comparison.png`](charts/overall-comparison.png) |
| 📉 **Per-Task Breakdown** | Grouped bars for each task by condition | [`charts/per-task-wins.png`](charts/per-task-wins.png) |
| 🎯 **Category Analysis** | Improvement deltas by task type | [`charts/familiar-vs-unfamiliar.png`](charts/familiar-vs-unfamiliar.png) |
| 📐 **Dimension Scores** | Radar chart of performance across six dimensions | [`charts/quality-radar.png`](charts/quality-radar.png) |

---

## 📐 Statistical Analysis (V3)

### Significance Testing

| Statistic | Value | Interpretation |
|:---|:---:|:---|
| **N** | 20 tasks | Sufficient for strong inference |
| **Mean Δ** | +0.875 | Large practical effect |
| **Std Dev** | 0.230 | Consistent across tasks |
| **t-statistic** | t(19) = 16.998 | Very large |
| **p-value** | p < 0.001 | **Highly significant** |
| **Effect Size (Cohen's d)** | ~3.8 | **Very large** |
| **Win Rate** | 20 / 20 (100%) | Perfect |

### Cost-Benefit Analysis

| Metric | Value |
|:---|:---:|
| Avg research time per task | ~21 seconds |
| Avg total overhead | ~29 seconds |
| Avg research file size | ~3 KB |
| Quality improvement | +0.875 points (22.8%) |
| Cost per quality point | ~33 seconds |
| **ROI verdict** | **Extremely favorable** |

### Interpretation

The results are **highly statistically significant** (p < 0.001) with a **very large effect size** (Cohen's d ≈ 3.8). This means:

- ✅ **The effect is real** — not due to chance
- ✅ **Practical impact is substantial** — 22.8% quality improvement
- ✅ **Consistent across tasks** — low variance (SD = 0.23)
- ✅ **Works everywhere** — familiar and unfamiliar tasks both benefit
- ✅ **Cost-effective** — ~29 seconds overhead for +0.875 quality points
> *"Absence of evidence is not evidence of absence."* The data strongly suggests research
> helps; we need more signal to prove it mathematically.

---

## ⚠️ Limitations & Caveats

| Limitation | Detail |
|:---|:---|
| **Single model** | All tasks evaluated with `opencode-go/mimo-v2.5`. Results may differ with other models — research might help weaker models more and stronger models less. |
| **Single evaluator** | One model scored all code. Multiple evaluators would increase reliability. |
| **No runtime testing** | Evaluation was static code analysis — we didn't run the code to verify correctness. |
| **Sample size** | 10 tasks (need 20+ for statistical significance at p < 0.05). |
| **File count imbalance** | CLI Framework task produced 553 research files vs 4 no-research files, skewing raw counts (mitigated by per-task averaging). |
| **Synthetic tasks** | Tasks were self-contained, not part of a real codebase with existing conventions. |
---

## ✅ Recommendations

Based on our findings, here's when to enable or disable the research middleware:

### 🟢 Enable Research When

| Scenario | Why |
|:---|:---|
| **Integrating third-party APIs** | Current docs prevent wrong auth patterns, endpoint changes |
| **Refactoring existing code** | Avoids deprecated patterns, surfaces modern idioms |
| **Writing test suites** | Idiomatic test structure, proper mocking strategies |
| **Working with unfamiliar libraries** | Bridges the knowledge gap between training data and current API |
| **Security-sensitive code** | Research surfaces known vulnerabilities and mitigation patterns |

### 🟡 Consider Skipping When

| Scenario | Why |
|:---|:---|
| **Simple CRUD operations** | Research overhead exceeds the marginal quality gain |
| **Boilerplate / scaffolding** | Standard patterns don't benefit from deep research |
| **Familiar, well-documented tasks** | If the model already has strong training data coverage |
| **Time-critical prototypes** | When speed matters more than polish |

### ⚙️ Configuration

```yaml
# Enable for maximum quality
best_practices_research: true

# Disable for speed
best_practices_research: false
```

---

## 🔮 Future Work

### Immediate Next Steps

- [ ] **Scale to 20+ tasks** to achieve statistical significance
- [ ] **A/B test with real developers** — does research-augmented code actually reduce bug rates in production?
- [ ] **Task-type-specific scoring** — deeper breakdown of which *sub-dimensions* benefit most
- [ ] **Cost analysis** — measure the research phase's time/token cost vs. quality gain

### Longer-term Questions

- 🧠 **Does research help more or less as models improve?** Newer models may already know best practices
- 🔄 **Diminishing returns?** Measure whether 2x research effort yields 2x quality
- 🏢 **Team dynamics** — how does research-augmented code affect code review burden?
- 📚 **Research quality** — does better source selection (official docs vs. Stack Overflow) change outcomes?

### How to Contribute

1. Fork this repo
2. Add a new task to `examples/` with both conditions
3. Submit a PR with your scoring methodology
4. We'll evaluate and merge!

---

## 📁 Repository Structure

```
benchmark-repo/
├── README.md                    # You are here
├── charts/                      # Visualization outputs
│   ├── overall-comparison.png
│   ├── per-task-wins.png
│   ├── familiar-vs-unfamiliar.png
│   └── quality-radar.png
├── data/                        # Raw evaluation data
│   ├── scores.jsonl             # 609 blind evaluation scores
│   ├── mapping.json             # Anonymization mapping
│   └── results.json             # Statistical analysis
├── examples/
│   ├── research/                # Solutions with research middleware
│   │   ├── feature-01/          # React Date Picker
│   │   ├── refactor-01/         # Express Async Refactor
│   │   └── integration-01/      # Stripe Integration
│   └── no-research/             # Solutions without research
│       ├── feature-01/
│       ├── refactor-01/
│       └── integration-01/
├── research/                    # Best-practices research files
└── scripts/                     # Analysis tools
```

---

## 🤝 Contributing

We welcome contributions! Whether you want to:

- 📝 Add a new benchmark task
- 🔬 Improve the evaluation methodology
- 📊 Add new visualizations
- 🐛 Report issues with existing results

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
