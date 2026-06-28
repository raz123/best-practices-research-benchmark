# V3 Quality Rubric (6 dimensions, 0-5 scale)

## Dimensions

### 1. Anti-Pattern Avoidance (weight: 20%)
- 0-1: Uses known anti-patterns, deprecated APIs, or dangerous practices
- 2-3: Mostly avoids anti-patterns but misses some edge cases
- 4-5: Clean of all common anti-patterns for this domain

### 2. Best Practice Adherence (weight: 20%)
- 0-1: Ignores established patterns for this framework/library
- 2-3: Follows some best practices but misses key idioms
- 4-5: Fully idiomatic, follows all major best practices

### 3. Completeness (weight: 20%)
- 0-1: Missing critical functionality, many TODOs
- 2-3: Core functionality works but missing edge cases
- 4-5: Comprehensive implementation covering main + edge cases

### 4. Error Handling (weight: 15%)
- 0-1: No error handling, crashes on bad input
- 2-3: Basic try/catch but misses error propagation, cleanup
- 4-5: Comprehensive error handling, graceful degradation, proper cleanup

### 5. Security (weight: 10%)
- 0-1: Vulnerable to injection, XSS, or data leaks
- 2-3: Basic security but missing validation, sanitization, or auth checks
- 4-5: Secure by default, input validation, proper auth patterns

### 6. Code Quality (weight: 15%)
- 0-1: Unreadable, no structure, inconsistent
- 2-3: Decent structure but verbose or inconsistent naming
- 4-5: Clean, well-organized, consistent naming, appropriate abstractions

## Scoring Rules
- Score each dimension independently (0-5, integer or half-point)
- Overall = weighted average across all 6 dimensions
- Do NOT look at filenames, directory structure, or any identifying info
- Base scores ONLY on code content
