# sanka-plugin

Sankaは、local AI clientをpackaged local proxy経由でSankaのhosted MCP serverに接続するためのpluginです。SankaのCRM、見積、承認、請求、private inbox、経費、workflow intentをlive dataで操作できます。具体的なskillを選ばせたくない場合は、Sanka routerから開始できます。

## インストール

Codexはrepo-local marketplaceを使い、Claude CodeはGitHub marketplace commandを使います。インストール方法は違いますが、どちらも同じlocal proxyでhosted Sanka MCP serverに接続し、同じ `$sanka:...` skillを使います。

### Codex

```text
sankaHQ/sanka-pluginをcloneする
cloneしたrepoをCodexで開く
Codexをrestartする
Sanka marketplaceからSankaをinstallする
Sanka chipまたは$sanka:... mentionから開始する
```

### Claude Code

```text
/plugin marketplace add sankaHQ/sanka-plugin
/plugin install sanka@sanka
/reload-plugins
/sanka:sankaで自然文routerを使う、または具体的な/sanka:... skillから開始する
```

Claude CodeでGitHubからfuture updateをpullしたい場合は、`/plugin` からauto-updateを有効化してください。

### Cursor とその他のlocal MCP client

このrepoの `mcp.json` をlocal MCP server configとして使ってください。以下を実行します。

```text
node ./vendor/mcp-remote/bundled-proxy.min.cjs https://mcp.sanka.com/mcp
```

local proxyが起動でき、経費添付アップロード時にユーザーが指定した正確なreceipt pathを読めるよう、このrepoのファイルをローカルに置いたままにしてください。

local commandを実行できないclientでは、`mcp.remote.json` を使うか `https://mcp.sanka.com/mcp` に直接接続してください。そのmodeでも通常のSanka MCP toolは使えますが、`local_file_path` は読めないため、file uploadでは `content_base64` を渡す必要があります。

## 使い方

例:

```text
$sanka:sanka このHubSpot Deal URLから見積を作成して。
$sanka:deal-to-estimate https://app.hubspot.com/contacts/.../record/0-3/... 見積をpreviewして、まだ作成しないで。
$sanka:deal-to-estimate https://app.hubspot.com/contacts/.../record/0-3/... Sankaに同期済みなら見積を作成して。
$sanka:list-deals 最近の取引を見せて。
$sanka:create-expense この領収書から経費を作成して。
$sanka:refresh
```

Claude Codeでは、ユーザーに自然文で依頼させたい場合は `/sanka:sanka` をSankaの入口として使ってください。workflowが明確な場合は `/sanka:deal-to-estimate` のような個別skillも使えます。

HubSpot Deal URLからSankaの見積、承認依頼、workflow run、audit trailを作る場合は、Sanka routerまたはSanka workflow skillを使ってください。HubSpotはsource recordであり、business actionはSankaが実行します。

## 更新

Sankaが古いと表示された場合、ユーザーは「はい」と答えるだけで更新できます。

ユーザーに表示するプロンプト:

```text
Sankaが古いバージョンの可能性があります。
この操作には新しいSanka workflow skillが必要です。

Sankaを更新しますか？
「はい」と返信すると、CodexがSankaをrefreshして、新しいSanka skillを使える状態にします。
```

その後、Codexは以下を実行できます。

```bash
./scripts/refresh-codex-plugin.sh
```

更新後はCodexでSankaをreloadまたはreinstallし、Sanka chipまたは `$sanka:...` からfresh threadを開始してください。既存threadは古いMCP tool listを保持している可能性があります。

## 補足

- Hosted MCP endpoint: `https://mcp.sanka.com/mcp`
- Local MCP proxy: `node ./vendor/mcp-remote/bundled-proxy.min.cjs https://mcp.sanka.com/mcp`
- Codex MCP server name: `sanka_plugin`
- local plugin clientではpackaged proxyを使ってください。これにより経費添付ツールで正確な `local_file_path` を使えます。remote-only MCP clientは `mcp.remote.json` を使うかhosted endpointへ直接接続できますが、local file pathは読めません。
- live Sanka workにはattached Sanka MCP toolsを使ってください。local Django shell、Postgres、repo files、HubSpot MCPをSanka actionの代替にしないでください。
- `search_docs` / `execute` しか表示されない場合は、plugin attachmentをrefreshするか、新しいplugin-attached threadを開始してください。

## 翻訳

- [English](../README.md)
- [Japanese / 日本語](./README.jp.md)
