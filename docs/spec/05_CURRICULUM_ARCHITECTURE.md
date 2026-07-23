# Curriculum Architecture

## 1. Hierarchy

The curriculum uses:

`Subject → Course → Unit → Skill → Lesson Component → Question`

## 2. Mathematics Course Structure

### Unit 1: Number Foundations

- Counting and quantity
- Comparing numbers
- Place value
- Number lines
- Rounding
- Estimation

### Unit 2: Addition and Subtraction

- Addition meaning
- Addition facts
- Multi-digit addition
- Subtraction meaning
- Subtraction facts
- Multi-digit subtraction
- Inverse relationship
- Word problems

### Unit 3: Multiplication and Division

- Repeated addition
- Arrays and groups
- Multiplication facts
- Multi-digit multiplication
- Division meaning
- Division facts
- Remainders
- Relationship between multiplication and division
- Word problems

### Unit 4: Numerical Structure

- Even and odd numbers
- Factors
- Multiples
- Prime and composite numbers
- Greatest common factor
- Least common multiple
- Order of operations

### Unit 5: Integers

- Negative numbers
- Comparing integers
- Adding integers
- Subtracting integers
- Multiplying integers
- Dividing integers
- Absolute value

### Unit 6: Fractions

- Fraction meaning
- Numerator and denominator
- Equivalent fractions
- Simplifying fractions
- Comparing fractions
- Adding like denominators
- Subtracting like denominators
- Common denominators
- Adding unlike denominators
- Subtracting unlike denominators
- Multiplying fractions
- Dividing fractions
- Mixed numbers
- Fraction word problems

### Unit 7: Decimals

- Decimal place value
- Fraction-decimal relationship
- Comparing decimals
- Adding decimals
- Subtracting decimals
- Multiplying decimals
- Dividing decimals
- Rounding decimals

### Unit 8: Percentages

- Meaning of percent
- Fraction-decimal-percent conversion
- Percent of a quantity
- Finding the whole
- Finding the percent
- Percent increase and decrease
- Percentage word problems

### Unit 9: Ratios and Proportions

- Ratio meaning
- Equivalent ratios
- Rates
- Unit rates
- Proportions
- Scale
- Direct proportionality
- Ratio word problems

### Unit 10: Measurement Foundations

- Length
- Mass
- Time
- Temperature
- Area
- Volume
- Unit conversion
- Estimation and reasonableness

### Unit 11: Algebra Foundations

- Variables
- Constants
- Terms
- Coefficients
- Expressions
- Evaluating expressions
- Combining like terms
- Distributive property
- Equality
- One-step equations
- Two-step equations
- Equation word problems

### Unit 12: Coordinate Plane and Graphs

- Axes and origin
- Ordered pairs
- Plotting points
- Reading tables
- Reading graphs
- Rate of change intuition
- Input and output
- Function machines
- Introductory linear relationships

## 3. Scientific Reasoning Course Structure

### Unit 1: Scientific Thinking

- Observation
- Inference
- Testable questions
- Hypotheses
- Evidence
- Models
- Scientific explanations

### Unit 2: Experiments

- Independent variables
- Dependent variables
- Controlled variables
- Control groups
- Repeated trials
- Fair tests
- Sources of error

### Unit 3: Measurement

- SI system
- Length
- Mass
- Time
- Temperature
- Volume
- Unit conversion
- Accuracy
- Precision
- Estimation
- Significant figures introduction

### Unit 4: Data

- Tables
- Categorical and numerical data
- Bar graphs
- Line graphs
- Scatter plots
- Reading axes
- Trends
- Outliers
- Proportional relationships
- Drawing conclusions

## 4. Skill Record Requirements

Each skill must include:

- ID
- Title
- Summary
- Prerequisites
- Objectives
- Vocabulary
- Intuition
- Formal explanation
- Representations
- Worked examples
- Guided questions
- Independent questions
- Transfer questions
- Misconceptions
- Validators
- Mastery thresholds
- Review templates

## 5. Example Dependency

`math.algebra.one_step_equations`

Prerequisites:

- `math.integers.addition`
- `math.integers.subtraction`
- `math.integers.multiplication`
- `math.integers.division`
- `math.algebra.variables`
- `math.algebra.equality`

Successors:

- `math.algebra.two_step_equations`
- `math.algebra.word_equations`
- `math.graphs.linear_relationships`
