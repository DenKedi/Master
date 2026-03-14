/**
 * Shared card render version timestamp.
 *
 * Evaluated once when the JS module is first loaded on the client.
 * Appending `?v=RENDER_V` to every /api/cards/render/... URL guarantees
 * a fresh fetch on every hard navigation / page load, bypassing any
 * browser or CDN cache that might have stale rendered card images.
 *
 * For manual refresh (e.g. after an admin upload) override with a new
 * Date.now() value via your own component state, just like the admin page does.
 */
export const RENDER_V: number =
  typeof window !== "undefined" ? Date.now() : 0;
