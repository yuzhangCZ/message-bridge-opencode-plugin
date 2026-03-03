# Build/Lint/Test Commands

## Build
To build the project, run:
```bash
npm run build
```

## Lint
There are no linting commands defined in the `package.json`. Please add a linting tool and command if needed.

## Test
There are no test commands defined in the `package.json`. Please add a testing framework and command if needed.

## Running a Single Test
Since there is no testing framework configured, you will need to set one up. Once done, you can run a single test by specifying the path to the test file or using a pattern that matches the test name. For example, with Jest, you could use:
```bash
npm test -- -t 'testName'
```

# Code Style Guidelines

The following guidelines should be followed for code style:

## Imports
- Use absolute imports where possible.
- Group imports by source (built-in, third-party, local).
- Alphabetize imports within each group.
- Place a blank line between groups of imports.

## Formatting
- Use 2 spaces for indentation.
- Use single quotes for strings, except when the string contains a single quote.
- No trailing commas in object literals or array literals.
- Use semicolons at the end of statements.
- Use `const` for variables that do not change, `let` for those that do.
- Use `===` and `!==` over `==` and `!=`.

## Types
- Use TypeScript for type checking.
- Define types for function parameters and return values.
- Use interfaces for object shapes.
- Use enums for sets of related constants.

## Naming Conventions
- Use camelCase for variable and function names.
- Use PascalCase for class and interface names.
- Use UPPERCASE for constants.
- Use kebab-case for file and directory names.

## Error Handling
- Use try-catch blocks for error handling.
- Throw specific errors with meaningful messages.
- Log errors before throwing them.
- Avoid using `throw new Error('Generic message')`.
- Handle all promise rejections with `.catch()` or `async/await`.

## General
- Keep functions small and focused on a single responsibility.
- Comment your code to explain why, not what.
- Follow the DRY (Don't Repeat Yourself) principle.
- Write tests for new features and bug fixes.
- Ensure all public APIs are documented.

This document serves as a guide for maintaining consistency across the codebase. It should be updated whenever new conventions are adopted or existing ones are modified.