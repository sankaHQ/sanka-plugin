# Sanka Flow extension packaging

The private Flow pilot supports order review, confirmed invoice draft creation,
submission recovery and saved-invoice readback. It is exposed only when the MCP
server enables it and the host supports the app entrypoint.

This package remains a thin local-client integration. Existing proxy/Connect Sanka
manifests remain on `/mcp`. Updating this package does not register, enable or
publish the separate native `/chatgpt` connector or Sign in with ChatGPT.

Use the tools actually advertised by the host. For the panel's invoice pilot,
retain `expected_workspace_id`, recover through `get_flow_invoice_attempt`,
review with `preview_flow_invoice`, and submit only after confirmation with
`start_flow_invoice` and the exact review token. Read saved invoices through
`get_flow_invoice`. Never retry an unknown write through generic tools. The pilot
allows one attempt per order; additional billing, approval, sending and payment
stay in Sanka. A workspace mismatch requires refresh and a new review.

Native OAuth and the panel are off by default. Their implementation and deployment
runbooks live in the API/MCP repos. Live ChatGPT/account acceptance remains a
prerequisite for wider distribution. The local package does not change the host's OAuth setup.

Order search is added through `search_flow_orders` when advertised. It matches
customer names, order notes and line-item text, with 20 results per page. The user
selects an order before preview and confirmation. This package does not supply
the sidebar icon; the hosted `open_flow_workspace` tool owns that metadata.
