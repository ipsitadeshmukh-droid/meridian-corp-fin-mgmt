/* One stroke-consistent icon set. 1.6px strokes on a 24 grid, rendered at 18px
   by default so they optically match 13–14px label text. */
const S = ({ size = 18, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" {...rest}>{children}</svg>
)

export const IconOverview = (p) => <S {...p}><rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/></S>
export const IconClients = (p) => <S {...p}><path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20"/><circle cx="9" cy="7" r="3.2"/><path d="M22 20v-1.5a4 4 0 0 0-3-3.87"/><path d="M16.5 4.1a3.2 3.2 0 0 1 0 5.8"/></S>
export const IconCash = (p) => <S {...p}><rect x="2.5" y="5" width="19" height="14" rx="2.4"/><path d="M2.5 10h19"/><path d="M6 15h3"/></S>
export const IconCredit = (p) => <S {...p}><path d="M3 9.5 12 4l9 5.5"/><path d="M5 10v8M9.7 10v8M14.3 10v8M19 10v8"/><path d="M3 20.5h18"/></S>
export const IconRisk = (p) => <S {...p}><path d="M12 3 4.5 6v6c0 4.3 3 8.2 7.5 9.4C16.5 20.2 19.5 16.3 19.5 12V6L12 3Z"/><path d="M12 9v4"/><path d="M12 16.2h.01"/></S>
export const IconTreasury = (p) => <S {...p}><path d="M12 3c3.4 3.6 5.5 6.4 5.5 9.2A5.5 5.5 0 0 1 12 17.8a5.5 5.5 0 0 1-5.5-5.6C6.5 9.4 8.6 6.6 12 3Z"/><path d="M4 21h16"/></S>
export const IconReports = (p) => <S {...p}><path d="M3 20h18"/><path d="M6 20v-6"/><path d="M11 20V7"/><path d="M16 20v-9"/><path d="M21 20V4"/></S>
export const IconAdmin = (p) => <S {...p}><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h9M17 18h3"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="15" cy="18" r="2"/></S>
export const IconSearch = (p) => <S {...p}><circle cx="11" cy="11" r="6.6"/><path d="m16 16 4.5 4.5"/></S>
export const IconBell = (p) => <S {...p}><path d="M18 9a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16S18 14 18 9Z"/><path d="M13.7 19a2 2 0 0 1-3.4 0"/></S>
export const IconSun = (p) => <S {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></S>
export const IconMoon = (p) => <S {...p}><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></S>
export const IconChevronRight = (p) => <S {...p}><path d="m9 5 7 7-7 7"/></S>
export const IconChevronLeft = (p) => <S {...p}><path d="m15 5-7 7 7 7"/></S>
export const IconChevronDown = (p) => <S {...p}><path d="m5 9 7 7 7-7"/></S>
export const IconArrowUp = (p) => <S {...p}><path d="M12 19V5"/><path d="m5.5 11.5 6.5-6.5 6.5 6.5"/></S>
export const IconArrowDown = (p) => <S {...p}><path d="M12 5v14"/><path d="m5.5 12.5 6.5 6.5 6.5-6.5"/></S>
export const IconArrowRight = (p) => <S {...p}><path d="M5 12h14"/><path d="m12.5 5.5 6.5 6.5-6.5 6.5"/></S>
export const IconPlus = (p) => <S {...p}><path d="M12 5v14M5 12h14"/></S>
export const IconDownload = (p) => <S {...p}><path d="M12 3v11"/><path d="m7.5 10 4.5 4 4.5-4"/><path d="M4 20h16"/></S>
export const IconGear = (p) => <S {...p}><circle cx="12" cy="12" r="3.1"/><path d="M19.4 14.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-2.95-1.15l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 3.1 14h-.1a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.16-2.95l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.95 1.16l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 20.9 10h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 .5Z"/></S>
export const IconCheck = (p) => <S {...p}><path d="m4.5 12.5 5 5 10-11"/></S>
export const IconX = (p) => <S {...p}><path d="M6 6l12 12M18 6 6 18"/></S>
export const IconAlert = (p) => <S {...p}><path d="M10.3 3.9 2.6 17.1A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4.2"/><path d="M12 17h.01"/></S>
export const IconInfo = (p) => <S {...p}><circle cx="12" cy="12" r="8.6"/><path d="M12 11.2V16"/><path d="M12 8h.01"/></S>
export const IconFlag = (p) => <S {...p}><path d="M5 21V4"/><path d="M5 5h11l-2 3.5L16 12H5"/></S>
export const IconNote = (p) => <S {...p}><path d="M5 3.5h9.5L19 8v12.5H5z"/><path d="M14 3.5V8h5"/><path d="M8.5 13h7M8.5 16.5h4.5"/></S>
export const IconMore = (p) => <S {...p}><circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/></S>
export const IconHelp = (p) => <S {...p}><circle cx="12" cy="12" r="8.6"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.5"/><path d="M12 17h.01"/></S>
export const IconBook = (p) => <S {...p}><path d="M4 4.8A1.8 1.8 0 0 1 5.8 3H19v15.5H5.8A1.8 1.8 0 0 0 4 20.3z"/><path d="M4 18.5A1.8 1.8 0 0 1 5.8 16.7H19V21H5.8A1.8 1.8 0 0 1 4 19.2Z"/></S>
export const IconLogout = (p) => <S {...p}><path d="M9.5 20H5.5A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4h4"/><path d="M15 16.5 19.5 12 15 7.5"/><path d="M19 12H9.5"/></S>
export const IconExternal = (p) => <S {...p}><path d="M13.5 4H20v6.5"/><path d="M20 4l-8 8"/><path d="M18 14v5.5A1.5 1.5 0 0 1 16.5 21h-11A1.5 1.5 0 0 1 4 19.5v-11A1.5 1.5 0 0 1 5.5 7H11"/></S>
export const IconSortAsc = (p) => <S {...p}><path d="M12 18V6"/><path d="m7 11 5-5 5 5"/></S>
export const IconSortDesc = (p) => <S {...p}><path d="M12 6v12"/><path d="m7 13 5 5 5-5"/></S>
export const IconSortNone = (p) => <S {...p}><path d="m8 10 4-4 4 4"/><path d="m8 14 4 4 4-4"/></S>
export const IconCalendar = (p) => <S {...p}><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></S>
export const IconBuilding = (p) => <S {...p}><path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h7A1.5 1.5 0 0 1 14 5.5V21"/><path d="M14 10h4.5A1.5 1.5 0 0 1 20 11.5V21"/><path d="M3 21h18"/><path d="M7 8h4M7 12h4M7 16h4M17 14h0M17 17.5h0"/></S>
export const IconWatch = (p) => <S {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/></S>
