# Data Model

## 1. Core Entities

### Learner

- learner_id
- display_name
- created_at
- preferences
- accessibility_settings
- current_course_id

### Subject

- subject_id
- title
- description

### Course

- course_id
- subject_id
- title
- version
- status

### Unit

- unit_id
- course_id
- title
- order

### Skill

- skill_id
- unit_id
- title
- description
- objectives
- difficulty_band
- mastery_thresholds
- content_version

### SkillPrerequisite

- skill_id
- prerequisite_skill_id
- minimum_threshold
- relationship_type

### Lesson

- lesson_id
- skill_id
- title
- components
- version

### Question

- question_id
- skill_id
- type
- difficulty
- prompt
- parameters
- answer_spec
- validator_type
- hints
- misconception_mappings
- transfer_flag
- version

### Attempt

- attempt_id
- learner_id
- question_id
- session_id
- submitted_answer
- normalized_answer
- correct
- attempt_number
- response_time
- created_at

### HintEvent

- hint_event_id
- attempt_id
- hint_level
- created_at

### SkillProgress

- learner_id
- skill_id
- state
- understanding_score
- accuracy_score
- independence_score
- retention_score
- transfer_score
- last_practiced_at
- next_review_at
- content_version

### ReviewRecord

- review_id
- learner_id
- skill_id
- scheduled_at
- completed_at
- result
- interval_before
- interval_after

### DiagnosticSession

- diagnostic_id
- learner_id
- started_at
- completed_at
- recommended_start_skill_id
- result_summary

### StudySession

- session_id
- learner_id
- started_at
- ended_at
- session_type
- target_duration
- completed_items

### TutorConversation

- conversation_id
- learner_id
- skill_id
- created_at

### TutorMessage

- message_id
- conversation_id
- role
- content
- created_at
- model_metadata
- verified_context_ids

## 2. Learning Event Model

Recommended event types:

- lesson_started
- lesson_completed
- question_presented
- answer_submitted
- hint_requested
- explanation_viewed
- mastery_check_started
- mastery_check_completed
- review_completed
- skill_state_changed
- diagnostic_answered

## 3. Example Skill Record

```json
{
  "skill_id": "math.fractions.add_like_denominators",
  "unit_id": "math.fractions",
  "title": "Add Fractions With Like Denominators",
  "objectives": [
    "Explain why the denominator remains unchanged",
    "Add fractions with matching denominators",
    "Simplify the result"
  ],
  "mastery_thresholds": {
    "understanding": 80,
    "accuracy": 85,
    "independence": 80,
    "retention": 75,
    "transfer": 70
  }
}
```

## 4. Data Rules

- IDs must be stable across versions.
- Deleted content should be retired, not silently reused.
- Attempts must remain traceable to content versions.
- Progress updates must be reproducible from validated events.
- Sync operations must be idempotent.
- Timestamps must use a consistent standard.
