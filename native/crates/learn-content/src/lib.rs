//! Content loading, validation, and the skill dependency graph. Merges what
//! were two TypeScript packages (schemas + curriculum): Ajv's runtime-compiled
//! validation has no Rust equivalent, so validation here is typed
//! deserialization plus hand-written ID-grammar/range checks instead.

#[cfg(test)]
mod tests {
    #[test]
    fn compiles() {}
}
