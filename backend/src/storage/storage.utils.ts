/** Build virtual-hosted-style base URL: https://bucket-name.endpoint-host (no trailing slash) */
export function buildVirtualHostedBaseUrl(
  endpoint: string,
  bucket: string,
): string {
  const url = new URL(endpoint);
  return `${url.protocol}//${bucket}.${url.host}`;
}
