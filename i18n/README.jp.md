# sanka-plugin

Sanka Pluginは、Sankaのhosted MCP serverをCodexとClaude Codeに接続するためのpluginです。SankaのCRM、見積、承認、請求、private inbox、経費、workflow intentをlive dataで操作できます。

## インストール

Codexはrepo-local marketplaceを使い、Claude CodeはGitHub marketplace commandを使います。インストール方法は違いますが、どちらも同じhosted Sanka MCP serverと同じ `$sanka:...` skillを接続します。

### Codex

```text
sankaHQ/sanka-pluginをcloneする
cloneしたrepoをCodexで開く
Codexをrestartする
Sanka Local PluginsからSanka Pluginをinstallする
Sanka Plugin chipまたは$sanka:... mentionから開始する
```

### Claude Code

```text
/plugin marketplace add sankaHQ/sanka-plugin
/plugin install sanka@sanka
/reload-plugins
通常のchatまたは/sanka:... skillから開始する
```

Claude CodeでGitHubからfuture updateをpullしたい場合は、`/plugin` からauto-updateを有効化してください。

## 使い方

例:

```text
$sanka:deal-to-estimate https://app.hubspot.com/contacts/.../record/0-3/... 見積をpreviewして、まだ作成しないで。
$sanka:deal-to-estimate https://app.hubspot.com/contacts/.../record/0-3/... Sankaに同期済みなら見積を作成して。
$sanka:list-deals 最近の取引を見せて。
$sanka:create-expense この領収書から経費を作成して。
$sanka:refresh
```

HubSpot Deal URLからSankaの見積、承認依頼、workflow run、audit trailを作る場合は、`$sanka:deal-to-estimate` のようなSanka workflow skillを使ってください。HubSpotはsource recordであり、business actionはSankaが実行します。

## 更新

Sanka Pluginが古いと表示された場合、ユーザーは「はい」と答えるだけで更新できます。

ユーザーに表示するプロンプト:

```text
Sanka Pluginが古いバージョンの可能性があります。
この操作には新しいSanka workflow skillが必要です。

Sanka Pluginを更新しますか？
「はい」と返信すると、CodexがSanka Pluginをrefreshして、新しいSanka skillを使える状態にします。
```

その後、Codexは以下を実行できます。

```bash
cd /Users/haegwan/Sites/sanka/sanka-plugin
./scripts/refresh-codex-plugin.sh
```

更新後はCodexでSanka Pluginをreloadまたはreinstallし、Sanka Plugin chipまたは `$sanka:...` からfresh threadを開始してください。既存threadは古いMCP tool listを保持している可能性があります。

## 補足

- Hosted MCP endpoint: `https://mcp.sanka.com/mcp`
- Codex MCP server name: `sanka_plugin`
- live Sanka workにはattached hosted MCP toolsを使ってください。local Django shell、Postgres、repo files、HubSpot MCPをSanka actionの代替にしないでください。
- `search_docs` / `execute` しか表示されない場合は、plugin attachmentをrefreshするか、新しいplugin-attached threadを開始してください。

## 翻訳

- [English](../README.md)
- [Japanese / 日本語](./README.jp.md)
