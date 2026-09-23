/* ThoughtSpot Visual Embed SDK wiring.

   init() configures the SDK globally and must run once before any embed
   renders, so it is called from the Reports page on mount rather than at
   module load — nothing else in the app needs the SDK. */
import { AuthType, init } from '@thoughtspot/visual-embed-sdk'

export const THOUGHTSPOT_HOST = 'https://thoughtspotpmm.thoughtspot.cloud'

/* Liveboard and tab GUIDs, read off the Liveboard URL:
   /#/insights/pinboard/<liveboardId>/tab/<activeTabId> */
export const REPORTS_LIVEBOARD_ID = 'd0a5c56b-d803-4f2f-ab37-1b64cd530795'
export const REPORTS_TAB_ID = 'ce2f9eb2-24f5-4756-b922-d01434252ef6'

/* None does no authentication in the SDK — it passes straight through to the
   embedded app and relies on whatever ThoughtSpot session the browser already
   holds. A viewer signed in to the cluster in another tab sees the Liveboard;
   a signed-out viewer gets the error state below, because this cluster
   authenticates through Okta OIDC and Okta sets `frame-ancestors`, so no login
   can complete inside the iframe. To log those viewers in, switch to
   AuthType.OIDCRedirect (redirects the host app to the IdP and back; add
   `inPopup: true` to use a popup instead). */
export const AUTH_TYPE = AuthType.None

/* The product is a token swap between light and dark (see design/tokens.css),
   so the embed is themed the same way: resolve our tokens against the live
   document and hand the values to ThoughtSpot's own CSS variables. Only
   variables listed in the SDK's CustomCssVariables are allowed. */
export function embedCustomizations() {
  const read = (name, fallback) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return v || fallback
  }

  return {
    style: {
      customCSS: {
        variables: {
          '--ts-var-root-background': read('--canvas', '#F6F5F2'),
          '--ts-var-root-color': read('--text', '#17171A'),
          '--ts-var-root-font-family': read('--font', 'system-ui, sans-serif'),

          '--ts-var-liveboard-layout-background': read('--canvas', '#F6F5F2'),
          '--ts-var-liveboard-header-background': read('--canvas', '#F6F5F2'),
          '--ts-var-liveboard-header-font-color': read('--text', '#17171A'),
          '--ts-var-liveboard-tile-border-color': read('--border', '#E7E5DE'),
          '--ts-var-liveboard-tile-border-radius': read('--r-md', '10px'),
          '--ts-var-liveboard-tab-active-border-color': read('--accent', '#E0562D'),
          '--ts-var-liveboard-chip-background': read('--surface', '#FFFFFF'),
          '--ts-var-liveboard-chip-color': read('--text', '#17171A'),

          '--ts-var-viz-background': read('--surface', '#FFFFFF'),
          '--ts-var-viz-title-color': read('--text', '#17171A'),
          '--ts-var-viz-title-font-family': read('--font', 'system-ui, sans-serif'),
          '--ts-var-viz-description-color': read('--text-muted', '#6E6C66'),
          '--ts-var-viz-border-radius': read('--r-md', '10px'),
          '--ts-var-viz-box-shadow': 'none',

          /* KPI tiles: black, fixed, in both themes by explicit request — not
             the theme token. Every kpi-* variable the SDK exposes, the two
             change indicators included. */
          '--ts-var-kpi-hero-color': '#000000',
          '--ts-var-kpi-comparison-color': '#000000',
          '--ts-var-kpi-analyze-text-color': '#000000',
          '--ts-var-kpi-positive-change-color': '#000000',
          '--ts-var-kpi-negative-change-color': '#000000',
        },
      },
    },
  }
}

/* CSS customizations belong on init() — that is where the SDK documents them
   and where the embedded app reads them from. Passing them only on the view
   config silently does nothing. init() is safe to call again, so the Reports
   page re-runs this whenever the shell theme flips, just before it remounts
   the embed with freshly resolved token values. */
export function initThoughtSpot() {
  init({
    thoughtSpotHost: THOUGHTSPOT_HOST,
    authType: AUTH_TYPE,
    customizations: embedCustomizations(),
  })
}
