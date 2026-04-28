'use client'

import { useState } from 'react'

interface Props {
  address: string
  mapsUrl?: string | null
  buttonStyleClass?: string
}

/**
 * Builds an embeddable Google Maps iframe src.
 * Prefers extracting a query from a provided mapsUrl; falls back to address.
 * Requires frame-src to include https://maps.google.com in CSP.
 */
function buildEmbedUrl(address: string, mapsUrl?: string | null): string {
  // If the user saved a Google Maps URL try to reuse its query string
  if (mapsUrl) {
    try {
      const url = new URL(mapsUrl)
      const q = url.searchParams.get('q')
      if (q) {
        return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed&z=15&hl=es`
      }
    } catch {
      // fall through to address-based embed
    }
  }
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed&z=15&hl=es`
}

export default function LocationCard({ address, mapsUrl, buttonStyleClass = '' }: Props) {
  const [open, setOpen] = useState(false)
  const embedUrl = buildEmbedUrl(address, mapsUrl)

  return (
    <div className={`business-info-card location-card ${buttonStyleClass}`}>
      {/* Header row — always visible */}
      <button
        type="button"
        className="location-card-header"
        onClick={() => setOpen(o => !o)}
        aria-label="Desplegar o cerrar ubicación en mapa"
      >
        <i className="fa-solid fa-map-location-dot text-twitter location-card-icon" />
        <div className="location-card-summary">
          <strong>Ubicación</strong>
          <p>{address}</p>
        </div>
        <i className={`fa-solid fa-chevron-down location-card-chevron ${open ? 'rotated' : ''}`} />
      </button>

      {/* Collapsible body */}
      <div className={`location-card-body ${open ? 'open' : ''}`}>
        <div>
          <div className="location-map-wrapper">
            <iframe
              title="Mapa de ubicación"
              src={embedUrl}
              width="100%"
              height="220"
              className="location-map-iframe"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="location-directions-btn"
            >
              <i className="fa-solid fa-location-arrow" />
              Cómo llegar
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
