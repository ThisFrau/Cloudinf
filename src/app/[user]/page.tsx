import { prisma } from "@/lib/prisma";
import { cache } from "react";
import { notFound } from "next/navigation";
import { PLATFORMS } from "@/lib/constants";
import { getEffectivePlan, planShowsWatermark } from "@/lib/plans";
import type { Metadata } from 'next'
import BookingSection from "./_components/BookingSection";
import ContactForm from "./_components/ContactForm";
import LanguageSwitcher from "./_components/LanguageSwitcher";
import AvatarViewer from "./_components/AvatarViewer";
import CopyButton from "./_components/CopyButton";
import LocationCard from "./_components/LocationCard";
import MenuButton from "./_components/MenuButton";
import ViewTracker from "./_components/ViewTracker";
import OpenNowBadge from "./_components/OpenNowBadge";
import QuoteSection from "./_components/QuoteSection";

export async function generateMetadata(
  { params }: { params: Promise<{ user: string }> }
): Promise<Metadata> {
  const p = await params
  const username = decodeURIComponent(p.user).toLowerCase()
  const user = await getPublicUser(username)
  if (!user) return { title: 'Perfil No Encontrado' }
  return {
    title: user.seoTitle || user.name || user.username,
    description: user.seoDescription || user.bio || `Perfil oficial de ${user.username}`,
    openGraph: {
      title: user.seoTitle || user.name || user.username || '',
      description: user.seoDescription || user.bio || '',
      images: user.avatarUrl ? [user.avatarUrl] : [],
    },
  }
}

// Set para búsquedas O(1) en vez de O(n) por cada link
const SOCIAL_LOGOS = new Set([
  "whatsapp", "instagram", "tiktok", "youtube",
  "twitter", "linkedin", "telegram", "facebook",
  "github", "email", "spotify",
]);

// cache() deduplica la query: generateMetadata y PublicProfile
// comparten el mismo resultado sin hacer dos viajes a la BD.
const getPublicUser = cache(async (username: string) => {
  return prisma.user.findUnique({
    where: { username },
    include: {
      links: { orderBy: { order: 'asc' } },
      carouselPhotos: { orderBy: { order: 'asc' } },
      bookingConfig: true,
      businessConfig: true,
      campaign: true,
      teamMembers: { orderBy: { order: 'asc' } },
      quoteForm: true,
    },
    // plan fields needed for watermark + feature gates
  })
})

import React from 'react';

function sanitizeColor(color: string | null | undefined): string | null {
  if (!color) return null;
  if (/^#[0-9A-Fa-f]{3,8}$/.test(color)) return color;
  if (/^[a-zA-Z]{2,30}$/.test(color)) return color;
  return null;
}

function sanitizeCssDir(dir: string | null | undefined): string {
  if (!dir) return '135deg';
  if (/^\d{1,3}deg$/.test(dir)) return dir;
  if (/^to (right|left|top|bottom|top right|top left|bottom right|bottom left)$/.test(dir)) return dir;
  return '135deg';
}

function sanitizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return url;
  } catch {}
  return null;
}

export default async function PublicProfile({ params }: { params: Promise<{ user: string }> }) {
  const p = await params;
  const username = decodeURIComponent(p.user).toLowerCase();

  const user = await getPublicUser(username);

  if (!user) notFound();

  const logoLinks = user.links.filter((link) =>
    link.type !== 'header' && (
      link.displayStyle === 'icon' || (link.displayStyle === 'auto' && SOCIAL_LOGOS.includes(link.platform))
    )
  );
  const barLinks = user.links.filter((link) =>
    link.type === 'header' || link.displayStyle === 'rich' || link.displayStyle === 'button' ||
    (link.displayStyle === 'auto' && !SOCIAL_LOGOS.includes(link.platform))
  );

  const buttonStyleClass = (user.buttonStyle === 'liquid_glass' && user.themeColor) ? 'liquid-glass user-theme' : (user.buttonStyle === 'liquid_glass' ? 'liquid-glass' : '');

  // Campaign: active if enabled and not expired
  const now = new Date()
  const campaignActive = user.campaign?.enabled &&
    (!user.campaign.endsAt || new Date(user.campaign.endsAt) > now)

  // Status: active if not expired
  const statusActive = user.statusText &&
    (!user.statusExpiresAt || new Date(user.statusExpiresAt) > now)

  // Build Spotify embed URL
  let spotifyEmbedUrl = ''
  if (user.spotifyProfileUrl) {
    spotifyEmbedUrl = user.spotifyProfileUrl
      .replace('open.spotify.com/artist', 'open.spotify.com/embed/artist')
      .replace('open.spotify.com/playlist', 'open.spotify.com/embed/playlist')
      .replace('open.spotify.com/album', 'open.spotify.com/embed/album')
      .replace('open.spotify.com/track', 'open.spotify.com/embed/track')
  }

  // Cards layout: group links by header separators
  function groupLinksIntoCards(links: typeof barLinks) {
    const cards: { title: string; links: typeof barLinks }[] = []
    let current: { title: string; links: typeof barLinks } = { title: '', links: [] }
    for (const link of links) {
      if (link.type === 'header') {
        if (current.links.length > 0 || current.title) cards.push(current)
        current = { title: link.title, links: [] }
      } else {
        current.links.push(link)
      }
    }
    if (current.links.length > 0 || current.title) cards.push(current)
    return cards
  }

  const effectivePlan = getEffectivePlan({
    plan: user.plan,
    planExpiresAt: user.planExpiresAt,
    nfcProBonusUntil: user.nfcProBonusUntil,
  })
  const showWatermark = planShowsWatermark(effectivePlan)

  const safeBgColor = sanitizeColor(user.bgColor)
  const safeBgGradient1 = sanitizeColor(user.bgGradient1)
  const safeBgGradient2 = sanitizeColor(user.bgGradient2)
  const safeBgGradientDir = sanitizeCssDir(user.bgGradientDir)
  const safeBgImageUrl = sanitizeImageUrl(user.bgImageUrl)
  const safeThemeColor = sanitizeColor(user.themeColor)

  return (
    <>
      {/* ── Background System ── */}
      <style dangerouslySetInnerHTML={{
        __html: `.user-bg-layer-dynamic {
          ${user.bgType === 'solid' && safeBgColor ? `background-color: ${safeBgColor};` : ''}
          ${user.bgType === 'gradient' && safeBgGradient1 && safeBgGradient2 ? `background: linear-gradient(${safeBgGradientDir}, ${safeBgGradient1}, ${safeBgGradient2});` : ''}
          ${user.bgType === 'image' && safeBgImageUrl ? `background-image: url('${safeBgImageUrl}'); background-size: cover; background-position: center; filter: blur(3px) brightness(0.9); transform: scale(1.02);` : ''}
        }`
      }} />
      <div className="user-bg-layer user-bg-layer-dynamic" />
      <div className="user-bg-overlay" />

      {(user.buttonStyle === 'liquid_glass' && safeThemeColor) && (
        <style dangerouslySetInnerHTML={{ __html: `.user-theme { --custom-theme-color: ${safeThemeColor}; --custom-glow-color: ${safeThemeColor}66; }` }} />
      )}

      <main className="container public-container">

        {/* ── Modo Campaña ── */}
        {campaignActive && user.campaign && (
          <div className="campaign-banner">
            {user.campaign.bannerUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.campaign.bannerUrl} alt="Campaña" className="campaign-banner-img" loading="lazy" />
            )}
            <div className="campaign-banner-content">
              {user.campaign.title && <h3 className="campaign-banner-title">{user.campaign.title}</h3>}
              {user.campaign.message && <p className="campaign-banner-msg">{user.campaign.message}</p>}
              {user.campaign.ctaLabel && user.campaign.ctaUrl && (
                <a href={user.campaign.ctaUrl} target="_blank" rel="noopener noreferrer" className="campaign-banner-cta">
                  {user.campaign.ctaLabel} <i className="fa-solid fa-arrow-right"></i>
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── Header / Profile ── */}
        <header className={`profile-section ${user.bannerUrl ? 'has-banner' : ''}`}>
          <LanguageSwitcher />

          {user.bannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.bannerUrl} alt="Banner de perfil" className="profile-banner-img" loading="eager" />
          )}

          <div className={`profile-header-content profile-align-${user.avatarAlign || 'center'}`}>
            <AvatarViewer
              src={user.avatarUrl || user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=random&color=fff&size=200`}
              alt="Perfil"
            />
            <div className="profile-text-content">
              <h1 className="name">{user.name || user.username}</h1>
              <p className="bio">{user.bio || "¡Este usuario no ha escrito una biografía!"}</p>

              {/* Estado temporal */}
              {statusActive && (
                <div className="status-badge">
                  <span className="status-emoji">{user.statusEmoji || '💬'}</span>
                  <span className="status-text">{user.statusText}</span>
                </div>
              )}

              {/* Fuera de horario */}
              {user.outOfOfficeEnabled && (
                <div className="out-of-office-badge">
                  <i className="fa-solid fa-moon"></i>
                  <span>{user.outOfOfficeMsg || 'Fuera de horario'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Social icons row */}
          {logoLinks.length > 0 && (
            <div className={`social-icons mt-1rem flex-wrap-center ${user.avatarAlign !== 'center' ? 'justify-start' : ''}`}>
              {logoLinks.map((link) => {
                const platform = PLATFORMS[link.platform] || PLATFORMS.other;
                return (
                  <a key={link.id} href={`/api/click/${link.id}`} target="_blank" rel="noopener noreferrer"
                    className={`icon-link icon-shape-${user.socialIconShape || 'rounded'} icon-width-${user.socialIconWidth || 'normal'} ${buttonStyleClass}`} data-platform={link.platform} title={link.title}>
                    <i className={platform.icon}></i>
                  </a>
                );
              })}
            </div>
          )}

          {/* Spotify embed */}
          {spotifyEmbedUrl && (
            <div className="spotify-embed mt-1rem">
              <iframe
                title="Spotify Embebido"
                src={spotifyEmbedUrl} width="100%" height="152" frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy" className="rounded-12px"
              ></iframe>
            </div>
          )}
        </header>

        {/* ── Business Profile Layer ── */}
        {user.businessConfig?.enabled && (
          <section className="business-profile-cards">
            {user.businessConfig.menuUrl && (
              <MenuButton 
                menuUrl={user.businessConfig.menuUrl} 
                buttonStyleClass={buttonStyleClass} 
              />
            )}

            <div className="business-details-grid">
              {user.businessConfig.hours && (
                <div className={`business-info-card wifi-card ${buttonStyleClass}`}>
                  <i className="fa-solid fa-clock text-portfolio wifi-card-icon"></i>
                  <div className="info-text wifi-info">
                    <div className="wifi-title-row">
                      <strong className="wifi-title">Horarios de Atención</strong>
                      <OpenNowBadge hoursText={user.businessConfig.hours} />
                    </div>
                    <div className="hours-list">
                      {user.businessConfig.hours.split('\n').map((line: string, i: number) => {
                        const parts = line.split(/:\s(.+)/); // Split only on first colon with space
                        if (parts.length > 1 && line.includes(' a ')) {
                          return (
                            <div key={i} className="hours-row">
                              <span className="hours-day">{parts[0]}</span>
                              <span className="hours-time">{parts[1]}</span>
                            </div>
                          );
                        }
                        return <p key={i} className="pre-line hours-text-fallback">{line}</p>;
                      })}
                    </div>
                  </div>
                </div>
              )}
              {user.businessConfig.address && (
                <LocationCard
                  address={user.businessConfig.address}
                  mapsUrl={user.businessConfig.mapsUrl}
                  buttonStyleClass={buttonStyleClass}
                />
              )}
              {user.businessConfig.wifiName && (
                <div className={`business-info-card wifi-card ${buttonStyleClass}`}>
                  <i className="fa-solid fa-wifi business-wifi-icon wifi-card-icon"></i>
                  <div className="info-text wifi-info">
                    <strong className="wifi-title">Wi-Fi Gratis</strong>
                    <div className="wifi-row">
                      <span className="wifi-label">Red</span>
                      <span className="wifi-value">{user.businessConfig.wifiName}</span>
                    </div>
                    {user.businessConfig.wifiPassword && (
                      <div className="wifi-row wifi-password-row">
                        <span className="wifi-label">Contraseña</span>
                        <span className="wifi-value wifi-password">{user.businessConfig.wifiPassword}</span>
                        <CopyButton textToCopy={user.businessConfig.wifiPassword} className="copy-btn copy-wifi-inline" />
                      </div>
                    )}
                    {!user.businessConfig.wifiPassword && (
                      <CopyButton textToCopy={user.businessConfig.wifiName} className="copy-btn copy-wifi-inline" />
                    )}
                  </div>
                </div>
              )}
              {user.businessConfig.reservationsUrl && (
                <a href={user.businessConfig.reservationsUrl} target="_blank" rel="noopener noreferrer" className={`business-info-card clickable ${buttonStyleClass}`}>
                  <i className="fa-solid fa-bell-concierge text-instagram"></i>
                  <div className="info-text">
                    <strong>Reservas</strong>
                    <p>Haz tu reserva online</p>
                  </div>
                </a>
              )}
            </div>
          </section>
        )}

        {/* ── Links Section ── */}
        {user.layoutStyle === 'cards' ? (
          <div className="cards-swiper">
            {groupLinksIntoCards(barLinks).map((card, i) => (
              <div key={i} className="swipe-card">
                {card.title && <h3 className="swipe-card-title">{card.title}</h3>}
                <div className="swipe-card-links">
                  {card.links.map(link => {
                    const platform = PLATFORMS[link.platform] || PLATFORMS.other;
                    
                    if (link.platform === 'email') {
                      const emailStr = link.url.replace('mailto:', '').split('?')[0];
                      return (
                        <div key={link.id} className={`link-card email-link-card ${buttonStyleClass}`} data-platform={link.platform}>
                          <div className="email-link-main email-selectable">
                            <div className="link-icon" data-platform={link.platform}><i className={platform.icon}></i></div>
                            <span className="link-text email-text">{emailStr}</span>
                          </div>
                          <div className="email-actions-row">
                            <a href={`/api/click/${link.id}`} target="_blank" rel="noopener noreferrer" className="copy-btn" title="Escribir correo">
                              <i className="fa-solid fa-paper-plane m-0"></i>
                            </a>
                            <CopyButton textToCopy={emailStr} />
                          </div>
                        </div>
                      )
                    }

                    return (
                      <a key={link.id} href={`/api/click/${link.id}`} target="_blank" rel="noopener noreferrer"
                        className={`link-card ${buttonStyleClass}`} data-platform={link.platform}>
                        <div className="link-icon" data-platform={link.customImage ? undefined : link.platform}>
                          {link.customImage
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={link.customImage} alt={link.title} className="link-custom-img" loading="lazy" />
                            : <i className={platform.icon}></i>
                          }
                        </div>
                        <span className="link-text">{link.title}</span>
                        <i className="fa-solid fa-chevron-right arrow-icon"></i>
                      </a>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <section className={`links-section ${user.layoutStyle === 'bento' ? 'bento-grid' : ''}`}>
            {user.links.length === 0 ? (
              <p className="bio text-center">Aún no hay enlaces publicados por {user.name}.</p>
            ) : barLinks.length === 0 && logoLinks.length > 0 ? null : (
              barLinks.map((link) => {
                const platform = PLATFORMS[link.platform] || PLATFORMS.other;

                if (link.type === 'header') {
                  return <h3 key={link.id} className="link-header-separator">{link.title}</h3>
                }

                if (link.displayStyle === 'rich') {
                  if (link.url.includes("youtube.com") || link.url.includes("youtu.be")) {
                    let videoId = link.url.split('v=')[1] || link.url.split('youtu.be/')[1] || '';
                    const amp = videoId.indexOf('&');
                    if (amp !== -1) videoId = videoId.substring(0, amp);
                    return (
                      <div key={link.id} className="rich-link-card">
                        <iframe width="100%" height="200" src={`https://www.youtube.com/embed/${videoId}`}
                          title={link.title} frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen>
                        </iframe>
                      </div>
                    );
                  }
                  if (link.url.includes("spotify.com")) {
                    const sUrl = link.url.replace('/track/', '/embed/track/').replace('/playlist/', '/embed/playlist/').replace('/album/', '/embed/album/');
                    return (
                      <div key={link.id} className="rich-link-card">
                        <iframe title="Spotify Link" src={sUrl} width="100%" height="152" frameBorder="0"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy">
                        </iframe>
                      </div>
                    );
                  }
                }

                if (link.platform === 'email') {
                  const emailStr = link.url.replace('mailto:', '').split('?')[0];
                  return (
                    <div key={link.id} className={`link-card email-link-card ${buttonStyleClass}`} data-platform={link.platform}>
                      <div className="email-link-main email-selectable">
                        <div className="link-icon" data-platform={link.platform}><i className={platform.icon}></i></div>
                        <span className="link-text email-text">{emailStr}</span>
                      </div>
                      <div className="email-actions-row">
                        <a href={`/api/click/${link.id}`} target="_blank" rel="noopener noreferrer" className="copy-btn" title="Escribir correo">
                          <i className="fa-solid fa-paper-plane m-0"></i>
                        </a>
                        <CopyButton textToCopy={emailStr} />
                      </div>
                    </div>
                  );
                }

                return (
                  <a key={link.id} href={`/api/click/${link.id}`} target="_blank" rel="noopener noreferrer"
                    className={`link-card ${buttonStyleClass}`} data-platform={link.platform}>
                    <div className="link-icon" data-platform={link.customImage ? undefined : link.platform}>
                      {link.customImage
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={link.customImage} alt={link.title} className="link-custom-img" loading="lazy" />
                        : <i className={platform.icon}></i>
                      }
                    </div>
                    <span className="link-text">{link.title}</span>
                    <i className="fa-solid fa-chevron-right arrow-icon"></i>
                  </a>
                );
              })
            )}
          </section>
        )}

        {/* ── PDF Descargable ── */}
        {user.pdfCatalogUrl && (
          <section className="links-section">
            <a href={user.pdfCatalogUrl} target="_blank" rel="noopener noreferrer"
              className={`link-card ${buttonStyleClass}`} data-platform="other">
              <div className="link-icon"><i className="fa-solid fa-file-pdf"></i></div>
              <span className="link-text">{user.pdfCatalogLabel || 'Descargar Catálogo'}</span>
              <i className="fa-solid fa-download arrow-icon"></i>
            </a>
          </section>
        )}

        {/* ── AFIP / Facturación ── */}
        {user.cuit && (
          <section className="links-section">
            <div className={`business-info-card wifi-card ${buttonStyleClass}`}>
              <i className="fa-solid fa-file-invoice wifi-card-icon icon-afip"></i>
              <div className="info-text wifi-info">
                <strong className="wifi-title">Facturación</strong>
                <div className="wifi-row">
                  <span className="wifi-label">CUIT</span>
                  <span className="wifi-value">{user.cuit}</span>
                  <CopyButton textToCopy={user.cuit} className="copy-btn copy-wifi-inline" />
                </div>
                {user.afipUrl && (
                  <a href={user.afipUrl} target="_blank" rel="noopener noreferrer" className="afip-link">
                    Pedir factura online →
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Instagram Feed ── */}
        {user.instagramHandle && user.instagramFeedEnabled && (
          <section className="links-section">
            <a
              href={`https://www.instagram.com/${user.instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`link-card ${buttonStyleClass}`}
              data-platform="instagram"
            >
              <div className="link-icon" data-platform="instagram">
                <i className="fa-brands fa-instagram"></i>
              </div>
              <div className="instagram-link-info">
                <span className="link-text">@{user.instagramHandle}</span>
                <small className="bio instagram-link-subtitle">Ver perfil en Instagram</small>
              </div>
              <i className="fa-solid fa-arrow-up-right-from-square arrow-icon"></i>
            </a>
          </section>
        )}

        {/* ── Booking Section ── */}
        {user.bookingConfig?.enabled && (
          <BookingSection username={username} title={user.bookingConfig.title} />
        )}

        {/* ── Formulario de Presupuesto ── */}
        {user.quoteForm?.enabled && (
          <section className="links-section">
            <QuoteSection
              username={username}
              title={user.quoteForm.title}
              description={user.quoteForm.description}
              fields={(() => { try { return JSON.parse(user.quoteForm!.fields) } catch { return [] } })()}
            />
          </section>
        )}

        {/* ── Contact Form ── */}
        {user.contactFormEnabled && (
          <ContactForm
            username={username}
            askName={user.contactFormAskName}
            askEmail={user.contactFormAskEmail}
            askPhone={user.contactFormAskPhone}
            askMessage={user.contactFormAskMessage}
          />
        )}

        {/* ── Equipo ── */}
        {user.teamEnabled && user.teamMembers.length > 0 && (
          <section className="links-section">
            <h3 className="link-header-separator">Nuestro Equipo</h3>
            <div className="team-grid">
              {user.teamMembers.map(m => (
                <div key={m.id} className={`team-member-card ${buttonStyleClass}`}>
                  {m.avatarUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={m.avatarUrl} alt={m.name} className="team-member-avatar" loading="lazy" />
                    : <div className="team-member-avatar-placeholder"><i className="fa-solid fa-user"></i></div>
                  }
                  <div className="team-member-info">
                    <strong className="team-member-name">{m.name}</strong>
                    {m.role && <span className="team-member-role">{m.role}</span>}
                  </div>
                  {m.profileUrl && (
                    <a href={m.profileUrl} target="_blank" rel="noopener noreferrer" className="team-member-link" title="Ver perfil">
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="public-footer">
          {showWatermark ? (
            <a href="/" className="watermark-link" title="Crear mi perfil gratis en Cloudinf">
              <span className="watermark-badge">
                <i className="fa-solid fa-bolt"></i>
                Creado con <strong>Cloudinf</strong> — ¡Gratis!
              </span>
            </a>
          ) : (
            <p>&copy; {new Date().getFullYear()} Creado con <strong>Cloudinf</strong>.</p>
          )}
        </footer>
      </main>

      <ViewTracker username={username} />


    </>
  );
}
