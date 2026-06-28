#!/usr/bin/env python3
"""
Analyze blind evaluation results after revealing the mapping.
Compares quality between research and no-research conditions.
"""

import json
import statistics
from pathlib import Path
from collections import defaultdict

def load_scores(scores_path):
    """Load blind evaluation scores."""
    scores = []
    with open(scores_path) as f:
        for line in f:
            if line.strip():
                scores.append(json.loads(line))
    return scores

def load_mapping(mapping_path):
    """Load anonymization mapping."""
    with open(mapping_path) as f:
        return json.load(f)

def load_file_list(file_list_path):
    """Load anonymized file list."""
    with open(file_list_path) as f:
        return json.load(f)

def reveal_conditions(scores, mapping, file_list):
    """Reveal which scores belong to which condition."""
    # Create anon_id -> condition mapping
    anon_to_condition = {}
    for item in file_list:
        anon_id = item["anon_id"]
        condition = item["condition"]
        anon_to_condition[anon_id] = condition
    
    # Add condition to each score
    for score in scores:
        anon_id = score.get("anon_id")
        if anon_id in anon_to_condition:
            score["revealed_condition"] = anon_to_condition[anon_id]
        else:
            score["revealed_condition"] = "unknown"
    
    return scores

def compute_stats(scores):
    """Compute statistics per condition."""
    by_condition = defaultdict(list)
    for s in scores:
        by_condition[s["revealed_condition"]].append(s)
    
    results = {}
    for condition, cond_scores in by_condition.items():
        # Compute average per dimension
        dims = ["anti_pattern_avoidance", "best_practice_adherence", "completeness", 
                "error_handling", "security", "code_quality"]
        
        avg_dims = {}
        for dim in dims:
            vals = [s.get(dim, 0) for s in cond_scores]
            avg_dims[dim] = statistics.mean(vals) if vals else 0
        
        # Compute overall average
        overall = statistics.mean(avg_dims.values()) if avg_dims else 0
        
        results[condition] = {
            "count": len(cond_scores),
            "avg_overall": overall,
            "avg_dimensions": avg_dims
        }
    
    return results

def paired_analysis(scores):
    """Analyze paired results (same task, different condition)."""
    by_task = defaultdict(list)
    for s in scores:
        by_task[s["task_id"]].append(s)
    
    pairs = []
    for task_id, task_scores in by_task.items():
        if len(task_scores) == 2:
            # Find which is research and which is no-research
            research = [s for s in task_scores if s.get("revealed_condition") == "research"]
            no_research = [s for s in task_scores if s.get("revealed_condition") == "no-research"]
            
            if research and no_research:
                r_score = research[0]
                nr_score = no_research[0]
                
                # Compute overall scores
                dims = ["anti_pattern_avoidance", "best_practice_adherence", "completeness", 
                        "error_handling", "security", "code_quality"]
                
                r_overall = statistics.mean([r_score.get(d, 0) for d in dims])
                nr_overall = statistics.mean([nr_score.get(d, 0) for d in dims])
                
                pairs.append({
                    "task_id": task_id,
                    "research_score": r_overall,
                    "no_research_score": nr_overall,
                    "delta": r_overall - nr_overall,
                    "winner": "research" if r_overall > nr_overall else "no-research" if nr_overall > r_overall else "tie"
                })
    
    return pairs

def significance_test(pairs):
    """Simple paired t-test for significance."""
    if len(pairs) < 2:
        return {"p_value": 1.0, "significant": False, "message": "Too few pairs"}
    
    deltas = [p["delta"] for p in pairs]
    mean_delta = statistics.mean(deltas)
    stdev = statistics.stdev(deltas) if len(deltas) > 1 else 0
    n = len(deltas)
    
    if stdev == 0:
        return {"p_value": 0.0 if mean_delta != 0 else 1.0, "significant": mean_delta != 0, "message": "Zero variance"}
    
    # Standard error
    se = stdev / (n ** 0.5)
    
    # t-statistic
    t = mean_delta / se
    
    # Degrees of freedom
    df = n - 1
    
    # Rough p-value approximation (two-tailed)
    # For df=9, t>2.262 is p<0.05, t>3.250 is p<0.01
    abs_t = abs(t)
    if abs_t > 3.250:
        p_approx = 0.01
    elif abs_t > 2.262:
        p_approx = 0.05
    elif abs_t > 1.833:
        p_approx = 0.10
    else:
        p_approx = 0.50
    
    return {
        "mean_delta": mean_delta,
        "stdev": stdev,
        "n": n,
        "t_statistic": t,
        "p_approx": p_approx,
        "significant": p_approx < 0.05,
        "message": f"t({df})={t:.3f}, p≈{p_approx:.3f}"
    }

def print_report(stats, pairs, sig_test):
    """Print final report."""
    print("\n" + "=" * 70)
    print("BENCHMARK-V2 RESULTS (Blind Evaluation)")
    print("=" * 70)
    
    print("\n--- Overall Quality by Condition ---")
    for condition, data in stats.items():
        print(f"\n{condition.upper()}:")
        print(f"  Samples: {data['count']}")
        print(f"  Overall Score: {data['avg_overall']:.2f} / 5.00")
        print(f"  By Dimension:")
        for dim, score in data['avg_dimensions'].items():
            print(f"    {dim}: {score:.2f}")
    
    print("\n--- Paired Comparison (per task) ---")
    research_wins = sum(1 for p in pairs if p["winner"] == "research")
    no_research_wins = sum(1 for p in pairs if p["winner"] == "no-research")
    ties = sum(1 for p in pairs if p["winner"] == "tie")
    
    print(f"Research wins: {research_wins}/{len(pairs)}")
    print(f"No-Research wins: {no_research_wins}/{len(pairs)}")
    print(f"Ties: {ties}/{len(pairs)}")
    
    print("\n--- Per-Task Results ---")
    for p in pairs:
        marker = "✓" if p["winner"] == "research" else "✗" if p["winner"] == "no-research" else "="
        print(f"  {marker} {p['task_id']}: {p['research_score']:.2f} vs {p['no_research_score']:.2f} (Δ={p['delta']:+.2f})")
    
    print("\n--- Statistical Significance ---")
    print(f"  Mean Delta: {sig_test['mean_delta']:+.2f}")
    print(f"  Std Dev: {sig_test['stdev']:.2f}")
    print(f"  N: {sig_test['n']}")
    print(f"  t-statistic: {sig_test['t_statistic']:.3f}")
    print(f"  p-value (approx): {sig_test['p_approx']:.3f}")
    print(f"  Significant (p<0.05): {'YES' if sig_test['significant'] else 'NO'}")
    print(f"  {sig_test['message']}")
    
    print("\n" + "=" * 70)

if __name__ == "__main__":
    base_dir = Path(".planning/best-practices/benchmark-v2")
    
    scores = load_scores(base_dir / "evaluation" / "scores.jsonl")
    mapping = load_mapping(base_dir / "evaluation" / "mapping.json")
    file_list = load_file_list(base_dir / "evaluation" / "anonymized_files.json")
    
    # Reveal conditions
    scores = reveal_conditions(scores, mapping, file_list)
    
    # Compute stats
    stats = compute_stats(scores)
    
    # Paired analysis
    pairs = paired_analysis(scores)
    
    # Significance test
    sig_test = significance_test(pairs)
    
    # Print report
    print_report(stats, pairs, sig_test)
    
    # Save detailed results
    results = {
        "stats": stats,
        "pairs": pairs,
        "significance": sig_test
    }
    
    with open(base_dir / "evaluation" / "results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\nDetailed results saved to: {base_dir / 'evaluation' / 'results.json'}")
