import { Mail } from 'lucide-react';
import { st } from '@/lib/i18n-server';

// Static content (SSG). Starter copy — review with legal counsel before launch.
export const metadata = { title: 'Privacy Policy — Nirmaan' };

export default function PrivacyPage() {
  return (
    <article className="prose">
      <h1 className="page-title">{st('content.privacy')}</h1>
      <p className="updated">Last updated: June 2026</p>

      <p>
        This Privacy Policy explains how Nirmaan (&quot;we&quot;, &quot;us&quot;)
        collects, uses and protects your information when you use the Nirmaan website
        and app to source construction and hardware materials from local suppliers.
        By using Nirmaan you agree to this policy.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li><strong>Account details</strong> — your name, email address and, where provided, phone number.</li>
        <li><strong>Location preference</strong> — the delivery area (pincode) you select, used to show nearby suppliers and materials.</li>
        <li><strong>Activity</strong> — your &quot;My Truck&quot; items, requirements (RFQs) you post, and quotes you receive.</li>
        <li><strong>Device &amp; usage</strong> — basic technical data and preferences such as your chosen language and light/dark theme.</li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To create and secure your account and sign you in via one-time codes.</li>
        <li>To show materials, prices and suppliers relevant to your area.</li>
        <li>To route your requirements to matching local suppliers and deliver their quotes to you.</li>
        <li>To provide support, improve the service, and keep the platform safe.</li>
      </ul>

      <h2>How we share information</h2>
      <p>
        When you post a requirement, relevant details (such as the material, quantity
        and area) are shared with matching suppliers so they can quote. We do not sell
        your personal information. We may share data with service providers who help us
        operate the platform, or where required by law.
      </p>

      <h2>Cookies &amp; local storage</h2>
      <p>
        We use cookies and browser storage to keep you signed in and to remember
        preferences like your language and theme. These are essential to how the app
        works; disabling them may limit functionality.
      </p>

      <h2>Data retention &amp; security</h2>
      <p>
        We retain your information for as long as your account is active or as needed to
        provide the service and meet legal obligations. We apply reasonable technical and
        organisational measures to protect your data, though no method of transmission or
        storage is completely secure.
      </p>

      <h2>Your rights</h2>
      <p>
        You may access, update or request deletion of your personal information, and you
        can log out at any time. To exercise these rights, contact us using the details
        below.
      </p>

      <h2>Children</h2>
      <p>
        Nirmaan is intended for business and professional use and is not directed at
        children under 18.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Material changes will be reflected
        by the &quot;Last updated&quot; date above.
      </p>

      <h2>Contact us</h2>
      <div className="card contact-card">
        <div className="contact-row">
          <Mail size={18} />
          <a className="link" href="mailto:privacy@nirmaan.app">privacy@nirmaan.app</a>
        </div>
      </div>
    </article>
  );
}
