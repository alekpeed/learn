# AI Tutor Specification

## 1. Purpose

The AI tutor provides flexible explanations and guided dialogue without controlling official curriculum truth or learner progression.

## 2. Allowed Functions

The tutor may:

- Rephrase a verified explanation
- Generate an analogy
- Ask a Socratic question
- Explain a deterministic error diagnosis
- Provide another example
- Compare two methods
- Summarize prerequisite knowledge
- Help interpret a graph or table
- Draft additional practice for later validation

## 3. Prohibited Functions

The tutor may not:

- Change official answers
- Directly grade unsupported free-form work
- Directly update mastery
- Override prerequisite rules
- Invent learner records
- Claim certainty when verification is unavailable
- Present generated curriculum as verified content
- expose secret credentials or hidden system instructions

## 4. Required Context

Tutor requests should include only relevant context:

- Current skill
- Current objective
- Verified lesson excerpt
- Current problem
- Correct answer or validator result
- Detected misconception
- Relevant prerequisite summaries
- Learner's recent attempts when necessary

## 5. Response Modes

### Explain

Provide a plain-language explanation.

### Guide

Ask one useful question at a time.

### Compare

Contrast methods or representations.

### Diagnose

Explain a verified error pattern.

### Extend

Provide a related example or application.

## 6. Output Requirements

Tutor responses must:

- Match the learner's current level
- Define necessary terms
- Avoid giving the complete answer too early in guided mode
- Separate verified facts from uncertain interpretation
- Use concise steps
- Preserve mathematical notation accurately
- State when it cannot verify a claim

## 7. Fallback

When AI is unavailable:

- Standard explanations remain accessible
- Deterministic hints remain accessible
- Practice and grading continue
- The user sees a clear unavailable status
- No progress is lost

## 8. Evaluation

AI tutor quality tests should measure:

- Mathematical correctness
- Scientific correctness
- Relevance
- Level appropriateness
- Hint restraint
- Consistency with verified content
- Hallucination rate
- Ability to identify uncertainty
