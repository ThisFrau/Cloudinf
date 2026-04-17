'use client'

import { useState } from 'react'

export default function AvatarViewer({ src, alt }: { src: string; alt: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div 
        className="avatar-wrapper cursor-pointer" 
        onClick={() => setIsOpen(true)}
        title="Ver foto"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="avatar" />
        <div className="status-indicator"></div>
      </div>

      {isOpen && (
        <div 
          className="modal-overlay avatar-viewer-overlay" 
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="modal-content avatar-viewer-content" 
            onClick={(e) => e.stopPropagation()} 
          >
            <button 
              type="button"
              title="Cerrar vista"
              onClick={() => setIsOpen(false)}
              className="btn-danger text-sm avatar-viewer-close"
            >
              <i className="fa-solid fa-times"></i>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={src} 
              alt={alt} 
              className="avatar-viewer-img" 
            />
          </div>
        </div>
      )}
    </>
  )
}
