/**
 * fetch with an AbortSignal timeout.
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Run async tasks in parallel; return first non-null result (in source order).
 */
export async function firstSuccessful(tasks) {
  const results = await Promise.allSettled(tasks.map((fn) => fn()));
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    }
  }
  return null;
}
