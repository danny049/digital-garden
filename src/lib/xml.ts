export function xml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

export const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>';

export function xmlResponse(body: string, type = 'application/xml') {
  return new Response(`${xmlDeclaration}\n${body}\n`, {
    headers: { 'Content-Type': `${type}; charset=utf-8` },
  });
}
