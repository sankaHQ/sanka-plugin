# Sanka Flow extension packaging

The unreleased Flow panel supports order review, confirmed invoice draft creation,
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
release prerequisite. The local package does not change the host's OAuth setup.
