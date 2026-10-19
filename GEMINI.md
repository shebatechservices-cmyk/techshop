# Project Guidelines & Rules

## 🚨 STRICT RULE-1: MAXIMUM 200 LINES PER FILE (কঠোর রুল-১: ২০০ লাইনের সীমা)

> **Mandatory Constraint:**
> কোনো ফাইল (JS, JSX, TS, TSX) ২০০ লাইনের বেশি হতে পারবে না।
> No file in the codebase may exceed 200 lines. All new code, refactored components, controllers, hooks, and helpers must strictly adhere to this rule.

---

### Architectural Principles for Line Count Compliance

1. **React Components & UI**:
   - Monolithic components must be split into dedicated child sub-components.
   - Modals, drawers, header bars, tables, and rows must reside in their own focused files.
   - Presentational UI should be decoupled from complex business logic.

2. **Custom Hooks & State Management**:
   - State management logic exceeding 50-80 lines must be extracted into dedicated hooks (`use[Feature].js`).
   - Complex hooks should be composed of smaller modular sub-hooks.

3. **Backend Controllers & Routes**:
   - Controllers exceeding 200 lines must be modularized into domain processors, validators, and dedicated action handlers.
   - Use helper modules for SQL query construction, data formatting, and external integrations.

4. **Automated Verification**:
   - Run `npm run check:lines` to audit the entire project against the 200-line constraint.
   - Run `npm run check:lines:strict` to enforce a zero-violation check.

---

### Priority Refactoring Focus Areas
- Files with > 300 lines must be incrementally decomposed whenever touched or during scheduled refactoring phases.
- Never append new logic to an existing file if it would push the total line count over 200 lines; extract a new module instead.
