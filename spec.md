---
description: Create detailed product specifications and feature definitions. Focuses on functional requirements and user flows.
---

# /spec - Product Specification Mode

$ARGUMENTS

---

## 🟢 Purpose

Create a detailed, implementation-agnostic **Product Requirement Document (PRD)**.
This workflow focuses on **WHAT** to build (functionality, logic, user experience), providing the necessary blueprint before technical planning (`/plan`) or construction (`/create`).

---

## 🔴 Rules

1.  **Agent**: Must use `product-manager` agent.
2.  **No Code**: The output is a documentation file, not source code.
3.  **Deep Definition**: Do not stop at high-level summaries. You must define inputs, outputs, rules, and edge cases.
4.  **Context**: If the request is vague, ask clarifying questions before generating the spec.

---

## Process

### 1. 🔍 Interactive Discovery (The "Why")
**DO NOT** generate the spec immediately. First, conduct a Socratic interview:
*   **Goal**: "What is the single most important metric for this feature?"
*   **User**: "Who specifically are we building for?"
*   **Gap**: "What details are we missing?"
*   *Action*: Ask 3-5 targeted questions to clarify scope and intent.

### 2. 💡 Strategic Recommendation (The "How")
Before writing the spec, offer professional advice:
*   "Have you considered [X] to improve UX?"
*   "We could simplify [Y] by doing [Z]."
*   "A technical risk here is [A]; we should define [B]."

### 3. 📝 Specification Generation
Create the markdown file (`docs/SPEC-{slug}.md`) using the structure below.

### 4. 🔄 The Quality Loop
After generating the spec, **STOP** and ask the user:
> "I have created the initial spec.
> 1. Do you want to **deepen** the definition for [Specific Section]?
> 2. Or are you ready to **finalize** and move to `/plan`?"

---

## 🏆 Elite Quality Standards (Mandatory)

The spec must enforce these standards for downstream planning:

### UX & Interface (Pro-Max Level)
*   **Zero-Latency Interactions**: Define optimistic UI updates for all user inputs.
*   **Memory Paging**: UI must process info in chunks (Miller's Law) - never overwhelming walls of text.
*   **Error Prevention**: Define constraints that preventing errors *before* the user clicks submit.
*   **Visual Hierarchy**: Explicitly state which element dominates the screen (The "One Thing").

### Technical Architecture
*   **Type Safety**: All inputs/outputs must be strictly typed (Reference strict schemas).
*   **Edge Case First**: Happy path is easy; the spec must overly-detail the "Sad Path".
*   **Scalability**: Define data access patterns (Read-heavy vs Write-heavy) to guide DB choice.

---

### 5. Required Content Structure
The PRD **MUST** follow this comprehensive structure. DO NOT omit sections; use "TBD" if unknown.

```markdown
# [System/Feature Name] Product Specification

## 1. Executive Summary
*   **Goal**: Brief description of what this is and why we are building it.
*   **Value Proposition**: What problem does this solve for the user?
*   **Success Metrics (KPIs)**: How will we know it works? (e.g., "Reduce checkout time by 20%")

## 2. User Personas
| Persona | Description | Needs/Pain Points |
|---------|-------------|-------------------|
| [Name]  | [Who]       | [Why they care]   |

## 3. Functional Requirements (The "Meat")
Break down into granular features. Use **MoSCoW** prioritization.

### 3.1. [Feature Name] (Priority: MUST/SHOULD)
*   **User Story**: As a [Persona], I want to [Action], so that [Benefit].
*   **Logic/Rules**:
    *   [Rule 1]
    *   [Rule 2]
*   **Inputs**: [Data entering system]
*   **Outputs**: [System response]
*   **Acceptance Criteria**:
    *   [ ] Given [Context], When [Action], Then [Result]

*(Repeat for all features)*

## 4. Data Models & Glossary
Define core entities to ensure shared understanding.
*   **[Entity Name]**: [Definition] (e.g., "Order: A cart that has been paid for")

## 5. User Flows & Diagrams
*   [Step 1] -> [Step 2] -> [Step 3]
*   (Optional: Mermaid diagram)

## 6. Edge Cases & Error Handling
*   **Network Failure**: [Behavior]
*   **Validation Errors**: [Behavior]
*   **Empty States**: [Behavior]

## 7. Non-Functional Requirements
*   **Performance**: [Latency/Throughput constrains]
*   **Security**: [Auth/Permissions]
*   **Device**: [Mobile/Desktop/Tablet support]

## 8. Assumptions & Risks
*   **Assumption**: [e.g., User has email]
*   **Risk**: [e.g., API rate limits]
```

---

## Usage Examples

```bash
/spec "Checkout system with Stripe and PayPal"
/spec "Admin dashboard for user management"
/spec "Real-time chat system with channels"
```

---

## After Completion

Inform the user:
> "✅ Specification created at `docs/SPEC-{slug}.md`. Please review it. Once approved, you can run `/plan` to convert this spec into a technical implementation plan."
