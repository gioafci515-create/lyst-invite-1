import Lookbook from '../components/Lookbook';
import Panel from '../components/Panel';
import RsvpSection from '../components/RsvpSection';
import SiteNav from '../components/SiteNav';
import { Embed } from '../components/app/AppShell';
import RsvpFlow from '../components/app/RsvpFlow';
import Hub from '../components/app/Hub';
import NotificationsScreen from '../components/app/NotificationsScreen';
import CameraScreen from '../components/app/CameraScreen';
import GuestbookScreen from '../components/app/GuestbookScreen';
import VideoScreen from '../components/app/VideoScreen';
import InteractScreen from '../components/app/InteractScreen';
import GalleryScreen from '../components/app/GalleryScreen';
import LaterScreen from '../components/app/LaterScreen';
import CapsuleScreen from '../components/app/CapsuleScreen';
import './event/event.css';

export default function Page() {
  return (
    <>
      <div className="collection-label">
        <p className="collection-label__concept">06 — Fashion / Launch</p>
        <p className="collection-label__style">Runway editorial invitation</p>
      </div>

      <SiteNav />

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
              <span className="only-desktop">Lookbook / 01—05</span>
              <span className="only-mobile">The invitation, in scenes</span>
            </p>
            <h2>A visual language made for this moment.</h2>
          </div>
          <Lookbook />
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

        <Embed>
          <Panel id="respond" step="Respond · 02" title="Your details, in one place." desc="Add guests, choose a menu and share access needs. Saving again simply updates your earlier response.">
            <RsvpFlow />
          </Panel>

          <Panel id="hub" wide>
            <Hub embedded />
          </Panel>

          <Panel id="updates" step="Prepare · 03" title="Updates from the hosts." desc="Location, schedule and announcements, newest and most important first.">
            <NotificationsScreen />
          </Panel>

          <Panel id="camera" step="Participate · 04" title="Event camera." desc="A 24-exposure disposable roll. Your photos stay locked until after the event." tone="stone">
            <CameraScreen />
          </Panel>
          <Panel id="guestbook" title="Voice guestbook." desc="Leave a spoken memory for the room." tone="stone">
            <GuestbookScreen />
          </Panel>
          <Panel id="video" title="Video messages." desc="Record up to a minute for the one-year film." tone="stone">
            <VideoScreen />
          </Panel>
          <Panel id="interact" title="Live room." desc="Letters, hidden moments, the live poll and questions for the hosts." tone="stone">
            <InteractScreen />
          </Panel>
          <Panel id="gallery" title="Guest gallery." desc="Everything the room has captured so far." tone="stone">
            <GalleryScreen />
          </Panel>

          <Panel id="later" step="Remember · 05" title="A message for later." desc="Seal a note now. It opens on the date you choose." tone="night">
            <LaterScreen />
          </Panel>
          <Panel id="capsule" title="Digital time capsule." desc="Everything placed here opens together in one year." tone="night">
            <CapsuleScreen />
          </Panel>
        </Embed>
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
