const MCP_WWW_AUTHENTICATE_META_KEY = "mcp/www_authenticate";
const SANKA_NATIVE_OAUTH_SUPPRESSED_META_KEY = "sanka/native_oauth_suppressed";

export function suppressNativeOAuthChallenge(message) {
  const result = message?.result;
  const meta = result?._meta;
  if (!meta || !Object.prototype.hasOwnProperty.call(meta, MCP_WWW_AUTHENTICATE_META_KEY)) {
    return message;
  }

  const { [MCP_WWW_AUTHENTICATE_META_KEY]: _challenge, ...remainingMeta } = meta;
  return {
    ...message,
    result: {
      ...result,
      _meta: {
        ...remainingMeta,
        [SANKA_NATIVE_OAUTH_SUPPRESSED_META_KEY]: true
      }
    }
  };
}
