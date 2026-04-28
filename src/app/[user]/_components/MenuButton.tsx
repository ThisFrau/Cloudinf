'use client'

import { useState } from 'react'

export default function MenuButton({ menuUrl, buttonStyleClass }: { menuUrl: string, buttonStyleClass: string }) {
  const isImage = menuUrl.startsWith('data:image/') || menuUrl.match(/\.(jpeg|jpg|gif|png)$/i) != null
  const [showModal, setShowModal] = useState(false)

  if (!isImage) {
    return (
      <a href={menuUrl} target="_blank" rel="noopener noreferrer" className={`link-card business-card-highlighted ${buttonStyleClass}`}>
        <div className="link-icon business-menu-icon"><i className="fa-solid fa-utensils text-white"></i></div>
        <div className="link-text-group">
          <span className="link-text">Ver Menú Digital</span>
          <span className="link-subtext">Haz click para abrir externo</span>
        </div>
        <i className="fa-solid fa-arrow-up-right-from-square arrow-icon"></i>
      </a>
    )
  }

  return (
    <>
      <button 
        type="button" 
        onClick={() => setShowModal(true)} 
        className={`link-card business-card-highlighted w-full text-left flex justify-between items-center bg-transparent border-none menu-btn-button ${buttonStyleClass}`}
      >
        <div className="menu-btn-content">
          <div className="link-icon business-menu-icon"><i className="fa-solid fa-utensils text-white"></i></div>
          <div className="link-text-group no-margin">
            <span className="link-text no-margin">Ver Menú Digital</span>
            <span className="link-subtext">Haz click para ver la foto</span>
          </div>
        </div>
        <i className="fa-solid fa-image arrow-icon"></i>
      </button>

      {showModal && (
        <div 
          className="modal-overlay menu-modal-overlay" 
          onClick={() => setShowModal(false)}
        >
          <div 
            className="modal-content text-center menu-modal-content" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex-wrap-center justify-between mb-05rem px-05rem">
              <strong className="text-white">Menú</strong>
              <button type="button" className="btn-danger-sm" onClick={() => setShowModal(false)} title="Cerrar">
                <i className="fa-solid fa-xmark m-0"></i>
              </button>
            </div>
            <div className="menu-modal-body">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={menuUrl} 
                alt="Menú Digital" 
                className="menu-modal-image" 
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
