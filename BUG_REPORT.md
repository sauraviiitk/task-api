# Bug Report

## Bug 1: Pagination logic skips the first page
- **Expected Behavior:** Requesting `GET /tasks?page=1&limit=10` should return the first 10 items (items 0 through 9).
- **What Actually Happens:** It returns items 10 through 19. If `page=0` is passed, it falls back to `page=1` in the route, making it impossible to retrieve the first 10 items.
- **How I Discovered It:** While writing the integration test for pagination, `getPaginated(1, 2)` skipped the first two items and returned the third and fourth items.
- **Fix:** In `src/services/taskService.js`, change the offset calculation in `getPaginated` from `const offset = page * limit;` to `const offset = (page - 1) * limit;`.

## Bug 2: Filter by status ignores pagination
- **Expected Behavior:** `GET /tasks?status=todo&page=1&limit=10` should return a paginated list of 'todo' tasks.
- **What Actually Happens:** It returns all 'todo' tasks and completely ignores the pagination parameters.
- **How I Discovered It:** By reading the route logic in `src/routes/tasks.js`. The code returns early inside the `if (status)` block before it ever reaches the pagination logic.
- **Fix:** Chain the operations or combine the filters in `taskService.js` so that `taskService.getTasks({ status, page, limit })` applies both filtering and pagination simultaneously.

## Bug 3: `completeTask` forces priority to medium
- **Expected Behavior:** Marking a task as complete (`PATCH /tasks/:id/complete`) should only update the `status` and set `completedAt`.
- **What Actually Happens:** It also arbitrarily changes the task's `priority` to `'medium'`.
- **How I Discovered It:** By reading the `completeTask` function in `src/services/taskService.js`.
- **Fix:** Remove the `priority: 'medium'` line from the `updated` object definition inside `completeTask`.

## Bug 4: Fuzzy matching for status filtering
- **Expected Behavior:** `GET /tasks?status=todo` should return tasks with the exact status `todo`.
- **What Actually Happens:** The service uses `.includes()`, meaning a query for `status=do` would mistakenly return both `todo` and `done` tasks.
- **How I Discovered It:** By reading the `getByStatus` function in `src/services/taskService.js`.
- **Fix:** Change `t.status.includes(status)` to strict equality `t.status === status`.

---

# Submission Notes

- **What I'd test next if I had more time:** 
  I would add tests for UUID validation (ensuring created IDs are valid UUIDs) and stress testing to ensure the in-memory array doesn't cause performance degradation with thousands of tasks. I would also add more comprehensive validation testing for edge-case date formats.
  
- **Anything that surprised me in the codebase:** 
  I was surprised to find that completing a task forcefully resets its priority to `medium`. This seems like an unintended side-effect of a quick copy-paste during development.

- **Any questions I'd ask before shipping this to production:**
  1. Do we need persistent storage (e.g., PostgreSQL, MongoDB)? An in-memory array will lose all data every time the server restarts or crashes.
  2. Do we need Authentication/Authorization? Right now, anyone can delete or modify any task.
  3. Should we enforce stricter input validation and sanitization to prevent potential XSS if the data is rendered directly in a UI?
