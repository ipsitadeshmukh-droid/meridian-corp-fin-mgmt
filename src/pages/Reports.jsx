import { useEffect, useMemo, useRef, useState } from 'react'
import { LiveboardEmbed } from '@thoughtspot/visual-embed-sdk/react'
import {
  REPORTS_LIVEBOARD_ID,
  REPORTS_TAB_ID,
  initThoughtSpot,
  embedCustomizations,
} from '../thoughtspot.js'
import './Reports.css'

/* The shell writes the active theme onto the document element and the embed
   lives in a separate document, so it cannot inherit our tokens. Watching the
   attribute lets the iframe be re-themed the moment the toggle is flipped. */
function useDocumentTheme() {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light',
  )
  useEffect(() => {
    const el = document.documentElement
    const observer = new MutationObserver(() => {
      setTheme(el.getAttribute('data-theme') || 'light')
    })
    observer.observe(el, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])
  return theme
}

export default function Reports() {
  const theme = useDocumentTheme()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const embedRef = useRef(null)

  /* Re-runs init() with freshly resolved tokens whenever the theme flips, and
     synchronously during render so the config is in place before the embed
     below mounts. The embed is keyed on the theme so it rebuilds against it. */
  const customizations = useMemo(() => {
    initThoughtSpot()
    return embedCustomizations()
  }, [theme])

  useEffect(() => { setLoading(true); setError(null) }, [theme])

  /* The overlay is a courtesy, not a gate. If the embed never reports itself
     rendered — an unauthenticated session, say — ThoughtSpot still has its own
     UI to show inside the frame, so uncover it rather than sitting on top of
     it. The embed itself is never unmounted for the same reason. */
  useEffect(() => {
    if (!loading) return undefined
    const timer = setTimeout(() => setLoading(false), 6000)
    return () => clearTimeout(timer)
  }, [loading, theme])

  return (
    <div className="page page-reports">
      <header className="page-head">
        <div className="page-head-title">
          <h1>Reports</h1>
          <p className="page-sub">
            Analytics served live from ThoughtSpot. Drill into any tile to reach the
            underlying rows.
          </p>
        </div>
      </header>

      {error && <div className="ts-embed-note" role="status">{error}</div>}

      <div className="ts-embed-frame">
        {loading && (
          <div className="ts-embed-loading" role="status">
            <span className="ts-embed-spinner" aria-hidden="true" />
            <span>Loading Liveboard…</span>
          </div>
        )}
        <LiveboardEmbed
          key={theme}
          ref={embedRef}
          className="ts-embed"
          liveboardId={REPORTS_LIVEBOARD_ID}
          activeTabId={REPORTS_TAB_ID}
          customizations={customizations}
          fullHeight
          /* .shell-scroll is the scroll container, not the window, so lazy
             loading has to measure against the ancestor that actually scrolls. */
          lazyLoadingForFullHeight
          enableScrollableContainerLazyLoading
          minimumHeight={620}
          /* The app shell already supplies a page title and chrome, so the
             Liveboard's own header and tab strip are redundant. activeTabId
             pins the tab, so hiding the strip loses nothing but tab switching
             — drop hideTabPanel to bring the strip back. */
          hideLiveboardHeader
          hideTabPanel
          onLoad={() => setLoading(false)}
          onLiveboardRendered={() => { setLoading(false); setError(null) }}
          onAuthExpire={() => {
            setLoading(false)
            setError('The ThoughtSpot session expired. Sign in to ThoughtSpot again, then reload this page.')
          }}
          onNoCookieAccess={() => {
            setLoading(false)
            setError('The browser is blocking third-party cookies for ThoughtSpot, so the embedded session cannot be established. Allow them for this site, or switch the embed to cookieless trusted authentication.')
          }}
          onError={(e) => {
            setLoading(false)
            setError(e?.data?.errorText || e?.errorText || 'ThoughtSpot reported an error loading the Liveboard. The frame below shows its response.')
          }}
        />
      </div>
    </div>
  )
}
