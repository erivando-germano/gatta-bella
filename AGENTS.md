<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Catalog, categories and store settings are read from the browser via the generated client + React Query (`src/lib/catalog.ts`); public read is allowed by RLS, writes require `has_role(auth.uid(),'admin')`. Why: no server secrets needed, admin rights enforced in the database.
- Admin role lives only in `public.user_roles`; public signup is disabled and admins are added manually. Why: visitors must never self-promote.
- Storage buckets are private (workspace blocks public buckets); uploads store a long-lived signed URL in the row. Why: images must render for anonymous visitors.
- Cart and customer data stay in localStorage / memory only; nothing about orders is persisted. Why: privacy requirement.
- Checkout re-fetches current prices, availability and the WhatsApp number right before building the wa.me link. Why: totals and destination must reflect live data.
