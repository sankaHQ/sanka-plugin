# Migration status documentation plan

Status: proposed documentation workstream accompanying the compact migration journey capability. This file is a plan, not a claim that the new capability is deployed.

## Outcome

Users and AI clients can identify the current migration stage, understand its state, open available results, and choose the next step. Free Assessment remains optional. No new version-history system is required.

## Additions to existing documentation

Preserve existing guides and navigation. Add a short migration-with-an-agent guide and an agent reference as separate review drafts. Public articles are now database-backed: use the supported Public Docs authoring lane, not local MDX mirrors in `sanka-public`. If draft access is unavailable, provide review-only artifacts outside the public repository with proposed CMS metadata. Linking from existing guides is a later review decision.

| Deliverable | Audience | Content and acceptance |
| --- | --- | --- |
| Connect and select a workspace | User | Link to the existing Codex installation guide; verify sign-in, the selected workspace, and source/destination connections. Do not require a manual clone when marketplace installation is available. |
| Understand migration status | User | Explain Assessment, Plan, Scan & Mapping, Transfer & Cutover. Distinguish unavailable evidence, not started, processing, blocked, failed, ready, and completed. An assessment is not proven complete by a scan; absent evidence does not prove the user skipped it. |
| Open and review results | User | Show a concise stage/status/result/next-step example using actual returned links. Clearly distinguish a migration page from a dedicated report. No fabricated URLs or completion claims. |
| Salesforce to HubSpot walkthrough | User | Connection check, optional assessment, existing plan inspection, mapping identities/associations, validation blockers, and separately authorized transfer. Label sample data as sample data. |
| Compact journey reference | AI/developer | Document the read-only journey tool and response, pinned workspace and migration inputs, optional assessment semantics, bounded outputs, and detail-on-demand report tools. |
| Troubleshooting | Both | Missing plugin tools/auth, wrong workspace, queued work, failed checks, missing schema, provider permissions/rate limits, and planning credits. Poll read-only status; do not repeatedly start paid planning to poll. |

## Existing entry points to complement

Published catalog slugs verified during this work:

- `codex`
- `ferry/process/free-assessment`
- `developers/mcp`
- `salesforce-to-hubspot-migration`

Confirm navigation and public URL resolution in that repository before adding links. Start with English companion pages under the current documentation-owner policy; Japanese translation is a follow-up once requested. If translated, keep structure, examples, and available assets equivalent. User guides should use natural-language tasks; tool names and exact response fields belong in the explicit AI/developer reference.

## Delivery order

1. Finalize and test the API/MCP contract and plugin guidance.
2. Draft additive user and agent pages against that exact behavior. Mark any unavailable assessment tool or report view explicitly; do not invent a command to complete it.
3. Compare existing installation steps and assessment guidance with the companion implementation; record discrepancies for later team review without rewriting existing articles. Verify output destinations. Use public-safe examples without customer identifiers or credentials.
4. Validate the new drafts and their links, then hand off the separate documentation artifacts for review. Do not publish automatically. Documentation publication is a CMS operation, not an article GitHub PR, and depends on availability of the documented capability.

## Review checklist

- A reader without a connection knows where to start.
- A reader with an existing migration can ask where it stands without starting another plan.
- Each stage explains its tangible output and where to open it, or explicitly says no output exists yet.
- A queued request is not described as successful completion; a suggestion is not execution authorization.
- Optional assessment is not a prerequisite for later stages.
- A plan may combine inventory and dry-run today; the guide does not promise four independent execution steps.
- Reading status does not initiate provider writes, planning charges, or transfer.
- Examples reflect implemented behavior; no versioning or new mandatory stage gates are promised.
