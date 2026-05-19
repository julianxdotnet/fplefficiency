const FPL_BOOTSTRAP_URL = 'https://fantasy.premierleague.com/api/bootstrap-static/';

export async function onRequestGet({ request }) {
  return proxyFplJson(request, FPL_BOOTSTRAP_URL, 300);
}

async function proxyFplJson(request, url, maxAgeSeconds) {
  const cache = caches.default;
  const cacheKey = new Request(request.url, request);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const upstream = await fetch(url, {
    headers: {
      'accept': 'application/json',
      'user-agent': 'FPL Efficiency Cloudflare Pages',
    },
    cf: { cacheTtl: maxAgeSeconds, cacheEverything: true },
  });

  if (!upstream.ok) {
    return Response.json({ error: `FPL API returned ${upstream.status}` }, { status: 502 });
  }

  const response = new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${maxAgeSeconds}`,
    },
  });
  await cache.put(cacheKey, response.clone());
  return response;
}
