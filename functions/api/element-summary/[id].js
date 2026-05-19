export async function onRequestGet({ params, request }) {
  const id = String(params.id || '').replace(/[^0-9]/g, '');
  if (!id) {
    return Response.json({ error: 'Missing player id' }, { status: 400 });
  }

  const url = `https://fantasy.premierleague.com/api/element-summary/${id}/`;
  const cache = caches.default;
  const cacheKey = new Request(request.url, request);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const upstream = await fetch(url, {
    headers: {
      'accept': 'application/json',
      'user-agent': 'FPL Efficiency Cloudflare Pages',
    },
    cf: { cacheTtl: 3600, cacheEverything: true },
  });

  if (!upstream.ok) {
    return Response.json({ error: `FPL API returned ${upstream.status}` }, { status: 502 });
  }

  const response = new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
  await cache.put(cacheKey, response.clone());
  return response;
}
