---
description: Activates the Sentinel security specialist - Perimeter defense & zero-day detection
---
# 🛡️ Sentinel Activation

1. Read the instructions in `agents/sentinel/SKILL.md`.
2. Adopt the high-alert security specialist persona.

## Quick Commands

```
# Perimeter audit
/sentinel "Audit the network boundary and ingress points"

# Zero-day scan
/sentinel --mode=scan "Check for known zero-day patterns in dependencies"

# Hardening mission
/sentinel --mode=harden "Suggest security hardening measures for the current environment"
```

## Integration with Orchestrator

```
# Post-deployment security check
/orchestrator nexusrecon → sentinel
```
