import { Mail, Phone, Clock } from 'lucide-react';
import { st } from '@/lib/i18n-server';

// Static content (SSG). The admin-editable content endpoint is a later stage;
// this is the starter copy until then (PRD-03 §4.7).
export const metadata = { title: 'Help & Support — Nirmaan' };

export default function HelpPage() {
  return (
    <article className="prose">
      <h1 className="page-title">{st('content.help')}</h1>
      <p className="updated">Last updated: June 2026</p>

      <p>
        Nirmaan helps you source building and hardware materials from verified local
        suppliers across Dehradun and Haridwar. This page answers the most common
        questions. If you can&apos;t find what you need, reach our team using the
        contact details below.
      </p>

      <h2>Getting started</h2>
      <p>
        Sign in with your email to receive a one-time code (OTP). After verifying, set
        your name and your delivery area (pincode) so we can show materials and
        suppliers near you. You can change your area anytime from the header or your
        Profile.
      </p>

      <h2>Finding materials</h2>
      <p>
        Use the search bar to look up a material, category or supplier, or browse the
        category grid on the Home and Categories pages. Each category page lists items
        available in your area along with an estimated price and the listing supplier.
      </p>

      <h2>My Truck</h2>
      <p>
        &quot;My Truck&quot; is your working list of materials. Add items from any
        category page, adjust quantities, and review the estimated value. When
        you&apos;re ready, send the whole truck as a single requirement and local
        suppliers will respond with quotes.
      </p>

      <h2>Posting a requirement (RFQ)</h2>
      <p>
        Can&apos;t find an exact item, or need a bulk quote? Post a Requirement with the
        category, a short description, quantity, unit and your area. Matching suppliers
        in your pincode are notified and can send you quotes, which you&apos;ll see on
        the requirement&apos;s detail page.
      </p>

      <h2>Managing your account &amp; area</h2>
      <p>
        Update your name, switch your delivery area, change the app language, or toggle
        light/dark appearance from your Profile. Your session stays signed in on this
        device until you log out.
      </p>

      <h2>Becoming a supplier</h2>
      <p>
        Want to receive leads and list your materials? Open your Profile and choose
        &quot;Become a Supplier&quot;. Supplier verification is handled by our team
        before your listings go live.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>Not seeing items? Confirm your area pincode is set correctly — listings are hyperlocal.</li>
        <li>Didn&apos;t get your code? Wait a few seconds, check spam, then request it again.</li>
        <li>Something looks off? Try refreshing the page; if it persists, contact us below.</li>
      </ul>

      <div className="card contact-card">
        <h2 style={{ marginTop: 0 }}>Contact support</h2>
        <div className="contact-row">
          <Mail size={18} />
          <a className="link" href="mailto:support@nirmaan.app">support@nirmaan.app</a>
        </div>
        <div className="contact-row">
          <Phone size={18} />
          <a className="link" href="tel:+917000000000">+91 70000 00000</a>
        </div>
        <div className="contact-row">
          <Clock size={18} />
          <span>Mon–Sat, 9:00 AM – 7:00 PM IST</span>
        </div>
      </div>
    </article>
  );
}
