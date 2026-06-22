# PR Checklist — PACUL Backend

Complete before requesting review. Run automated gate:

```bash
cd backend
npm run pr:check
```

---

## Must pass — Code quality

| Item | Check |
| --- | --- |
| Typecheck | [ ] `npm run typecheck` passes |
| Lint | [ ] `npm run lint` passes |
| Unit tests | [ ] `npm run test` passes |
| Build | [ ] `npm run build` succeeds |
| Combined gate | [ ] `npm run pr:check` (or `npm run backend:check`) passes |

---

## Must pass — Security

| Item | Check |
| --- | --- |
| Auth guards | [ ] Protected routes use JWT + profile guards |
| RBAC | [ ] `@Roles(...)` applied where business rules require role isolation |
| DTO validation | [ ] New/changed endpoints use class-validator DTOs + global `ValidationPipe` |
| No secrets | [ ] No `.env`, API keys, or credentials in diff |
| RLS | [ ] New tables have RLS policies in migration (see `016_rls_policies.sql` pattern) |
| Ownership | [ ] Services enforce resource ownership / party access |
| Rate limits | [ ] Sensitive routes (AI, exports) throttled appropriately |

See also [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md).

---

## Must pass — Database

| Item | Check |
| --- | --- |
| Migration order | [ ] New migrations numbered sequentially; no gaps/renames without doc |
| Foreign keys | [ ] FK constraints with explicit `ON DELETE` behavior |
| Status constraints | [ ] `CHECK` constraints on status/enum columns where applicable |
| Indexes | [ ] Indexes on filter/join columns used in list queries |
| Idempotent seeds | [ ] Seed scripts safe to re-run (check-before-insert) |

---

## Must pass — API

| Item | Check |
| --- | --- |
| Documented | [ ] [API.md](./API.md) updated for new/changed endpoints |
| OpenAPI | [ ] Swagger decorators match actual request/response shapes |
| Response shape | [ ] Standard success/error envelopes; no raw stack traces |
| Breaking changes | [ ] Documented if frontend contract changes |

---

## Must pass — Business rules

| Item | Check |
| --- | --- |
| Status transitions | [ ] State changes go through transition engine / service validators |
| Ownership checks | [ ] Users cannot mutate others' resources |
| Role isolation | [ ] Household / collector / industry data scoped correctly |
| Terminal states | [ ] Completed/cancelled/sold records protected from invalid transitions |

---

## Must pass — Frontend contract

| Item | Check |
| --- | --- |
| `.env.example` | [ ] New env vars added to `backend/.env.example` |
| Shared types | [ ] Frontend types updated if API payloads changed |
| Breaking changes | [ ] Called out in PR description + README if needed |

---

## Nice to have

| Item | Check |
| --- | --- |
| Unit / integration tests | [ ] Coverage for new logic (service specs or e2e) |
| Query performance | [ ] No obvious N+1 in new list endpoints |
| Traceability | [ ] Significant business events emit traceability records |
| Notifications | [ ] User-facing state changes trigger notifications where expected |

---

## Sign-off

| Item | Check |
| --- | --- |
| Self-review | [ ] Diff reviewed; no debug logs or stray TODOs |
| Smoke tests | [ ] [SMOKE_TEST_GUIDE.md](./SMOKE_TEST_GUIDE.md) scenarios 1–5 **PASS** |
| README | [ ] [README.md](./README.md) updated if setup, scripts, or env changed |
| Deploy doc | [ ] [DEPLOY.md](./DEPLOY.md) updated if deploy steps changed |

**PR author:** _______________ **Date:** _______________
