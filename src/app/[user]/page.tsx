import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PLATFORMS } from "@/lib/constants";
import type { Metadata } from 'next'
import BookingSection from "./_components/BookingSection";
import ContactForm from "./_components/ContactForm";
import LanguageSwitcher from "./_components/LanguageSwitcher";
import VCardButton from "./_components/VCardButton";

export async function generateMetadata(
  { params }: { params: Promise<{ user: string }> }
): Promise<Metadata> {
  const p = await params
  const username = decodeURIComponent(p.user).toLowerCase()
  const user = await prisma.user.findUnique({ where: { username } })
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

const SOCIAL_LOGOS = [
  "whatsapp", "instagram", "tiktok", "youtube",
  "twitter", "linkedin", "telegram", "facebook",
  "github", "email", "spotify"
];

import React from 'react';

function buildBackground(user: { bgType: string; bgColor: string | null; bgGradient1: string | null; bgGradient2: string | null; bgGradientDir: string | null; bgImageUrl: string | null }): React.CSSProperties {
  if (user.bgType === 'solid' && user.bgColor) return { backgroundColor: user.bgColor };
  if (user.bgType === 'gradient' && user.bgGradient1 && user.bgGradient2)
    return { background: `linear-gradient(${user.bgGradientDir || '135deg'}, ${user.bgGradient1}, ${user.bgGradient2})` };
  if (user.bgType === 'image' && user.bgImageUrl)
    return { backgroundImage: `url('${user.bgImageUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(3px) brightness(0.9)', transform: 'scale(1.02)' };
  return {};
}

export default async function PublicProfile({ params }: { params: Promise<{ user: string }> }) {
  const p = await params;
  const username = decodeURIComponent(p.user).toLowerCase();

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      links: { orderBy: { order: 'asc' } },
      carouselPhotos: { orderBy: { order: 'asc' } },
      bookingConfig: true,
    }
  });

  if (!user) notFound();

  const logoLinks = user.links.filter(link =>
    link.type !== 'header' && (
      link.displayStyle === 'icon' || (link.displayStyle === 'auto' && SOCIAL_LOGOS.includes(link.platform))
    )
  );
  const barLinks = user.links.filter(link =>
    link.type === 'header' || link.displayStyle === 'rich' || link.displayStyle === 'button' ||
    (link.displayStyle === 'auto' && !SOCIAL_LOGOS.includes(link.platform))
  );

  const buttonStyleClass = (user.buttonStyle === 'liquid_glass' && user.themeColor) ? 'liquid-glass user-theme' : (user.buttonStyle === 'liquid_glass' ? 'liquid-glass' : '');
  const bgStyle = buildBackground(user);

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

  return (
    <>
      {/* ── Background System ── */}
      <style dangerouslySetInnerHTML={{
        __html: `.user-bg-layer-dynamic {
          ${user.bgType === 'solid' && user.bgColor ? `background-color: ${user.bgColor};` : ''}
          ${user.bgType === 'gradient' && user.bgGradient1 && user.bgGradient2 ? `background: linear-gradient(${user.bgGradientDir || '135deg'}, ${user.bgGradient1}, ${user.bgGradient2});` : ''}
          ${user.bgType === 'image' && user.bgImageUrl ? `background-image: url('${user.bgImageUrl}'); background-size: cover; background-position: center; filter: blur(3px) brightness(0.9); transform: scale(1.02);` : ''}
        }`
      }} />
      <div className="user-bg-layer user-bg-layer-dynamic" />
      <div className="user-bg-overlay" />

      {(user.buttonStyle === 'liquid_glass' && user.themeColor) && (
        <style dangerouslySetInnerHTML={{ __html: `.user-theme { --custom-theme-color: ${user.themeColor}; --custom-glow-color: ${user.themeColor}66; }` }} />
      )}

      <main className="container public-container">
        {/* ── Header / Profile ── */}
        <header className="profile-section">
          <LanguageSwitcher />

          <div className="avatar-wrapper">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatarUrl || user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=random&color=fff&size=200`}
              alt="Perfil" className="avatar"
            />
            <div className="status-indicator"></div>
          </div>
          <h1 className="name">{user.name || user.username}</h1>
          <p className="bio">{user.bio || "¡Este usuario no ha escrito una biografía!"}</p>

          <div className="vcard-btn-wrapper">
            <VCardButton username={user.username || ''} />
          </div>

          {/* Social icons row */}
          {logoLinks.length > 0 && (
            <div className="social-icons mt-1rem flex-wrap-center">
              {logoLinks.map((link) => {
                const platform = PLATFORMS[link.platform] || PLATFORMS.other;
                return (
                  <a key={link.id} href={`/api/click/${link.id}`} target="_blank" rel="noopener noreferrer"
                    className={`icon-link ${buttonStyleClass}`} data-platform={link.platform} title={link.title}>
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



        {/* ── Links Section ── */}
        {user.layoutStyle === 'cards' ? (
          <div className="cards-swiper">
            {groupLinksIntoCards(barLinks).map((card, i) => (
              <div key={i} className="swipe-card">
                {card.title && <h3 className="swipe-card-title">{card.title}</h3>}
                <div className="swipe-card-links">
                  {card.links.map(link => {
                    const platform = PLATFORMS[link.platform] || PLATFORMS.other;
                    return (
                      <a key={link.id} href={`/api/click/${link.id}`} target="_blank" rel="noopener noreferrer"
                        className={`link-card ${buttonStyleClass}`} data-platform={link.platform}>
                        <div className="link-icon" data-platform={link.platform}><i className={platform.icon}></i></div>
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

                return (
                  <a key={link.id} href={`/api/click/${link.id}`} target="_blank" rel="noopener noreferrer"
                    className={`link-card ${buttonStyleClass}`} data-platform={link.platform}>
                    <div className="link-icon" data-platform={link.platform}><i className={platform.icon}></i></div>
                    <span className="link-text">{link.title}</span>
                    <i className="fa-solid fa-chevron-right arrow-icon"></i>
                  </a>
                );
              })
            )}
          </section>
        )}

        {/* ── Booking Section ── */}
        {user.bookingConfig?.enabled && (
          <BookingSection username={username} title={user.bookingConfig.title} />
        )}

        {/* ── Contact Form ── */}
        {user.contactFormEnabled && (
          <ContactForm username={username} />
        )}



        <footer className="public-footer">
          <p>&copy; {new Date().getFullYear()} Creado con <strong>Cloudinf</strong>.</p>
        </footer>
      </main>
    </>
  );
}
