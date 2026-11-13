# AGENTS.md — Codex Development Rules

These rules apply to every task in this project.

## 1. Protect Existing Code
- Inspect existing files before modifying them.
- Preserve all working functionality.
- Make minimal, targeted changes.
- Never delete, overwrite, rename, or reorganize files unnecessarily.
- Do not modify unrelated components or features.

## 2. Follow Existing Architecture
- Follow the existing project structure and coding conventions.
- Maintain compatibility with existing components, APIs, and dependencies.
- Do not rewrite working implementations without a valid reason.
- Keep frontend and backend responsibilities separate.
- Never connect the frontend directly to MySQL.

## 3. Dependencies and Configuration
- Do not install unnecessary packages.
- Never uninstall dependencies without permission.
- Do not change package versions or configurations unnecessarily.
- Never overwrite `.env` files or expose credentials.
- Preserve existing scripts, ports, and configuration settings.

## 4. Database and Production Safety
- Use dummy data during local development.
- Never connect to or modify the production database or VPS without explicit permission.
- Never delete, truncate, reset, or overwrite database records without approval.
- Explain database schema changes and their potential impact before proceeding.
- Never expose passwords, API keys, or database credentials.

## 5. Git Safety
- Never run `git reset --hard` or `git clean -fd`.
- Never delete `.git` directories or rewrite Git history.
- Never force-push.
- Never commit or push without explicit permission.
- Check `git status` and preserve uncommitted user changes.

## 6. Code Quality
- Write clean, readable, and maintainable code.
- Reuse existing components and logic where appropriate.
- Avoid unnecessary complexity and duplicated code.
- Handle errors and validate inputs properly.
- Do not leave broken imports or unused references.

## 7. Testing and Verification
After every implementation:
- Check for syntax and compilation errors.
- Run the relevant build or development checks.
- Verify that the implemented feature works.
- Check that existing functionality remains intact.
- Report errors honestly. Never claim something was tested if it wasn't.

## 8. Risky Changes
Before performing destructive or high-impact operations:
1. Explain what needs to change and why.
2. Identify affected files, configurations, or data.
3. Explain potential risks.
4. Wait for explicit user approval.

## 9. Follow Task Instructions
- Implement only what the user requests.
- Do not add unrequested features or make unrelated improvements.
- Do not proceed to another development task without permission.
- Ask questions when requirements are unclear.
- Do not assume approval for changes outside the requested scope.

## 10. Completion Report
After each task, summarize:
- Changes made.
- Files created or modified.
- Dependencies added or changed.
- Tests performed and results.
- Known issues or unfinished work.

## Most Important Rule

**Preserve existing working functionality. Application stability and data safety always take priority over development speed.**

When unsure whether a change could break something, stop and ask before proceeding.