---
name: THB Nexus React Query hook pattern
description: Required queryKey pattern for generated API hooks
---

All generated hooks (e.g. `useGetBotStatus`) require `queryKey` inside the `query` option.
Always import and use the matching `getGet*QueryKey()` helper:

```tsx
useGetBotStatus({ query: { refetchInterval: 3000, queryKey: getGetBotStatusQueryKey() } })
```

**Why:** The Orval-generated hooks' TypeScript types mark `queryKey` as required. Omitting it causes TS2741 errors.
**How to apply:** Every hook call with a `query` option must include `queryKey: getGet<Name>QueryKey()`.
