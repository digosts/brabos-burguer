/**
 * Ícones em SVG inline — evita uma biblioteca só para isso e mantém
 * o bundle pequeno. Todos herdam a cor do texto (currentColor).
 */

const base = (size) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
})

export const IconHome = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h3.5v-5.5h5V21H18a1 1 0 0 0 1-1V9.5" />
  </svg>
)

export const IconReceipt = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3Z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </svg>
)

export const IconUser = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20.5c1.3-3.7 4.1-5.5 7.5-5.5s6.2 1.8 7.5 5.5" />
  </svg>
)

export const IconCart = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M3 4h2.2l2.3 11.2a2 2 0 0 0 2 1.6h8.1a2 2 0 0 0 2-1.5L21 8H6" />
    <circle cx="10" cy="20" r="1.3" />
    <circle cx="17.5" cy="20" r="1.3" />
  </svg>
)

export const IconPlus = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconMinus = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M5 12h14" />
  </svg>
)

export const IconTrash = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M4 7h16M9.5 7V5h5v2M6 7l1 13h10l1-13" />
    <path d="M10.5 11v5.5M13.5 11v5.5" />
  </svg>
)

export const IconX = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const IconChevronLeft = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M14.5 5 8 12l6.5 7" />
  </svg>
)

export const IconChevronRight = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M9.5 5 16 12l-6.5 7" />
  </svg>
)

export const IconSearch = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <circle cx="10.8" cy="10.8" r="6.3" />
    <path d="m15.5 15.5 4 4" />
  </svg>
)

export const IconEye = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
)

export const IconEyeOff = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M4 4l16 16" />
    <path d="M9.6 5.9A9.6 9.6 0 0 1 12 5.8c6 0 9.5 6.2 9.5 6.2a17 17 0 0 1-2.6 3.4" />
    <path d="M6.7 7.9A16.6 16.6 0 0 0 2.5 12S6 18.2 12 18.2c1.4 0 2.6-.3 3.7-.8" />
    <path d="M9.9 10a2.8 2.8 0 0 0 3.9 3.9" />
  </svg>
)

export const IconMail = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="m4 7.5 8 5.5 8-5.5" />
  </svg>
)

export const IconLock = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5" />
  </svg>
)

export const IconPhone = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
    <path d="M10.8 18.6h2.4" />
  </svg>
)

export const IconMapPin = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M12 21.5s7-5.8 7-11a7 7 0 1 0-14 0c0 5.2 7 11 7 11Z" />
    <circle cx="12" cy="10.2" r="2.6" />
  </svg>
)

export const IconNote = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M5 3.5h14v17H5z" />
    <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" />
  </svg>
)

export const IconCard = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
    <path d="M2.5 10h19M6 14.5h3.5" />
  </svg>
)

/** Logo do PIX estilizado (losango vazado). */
export const IconPix = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3.2 20.8 12 12 20.8 3.2 12 12 3.2Z" />
    <path d="M8.4 8.4 12 12l3.6-3.6M8.4 15.6 12 12l3.6 3.6" />
  </svg>
)

export const IconWhatsApp = ({ size = 20, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.94.55 3.75 1.5 5.28L2 22.5l5.53-1.63a9.87 9.87 0 0 0 4.51 1.1c5.44 0 9.84-4.4 9.84-9.85C21.88 6.4 17.48 2 12.04 2Zm5.75 13.87c-.24.68-1.4 1.32-1.93 1.36-.53.05-1.02.24-3.45-.8-2.93-1.26-4.76-4.35-4.9-4.55-.15-.2-1.17-1.6-1.13-3.02.04-1.42.8-2.1 1.08-2.38.27-.29.58-.34.78-.33.24 0 .48 0 .68.01.22.01.5-.07.77.6.26.68.9 2.32.98 2.49.08.17.13.36.02.57-.1.2-.2.33-.39.53-.2.2-.3.29-.43.5-.14.2-.27.42-.09.7.19.29.83 1.36 1.79 2.21 1.23 1.09 2.16 1.35 2.47 1.5.3.15.5.13.7-.07.2-.2.79-.87 1-1.17.2-.3.4-.24.68-.13.27.11 1.72.86 2.01 1.01.3.15.5.22.57.34.07.12.05.7-.19 1.38Z" />
  </svg>
)

export const IconDownload = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5" />
    <path d="M4.5 17.5v1.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-1.5" />
  </svg>
)

/** Ícone "Compartilhar" do iOS — usado nas instruções de instalação. */
export const IconShareIos = ({ size = 18, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3.5v10" />
    <path d="M8.5 7 12 3.5 15.5 7" />
    <path d="M6.5 11.5H5.5a1.5 1.5 0 0 0-1.5 1.5v6.5a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5V13a1.5 1.5 0 0 0-1.5-1.5h-1" />
  </svg>
)

export const IconMore = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <circle cx="6" cy="12" r="1.3" />
    <circle cx="12" cy="12" r="1.3" />
    <circle cx="18" cy="12" r="1.3" />
  </svg>
)

export const IconCheck = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
)

export const IconCheckCircle = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.2 12.4 2.6 2.6 5-5.4" />
  </svg>
)

export const IconAlert = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.8v5M12 16.2h.01" />
  </svg>
)

export const IconInfo = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.2M12 7.9h.01" />
  </svg>
)

export const IconClock = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 2" />
  </svg>
)

export const IconFlame = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M12 2.5s4.5 3.8 4.5 8a4.5 4.5 0 0 1-9 0c0-1.5.7-2.7 1.4-3.6" />
    <path d="M8.2 12.5A5.8 5.8 0 0 0 12 21.5a5.8 5.8 0 0 0 3.8-9" />
  </svg>
)

export const IconTruck = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M2.5 6.5h11v10h-11z" />
    <path d="M13.5 10h4l3 3v3.5h-7" />
    <circle cx="7" cy="18" r="1.6" />
    <circle cx="17" cy="18" r="1.6" />
  </svg>
)

export const IconBag = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M4.5 7.5h15l-1.2 12.5a1.5 1.5 0 0 1-1.5 1.4H7.2a1.5 1.5 0 0 1-1.5-1.4L4.5 7.5Z" />
    <path d="M9 7.5V6a3 3 0 0 1 6 0v1.5" />
  </svg>
)

export const IconLogout = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M14.5 4.5H18a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-3.5" />
    <path d="M10 8.5 6.5 12l3.5 3.5M6.5 12h8" />
  </svg>
)

export const IconEdit = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M4.5 19.5h15" />
    <path d="M6 16.5V13L15.5 3.5l3 3L9 16.5H6Z" />
  </svg>
)

export const IconCalendar = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
  </svg>
)

export const IconRefresh = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M21.5 4v6h-6" />
    <path d="M2.5 20v-6h6" />
    <path d="M4.6 9a8 8 0 0 1 13.2-3l3.7 4M2.5 14l3.7 4a8 8 0 0 0 13.2-3" />
  </svg>
)

export const IconWifiOff = ({ size = 20, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M3 4l18 18" />
    <path d="M8.4 12.6a5.5 5.5 0 0 1 3-1.5M4.2 9a11 11 0 0 1 4-2.4M19.8 9a11 11 0 0 0-6.6-2.9" />
    <path d="M12 18.5h.01" />
  </svg>
)
