#!/usr/bin/env python3
"""
Anonymize benchmark outputs for blind evaluation.
Renames files to random IDs and creates a hidden mapping.
"""

import os
import json
import random
import string
import shutil
from pathlib import Path

def random_id(length=8):
    """Generate random alphanumeric ID."""
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def collect_files(base_dir):
    """Collect all implementation files from research and no-research dirs."""
    files = []
    
    for condition in ["research", "no-research"]:
        cond_dir = base_dir / condition
        if not cond_dir.exists():
            continue
        
        for task_dir in sorted(cond_dir.iterdir()):
            if not task_dir.is_dir():
                continue
            
            task_id = task_dir.name
            
            # Collect all code files (not research.md or benchmark.jsonl)
            for f in task_dir.rglob("*"):
                if f.is_file() and f.suffix in ['.ts', '.tsx', '.rs', '.toml', '.html']:
                    files.append({
                        "original_path": str(f),
                        "condition": condition,
                        "task_id": task_id,
                        "filename": f.name
                    })
    
    return files

def anonymize(base_dir, output_dir):
    """Anonymize files for blind evaluation."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    files = collect_files(base_dir)
    
    mapping = {}
    anonymized = []
    
    for f in files:
        anon_id = random_id()
        
        # Create anonymized filename
        orig_path = Path(f["original_path"])
        anon_filename = f"{anon_id}{orig_path.suffix}"
        anon_path = output_dir / anon_filename
        
        # Copy file
        shutil.copy2(orig_path, anon_path)
        
        # Store mapping (hidden from evaluator)
        mapping[anon_id] = {
            "original_path": f["original_path"],
            "condition": f["condition"],
            "task_id": f["task_id"],
            "filename": f["filename"]
        }
        
        anonymized.append({
            "anon_id": anon_id,
            "anon_path": str(anon_path),
            "condition": f["condition"],
            "task_id": f["task_id"]
        })
    
    # Save mapping (separate file, not in anonymized dir)
    mapping_path = base_dir / "evaluation" / "mapping.json"
    mapping_path.parent.mkdir(parents=True, exist_ok=True)
    with open(mapping_path, "w") as f:
        json.dump(mapping, f, indent=2)
    
    # Save anonymized file list
    list_path = base_dir / "evaluation" / "anonymized_files.json"
    with open(list_path, "w") as f:
        json.dump(anonymized, f, indent=2)
    
    print(f"Anonymized {len(files)} files")
    print(f"Mapping saved to: {mapping_path}")
    print(f"File list saved to: {list_path}")
    
    return anonymized

if __name__ == "__main__":
    base_dir = Path(".planning/best-practices/benchmark-v2")
    output_dir = base_dir / "evaluation" / "anonymized"
    anonymize(base_dir, output_dir)
