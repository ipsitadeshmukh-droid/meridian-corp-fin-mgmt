/* Deterministic PRNG. Every figure in the product comes from a fixed seed, so
   totals reconcile across screens and nothing reshuffles between renders. */

export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function makeRng(seed) {
  const r = mulberry32(seed)
  const api = {
    next: r,
    float: (min, max) => min + r() * (max - min),
    int: (min, max) => Math.floor(min + r() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(r() * arr.length)],
    weighted: (entries) => {
      // entries: [[value, weight], ...]
      const total = entries.reduce((s, e) => s + e[1], 0)
      let t = r() * total
      for (const [value, weight] of entries) {
        t -= weight
        if (t <= 0) return value
      }
      return entries[entries.length - 1][0]
    },
    chance: (p) => r() < p,
    // Box-Muller, clamped — used for organic-looking balance drift
    normal: (mean = 0, sd = 1) => {
      const u = Math.max(r(), 1e-9)
      const v = Math.max(r(), 1e-9)
      const n = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
      return mean + n * sd
    },
    shuffle: (arr) => {
      const a = arr.slice()
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    },
  }
  return api
}

/* Stable string hash — lets any entity derive its own sub-seed from its id. */
export function hashSeed(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
