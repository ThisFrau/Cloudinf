'use client'

import { useState } from 'react'

export default function AvatarViewer({ src, alt }: { src: string; alt: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div 
        className="avatar-wrapper" 
        onClick={() => setIsOpen(true)}
        style={{ cursor: 'pointer' }}
        title="Ver foto"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="avatar" />
        <div className="status-indicator"></div>
      </div>

      {isOpen && (
        <div 
          className="modal-overlay" 
          onClick={() => setIsOpen(false)}
          style={{ zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)' }}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ padding: 0, background: 'transparent', maxWidth: '90vw', maxHeight: '90vh', position: 'relative' }}
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="btn-danger text-sm"
              style={{ position: 'absolute', top: '-40px', right: '0', borderRadius: '50%', width: '32px', height: '32px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              <i className="fa-solid fa-times"></i>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={src} 
              alt={alt} 
              style={{ width: '100%', height: 'auto', maxHeight: '85vh', objectFit: 'contain', borderRadius: '12px' }} 
            />
          </div>
        </div>
      )}
    </>
  )
}
