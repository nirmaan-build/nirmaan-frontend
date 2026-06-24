import { Mail } from 'lucide-react';
import { st } from '@/lib/i18n-server';

// Static content (SSG). Starter copy — review with legal counsel before launch.
export const metadata = { title: 'Terms & Conditions — Nirmaan' };

export default function TermsPage() {
  return (
    <article className="prose">
      <h1 className="page-title">{st('content.terms')}</h1>
      <p className="updated">Last updated: June 2026</p>

      <p>
        These Terms &amp; Conditions (&quot;Terms&quot;) govern your use of the Nirmaan
        website and app (&quot;the Service&quot;). By accessing or using the Service you
        agree to these Terms. If you do not agree, please do not use the Service.
      </p>

      <h2>1. What Nirmaan is</h2>
      <p>
        Nirmaan is a marketplace platform that connects buyers of construction and
        hardware materials with local suppliers in Dehradun, Haridwar and surrounding
        areas. Nirmaan facilitates discovery, requirements and quotes — it is not the
        seller of listed materials and is not a party to any transaction or agreement
        between a buyer and a supplier.
      </p>

      <h2>2. Eligibility &amp; accounts</h2>
      <p>
        You must be at least 18 years old and able to enter into a binding contract.
        You are responsible for the activity on your account and for keeping your sign-in
        access secure. Sign-in uses a one-time code sent to your email; do not share it.
      </p>

      <h2>3. Posting requirements &amp; listings</h2>
      <p>
        You agree that the information you submit — requirements, quantities, areas, and
        (for suppliers) listings and prices — is accurate and not misleading. You are
        responsible for the content you post. We may remove content or suspend accounts
        that violate these Terms.
      </p>

      <h2>4. Quotes &amp; dealings between users</h2>
      <p>
        Quotes, prices, availability and delivery are offered by suppliers, not by
        Nirmaan. Any purchase, contract, payment or delivery is arranged directly
        between you and the supplier. You are responsible for verifying suppliers,
        materials and terms before committing.
      </p>

      <h2>5. Payments</h2>
      <p>
        Nirmaan does not process payments within the Service. Any payment is settled
        directly between buyer and supplier through their own arrangements.
      </p>

      <h2>6. Acceptable use</h2>
      <ul>
        <li>Do not misuse the Service, attempt to disrupt it, or access it unlawfully.</li>
        <li>Do not post false, infringing, unlawful or harmful content.</li>
        <li>Do not use the Service to harass other users or send spam.</li>
      </ul>

      <h2>7. Intellectual property</h2>
      <p>
        The Nirmaan name, logo, and the Service&apos;s software and design are owned by
        Nirmaan. You may not copy, modify or distribute them without permission.
      </p>

      <h2>8. Disclaimers &amp; limitation of liability</h2>
      <p>
        The Service is provided &quot;as is&quot; without warranties of any kind. To the
        maximum extent permitted by law, Nirmaan is not liable for any indirect or
        consequential loss, or for the acts, omissions, materials or quotes of suppliers
        or other users.
      </p>

      <h2>9. Governing law</h2>
      <p>
        These Terms are governed by the laws of India. Subject to applicable law, the
        courts at Dehradun, Uttarakhand shall have jurisdiction over any disputes.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update these Terms from time to time. Continued use of the Service after
        changes take effect constitutes acceptance of the updated Terms.
      </p>

      <h2>11. Contact us</h2>
      <div className="card contact-card">
        <div className="contact-row">
          <Mail size={18} />
          <a className="link" href="mailto:support@nirmaan.app">support@nirmaan.app</a>
        </div>
      </div>
    </article>
  );
}
