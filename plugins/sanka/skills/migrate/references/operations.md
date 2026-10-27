# Migration operation details

- For Programs, Scan, Map, or Transfers requests, first distinguish reusable migration configuration, program documents/todos, finite data migrations, ordinary import/export jobs, and client-executed code migration evidence. These are related but different capabilities. Use the live tool catalog and `get_capability_guidance` when uncertain; if a listed tool is unavailable, refresh/reconnect rather than inventing a route or falling back to local scripts.
- Pin the internal workspace UUID from `list_workspaces` on every migration call and retain all program, migration, endpoint and connection IDs. Never use a mutable shared current workspace as the execution identity. A workspace mismatch requires correcting the connection, not switching silently during an operation.
- For reusable migration Programs, inspect `list_migration_program_templates`, `list_migration_connections`, `list_migration_programs` and `get_migration_program`. When available, `create_migration_program` and `update_migration_program` configure a Program after authorization. Updates replace supplied endpoint arrays; omitted fields are preserved and an empty array clears a side. Read endpoint options and options_redacted. When options_redacted is true, obtain the complete reviewed configuration from its owner before replacing arrays; never reconstruct hidden options as empty. These writes have no revision/hash precondition or idempotency guarantee. Program status is not proof of transfer completion.
- `list_ferry_programs`, `get_ferry_program`, Ferry docs/todos and Ferry diagram tools already support collaboration/design. A diagram is not an executable mapping. Use get_migration_mapping/save_migration_mapping for executable field edits when available; do not substitute a diagram edit. Broader research/assessment, AI mapping proposals and destination-schema reconciliation remain distinct capabilities.
- Read back the Program and pin both endpoint IDs before `create_program_migration`, or use `create_migration` for a direct supported connector pair. Setup does not plan or transfer. `start_migration_plan` queues source inspection and dry-run planning; poll `get_migration` and inspect `get_migration_plan`. Review the exact plan hash, intended objects/routes, filters and destination before any authorized apply. Never replace a rejected plan/config hash or widen the approved route scope automatically.
- Establish user authorization from the conversation for the exact action before setting confirmation flags. `confirm: true` is an agent acknowledgement, not proof that a human approved. Preserve server authorization and tool-specific plan/config hash and idempotency requirements. Stateful tools disable automatic retries; inspect state after uncertain responses. Send an idempotency key only where the live schema supports it, and reuse it only for the identical operation.
- For standalone Scan → Map, call `inspect_migration` to read stored reports and server-computed binding/mapping hashes. `list_migration_source_objects` discovers objects through the run-bound connection; after scope authorization, `scan_migration` queues inventory. Poll inspection or `get_migration_report` with `stage: inventory`. Use `get_migration_mapping` to read the full field list, then submit its complete reviewed replacement with `save_migration_mapping`, the exact `expected_binding_hash` and `expected_mapping_hash`, and confirmation. The API atomically checks and saves the map; stale hashes conflict. Every save invalidates old validation. Use `validate_migration_mapping` for a write-free sample, inspect actual checks, then read/review a new `get_migration_plan` before apply. These Scan/Map writes have no idempotency contract and must not be automatically retried. Do not infer independent human review from server caller authorization or a hash.
- Where available, `repair_migration` retries failed records/relationships under the unchanged reviewed plan, with explicit destination-write and cost authorization (currently 300 credits on completed repair). `review_migration` requests a signed evidence review (currently 250 credits) after separate cost authorization. Both require a stable supported idempotency key. `get_migration_review` and `get_migration_attestation_key` read existing evidence/key without starting paid work. A service attestation is not independent human approval; receiving its payload/key does not itself verify its signature.
- After apply, queued or applying means pending. Poll status, use the supported verification tools, and report verification outcome separately from transport success. Failed, skipped and `not_run` checks have not passed. Use ingestion source/batch tools only for their reviewed update-only configuration and payload; activation/staging is not completed transfer evidence.
- Code migration tools register genuine client-produced scan/plan/apply/verification artifacts for DRF-to-FastAPI migrations. They do not run customer code, rewrite repositories, run tests or deploy. Never manufacture evidence or infer permission to run local code from artifact-registration authorization. These endpoints have no idempotency contract.

## Microsoft 365 to Microsoft 365

Use the native public lifecycle for real tenants; preserve the signed demo path for demo accounts.
All calls keep the same internal workspace UUID, migration ID and source/destination System IDs.
Configure real Microsoft Systems with tenant GUIDs and application credentials through the supported
System setup. Full OneDrive/SharePoint history and permissions require certificate authentication,
preprovisioned empty destination libraries, compatible schema/version retention, and reviewed
identity correspondence. Do not put private keys or passwords in a prompt.

1. Discover and scan explicit `workplace_groups`, `workplace_mailboxes`, `workplace_calendars`,
   `workplace_contacts`, `workplace_onedrive`, `workplace_sharepoint`, `workplace_teams` and
   `workplace_chats` scopes using the ordinary migration Scan tools.
2. Read `get_migration_native_review`. Use its actual source/destination identity UUIDs and
   resource candidates. Save one-to-one user correspondence and selected resource targets with
   `save_migration_native_review`, the current binding hash/revision, source-freeze acknowledgement,
   full version/permission preservation and explicit limitation/exclusion reasons. Do not infer a
   correspondence from matching display names.
3. With authorization to read source content, call `prepare_migration_native_content` using the
   returned review hash/revision and a stable idempotency key. Poll native review until prepared.
   Preparation stages source content privately and may run Microsoft metadata-export jobs. It does
   not import destination documents or messages. Review any fidelity blocker; do not silently
   exclude unsupported content or replace a rejected hash.
4. Save exact unfiltered Name/Owner routes for every prepared workload. Validate the mapping and
   inspect the canonical plan, including its native preparation receipt. Use the ordinary confirmed
   apply tool only within the user's destination-write authorization. Source data is retained.
5. Poll persisted state. Verify after transfer and inspect native reconciliation separately from
   counters. Opaque Exchange import receipts, item class and destination change keys do not prove
   semantic equality of every field. Original organizers/meeting links are retained; this does not
   rehost meetings or recreate original sharing URLs.
6. If an operation is `issuing` or `uncertain`, pause and drain its original executor. Inspect the
   provider outcome before `recover_migration_native_operation`, supplying the exact operation
   revision, known destination receipt and evidence. Recovery reads back the candidate and never
   repeats create/import. An opaque mailbox item without an acknowledged correspondence receipt
   cannot be adopted solely because its ID/class exists. Do not use generic repair or a new
   idempotency key to repeat an uncertain provider create. `action=resume_staging` omits the
   destination ID and is allowed only when a SharePoint checkpoint proves submission was never
   dispatched. After recovery, inspect the current canonical plan and resume with its reviewed hash;
   successful provider writes remain protected by the native journal.

These tools connect to the same Sanka engine from Codex and Claude. Local HTTP fixtures prove
orchestration and recovery behavior; acceptance by two disposable Microsoft tenants must be
established separately before any production migration. Never substitute direct Graph/PowerShell
scripts for an unavailable Sanka tool.

### Extended Microsoft content

For a meeting conversation, Microsoft cannot import historical content into a native meeting
chat. Only after the user chooses that outcome, set the chat resource's
`meeting_chat_mode: group_copy` and acknowledge `meeting_chat_becomes_group_copy` in the native
review. The target is a new group labelled `Meeting archive: …`; its receipt retains the original
meeting-chat ID. Review participants and history visibility. Do not describe the result as a
recreated meeting or claim recordings/invitations have been rehosted.

For modern SharePoint Site Pages, explicitly set `include_site_pages: true`, map the preprovisioned
empty Site Pages library, and retain the native history/permission preparation path. Unknown
asset references and mismatched target schema remain blockers; classic parts require the bounded explicit profile below;
never silently use current-page-only creation when historical versions were requested.

Use `get_migration_native_applications` with a source catalog site from this run's SharePoint
snapshot. Select SPFx `applications` using the returned app/product IDs, expected version and
package ETag, source catalog site/scope, package filename and operator evidence. Acknowledge `sharepoint_application_code_execution`.
The destination site collection app catalog must already exist. The native engine uploads without
overwrite, deploys within that site, installs and reads back the package/version. It does not
grant API permissions or deploy tenant-wide extensions. External app services and vendor licenses
need their own reviewed provisioning. Inspect `applicationRuntimeSampling`; package installation
alone does not prove the application runs. Reconcile unknown outcomes before ordinary resume.

Online Archive is separate from Outlook's ordinary Archive folder. Graph does not copy In-Place
Archives through the normal mail API. A separate Exchange Graph beta route is available only for
local qualification when `MIGRATION_ARCHIVE_PREVIEW_ENABLED=true`; it is disabled by default and
blocked outside local development/test runtimes. Select `mailbox_scope: online_archive` on a
`mailboxes` resource and acknowledge `online_archive_graph_beta_preview` plus the original meeting
addresses/links limitation. Primary and archive scopes can be reviewed separately for the same user.
Both Online Archives must already exist and the destination archive must be empty. No archive is
enabled automatically and no fallback to the primary mailbox is allowed. Exported opaque items are
imported in create mode into the destination archive. Auxiliary archive redirects are bounded and
must retain the tenant, operation and folder/item identity. A lost import response requires explicit
reconciliation; ordinary resume must not create another copy. Verification rechecks the source
account, primary/archive identities, folder tree and item versions as well as destination receipts.
The source mailbox must stay active with its data intact. Do not move, delete or cut over the source
mailbox, or disable its account. For ordinary hidden archive folders, explicitly set
`include_hidden_archive_folders: true` and acknowledge `hidden_archive_content`. Root and child
listings include hidden folders; capture and fresh verification preserve visibility and hierarchy.
Missing visibility metadata blocks preparation. **Original Recoverable Items state is not supported:**
`RECOVERABLE_STATE_UNQUALIFIED` stops exposed recoverable folders before transfer. Never replace
Deletions/Purges/Versions/DiscoveryHolds with an ordinary hidden folder, or claim an item copy
preserves native hold/purge behavior. Full recoverable coverage and real Microsoft tenant
acceptance remain unqualified.

For shared static classic Content Editor web parts, explicitly set `include_classic_webparts: true`
and acknowledge `classic_webpart_native_passthrough`; Site Pages also require `include_site_pages`.
The engine carries unchanged Microsoft AMR serialization into current and historical manifest
nodes and compares shared SOAP properties at the destination. A changed/dropped part invalidates
verification. Never disable NoScript to force a result. Personalized/custom parts, tenant-dependent
references, non-static HTML or changed historical serialized properties remain blocked with
`CLASSIC_SERIALIZER_REQUIRED`. Those need a qualified Windows worker and SPMT's Microsoft web-part
serializer DLL, which are currently unavailable. Local opaque fixtures prove passthrough and drift
handling; they do not qualify Microsoft acceptance or historical rendering. Standalone Python or TypeScript SDK regeneration is
outside this migration product workflow.

If native review reports `preparation_failed`, inspect inventory, correct and save the review
with its current binding hash/revision, then explicitly prepare again. Do not poll forever or
replace a source-preserving archive copy with a mailbox move.
