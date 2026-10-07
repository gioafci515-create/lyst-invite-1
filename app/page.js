import Link from 'next/link';
import RsvpSection from '../components/RsvpSection';

export default function Page() {
  return (
    <>
      <div className="collection-label">
        <p className="collection-label__concept">06 — Fashion / Launch</p>
        <p className="collection-label__style">Runway editorial invitation</p>
      </div>

      <header className="nav">
        <a className="nav__mark" href="#top">LYST / 06</a>
        <nav className="nav__links" aria-label="Primary">
          <a href="#invitation">Invitation</a>
          <a href="#story">Story</a>
          <a href="#programme">Programme</a>
          <a href="#visit">Visit</a>
          <Link href="/event">Event</Link>
        </nav>
        <a className="pill nav__rsvp" href="#rsvp">RSVP</a>
      </header>

      <main id="top">
        <section className="hero" id="invitation">
          <img className="hero__bleed" src="/assets/runway-mobile.png" alt="" aria-hidden="true" />
          <p className="eyebrow eyebrow--accent hero__edition">MAISON AER / PARIS / EDITION 047</p>
          <div className="hero__copy">
            <h1 className="hero__title">OBJECT 07: AER</h1>
            <p className="hero__desc">Maison AER reveals Object 07 through a one-night installation, moving image commission and limited runway edition.</p>
            <p className="hero__details">Thursday, 1 October 2026 / First look 20:30<br />Palais de Tokyo · Galerie 5</p>
            <a className="btn-square" href="#rsvp">Request seat <img src="/assets/arrow-right.svg" alt="" width="14" height="14" /></a>
          </div>
          <div className="hero__photo">
            <img src="/assets/runway-desktop.png" alt="Model in sculptural black garment on the Maison AER runway" />
          </div>
        </section>

        <section className="story" id="story">
          <div className="section-heading">
            <p className="eyebrow eyebrow--olive">
              <span className="only-desktop">Lookbook / 01—03</span>
              <span className="only-mobile">The invitation, in scenes</span>
            </p>
            <h2>A visual language made for this moment.</h2>
          </div>
          <div className="gallery">
            <img src="/assets/gallery-1.png" alt="Silver hardware detail on black fabric" />
            <img src="/assets/gallery-2.png" alt="Model walking the runway in front of seated guests" />
            <img src="/assets/gallery-3.png" alt="Fragrance bottle lit in yellow-green light" />
          </div>
          <img className="story__mobile-img" src="/assets/story-mobile.png" alt="Model walking the runway in front of seated guests" />
          <div className="storyboard">
            <p className="storyboard__cue">Frame 01—07 · images cut on scroll</p>
            <p className="storyboard__dots" aria-hidden="true">●　○　○　○</p>
          </div>
        </section>

        <section className="programme" id="programme">
          <div className="section-heading">
            <p className="eyebrow eyebrow--grey">Programme / location / practical</p>
            <h2>Everything you need, beautifully placed.</h2>
          </div>
          <div className="info" id="visit">
            <div className="card schedule">
              <h3>Schedule</h3>
              <ul>
                <li>19:45 · Collector entry</li>
                <li>20:30 · Object 07 first look</li>
                <li>20:42 · Runway sequence</li>
                <li>21:10 · Installation opens</li>
              </ul>
            </div>

            <div className="location">
              <div className="location__map" aria-hidden="true" />
              <img className="location__pin" src="/assets/map-pin.svg" alt="" width="28" height="28" />
              <div className="location__copy">
                <p className="location__venue">Palais de Tokyo · Galerie 5</p>
                <a className="location__link" href="https://maps.google.com/?q=Palais+de+Tokyo+Paris" target="_blank" rel="noopener noreferrer">
                  Paris · Open map <img src="/assets/arrow-up-right.svg" alt="" width="14" height="14" />
                </a>
                <p className="location__access">
                  <span className="only-desktop">Step-free arrival details are saved with your response. Hosts can arrange transport assistance privately.</span>
                  <span className="only-mobile">Step-free details and transport assistance are available privately.</span>
                </p>
              </div>
            </div>

            <div className="notes">
              <div className="dress">
                <p className="label">Dress code<span className="only-mobile"> / good to know</span></p>
                <p className="dress__text">Severe black. Silver hardware. No logos.</p>
                <ul className="know only-mobile">
                  <li>Names checked against seat list</li>
                  <li>Photography after runway only</li>
                  <li>Car service desk closes 22:30</li>
                </ul>
              </div>
              <div className="card know-card only-desktop">
                <p className="label label--grey">Good to know</p>
                <ul className="know">
                  <li>Names checked against seat list</li>
                  <li>Photography after runway only</li>
                  <li>Car service desk closes 22:30</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <RsvpSection />
      </main>

      <footer className="footer">
        <p className="footer__mark">LYST / invitations</p>
        <div className="footer__text">
          <p>Host contact · <a href="mailto:hello@lyst.events">hello@lyst.events</a> · Privacy · Accessibility</p>
          <p>Invitation access is limited to named guests.</p>
        </div>
      </footer>
    </>
  );
}
