export function generateCaddyfile(
  listOfStoresDomains: string[],
  frontendPort: number | string,
  middlewarePort: number | string,
): string {
  console.log('Generating Caddyfile');

  return listOfStoresDomains
    .map((storeUrl) => generateEntry(storeUrl, frontendPort, middlewarePort))
    .join('\n');
}

function generateEntry(
  domain: string,
  frontendPort: number | string,
  middlewarePort: number | string,
) {
  return `
${domain} {
  reverse_proxy localhost:${frontendPort}
  handle_path /api/* {
    reverse_proxy localhost:${middlewarePort}
  }

  tls {
    issuer internal
  }
}
`;
}
