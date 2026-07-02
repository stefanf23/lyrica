/**
 * Safely parse a fetch Response as JSON.
 * Avoids "Unexpected end of JSON input" on empty or malformed bodies.
 */
export async function parseJsonResponse(res) {
  const text = await res.text();

  if (!text || !text.trim()) {
    if (!res.ok) {
      throw new Error(
        res.status === 404
          ? 'No lyrics found for this song.'
          : `Server error (${res.status}). The request may have timed out — please try again.`
      );
    }
    throw new Error('Empty response from server.');
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid response from server. Please try again.');
  }
}

/**
 * POST JSON to an API endpoint with safe parsing.
 */
export async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

/**
 * GET JSON from an API endpoint with safe parsing.
 */
export async function getJson(url) {
  const res = await fetch(url);
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}
