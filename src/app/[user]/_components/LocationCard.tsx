'use client'

import { useState } from 'react'

interface Props {
  address: string
  mapsUrl?: string | null
  buttonStyleClass?: string
}

/**
 * Builds an embeddable Google Maps iframe src from an address or a maps URL.
 * Uses the free Maps embed API (no key needed for basic iframe embeds).
 */
function buildEmbedUrl(address: string, mapsUrl?: string | null): string {
  // If there's a mapsUrl that already is a Google Maps link, try to extract place info
  // Otherwise just use address search
  const query = encodeURIComponent(address)
  return `https://maps.google.com/maps?q=${query}&output=embed&z=15&hl=es`
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
        aria-expanded={open ? 'true' : 'false'}
        aria-label="Ver ubicación en mapa"
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
              height="200"
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
