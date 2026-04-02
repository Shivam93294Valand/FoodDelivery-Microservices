/**
 * Returns a throttled version of `fn` that fires at most once per `limitMs`.
 * The first call executes immediately; subsequent calls within the window are dropped.
 *
 * @param {Function} fn
 * @param {number} limitMs - minimum milliseconds between invocations
 */
export function throttle(fn, limitMs) {
  let lastCall = 0
  let timeoutId = null

  return function throttled(...args) {
    const now = Date.now()
    const remaining = limitMs - (now - lastCall)

    if (remaining <= 0) {
      lastCall = now
      return fn.apply(this, args)
    }

    // Schedule the trailing call so the last invocation always fires
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      lastCall = Date.now()
      fn.apply(this, args)
    }, remaining)
  }
}

/**
 * Returns a debounced version of `fn` that fires only after `delayMs` of inactivity.
 * Suitable for search inputs and other high-frequency events.
 *
 * @param {Function} fn
 * @param {number} delayMs - wait period after last call before invoking fn
 */
export function debounce(fn, delayMs) {
  let timeoutId = null

  return function debounced(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      fn.apply(this, args)
    }, delayMs)
  }
}

/**
 * Wraps an async API call with client-side request deduplication.
 * While a call is in-flight, any additional calls with the same key
 * are coalesced and share the same Promise result.
 *
 * @param {string} key - unique identifier for the request
 * @param {Function} asyncFn - () => Promise<T>
 * @returns {Promise<T>}
 */
const _inFlight = new Map()

export function deduplicateRequest(key, asyncFn) {
  if (_inFlight.has(key)) {
    return _inFlight.get(key)
  }

  const promise = asyncFn().finally(() => {
    _inFlight.delete(key)
  })

  _inFlight.set(key, promise)
  return promise
}
