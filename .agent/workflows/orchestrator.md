---
description: Master Orchestrator - Combines multiple agents with conditional routing and if-else logic
---
# 🎯 AgentOrchestrator - Multi-Agent Command Center

## ACTIVATION
Read `agents/orchestrator/SKILL.md` then execute multi-agent coordination.

## QUICK START EXAMPLES

```
# Sequential security-first pipeline
/orchestrator security → phantom → codeninja

# Parallel execution
/orchestrator [security + phantom + codeninja]

# Conditional routing
/orchestrator IF security.critical THEN phantom ELSE codeninja
```

## AGENT SELECTION (Pick 2-4)

| Agent | Best For |
|-------|----------|
| `security` | Vulnerability scanning, secret detection |
| `phantom` | Testing, QA, bug hunting |
| `codeninja` | Code review, architecture, refactoring |
| `nexusrecon` | CI/CD, deployment, mobile optimization |
| `ux-guru` | Accessibility, design review, responsive |
| `se` | System analysis, infrastructure |

## EXECUTION MODES

### 1. Sequential Mode (→)
```
/orchestrator security → phantom → codeninja
```
Each agent runs after previous completes. Results pass forward.

### 2. Parallel Mode ([])
```
/orchestrator [security + phantom + codeninja]
```
All agents run simultaneously. Results aggregated at end.

### 3. Conditional Mode (IF/THEN/ELSE)
```
/orchestrator IF context.security_critical THEN security → phantom ELSE codeninja

/orchestrator IF files.include("*.tsx") THEN ux-guru ELSE phantom
```

## BUILT-IN PIPELINES

### 🛡️ Security Pipeline
```
/orchestrator --preset=security
# Runs: security → phantom → codeninja
```

### 🚀 Deploy Pipeline  
```
/orchestrator --preset=deploy
# Runs: codeninja → phantom → nexusrecon
```

### 🎨 UI Pipeline
```
/orchestrator --preset=ui
# Runs: ux-guru → phantom → codeninja
```

### 📊 Full Audit
```
/orchestrator --preset=audit
# Runs: [security + codeninja + ux-guru] → phantom
```
