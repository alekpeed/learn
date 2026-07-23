# UX and Screen Flow Specification

## 1. Primary Flow

`Welcome → Profile → Goal Selection → Diagnostic or Start From Beginning → Dashboard → Lesson → Practice → Mastery Check → Review Queue`

## 2. Main Screens

### Welcome

Purpose:

- Explain the app briefly
- Start a local profile
- Sign in when cloud accounts exist
- Resume an existing learner

### Goal Selection

Collect:

- Subject
- Starting preference
- Session duration
- Study frequency
- Optional learning goal

### Diagnostic

Requirements:

- One question at a time
- Skip option
- Clear progress estimate
- No penalty framing
- Ability to stop and resume

### Diagnostic Results

Display:

- Strong areas
- Weak areas
- Unknown areas
- Recommended starting skill
- Explanation of the recommendation
- Override option

### Dashboard

Display:

- Continue learning
- Reviews due
- Current skill
- Current unit
- Weak prerequisite alerts
- Recent progress
- Curriculum map access
- Study history

### Curriculum Map

Display:

- Skill nodes
- Prerequisite connections
- Locked skills
- Available skills
- In-progress skills
- Provisionally mastered skills
- Mastered skills
- Review-due skills

### Lesson

Display:

- Objective
- Explanation
- Visual representation
- Worked example
- Continue control
- Ask tutor
- Notes
- Exit and resume

### Practice

Display:

- One question
- Answer input
- Submit
- Hint
- Optional scratch area
- Feedback
- Next question

### Mastery Check

Requirements:

- No ordinary hints
- Clear start and finish
- Mixed item forms
- Immediate result after completion
- Specific recommendation

### Review Queue

Display:

- Due count
- Estimated duration
- Start review
- Skill breakdown
- Overdue items

### Progress

Display:

- Skill-level scores
- Retention history
- Review history
- Time studied
- Current learning path

### Settings

Include:

- Text size
- Contrast
- Motion
- Sound
- Session length
- AI tutor availability
- Data export
- Data reset

## 3. Interaction Rules

- Show one primary action per screen
- Preserve progress automatically
- Never erase an answer without explicit action
- Explain locked content
- Make prerequisite detours visible
- Avoid generic failure messages
- Support keyboard-only operation
- Use color plus labels or icons for status
- Do not require AI to complete standard flows

## 4. States

Every screen must define:

- Loading
- Empty
- Active
- Success
- Recoverable error
- Offline
- Permission denied where applicable

## 5. Responsive Behavior

The design must work on desktop and tablet-sized screens.

Mobile support may be responsive in the MVP, but the interface should prioritize clarity over compressing every desktop element into one view.
