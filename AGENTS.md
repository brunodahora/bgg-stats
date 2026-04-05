<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:testing-rules -->
# Testing

Read `TESTING_GUIDELINES.md` before writing any tests. Key rules:

- Follow the **Testing Trophy** strategy: mostly integration tests, some unit tests, always static analysis.
- Use **React Testing Library** + **user-event** for component/integration tests.
- Use **fast-check** for property-based tests on pure functions.
- Use **MSW** to mock HTTP at the network boundary — never mock `fetch` directly.
- Write all test descriptions in **Gherkin notation**: `Given ... When ... Then ...`
- Test behavior from the user's perspective, not implementation details.
<!-- END:testing-rules -->
