/**
 * Privacy Policy Page
 *
 * GDPR-compliant privacy policy explaining data practices
 * Required sections: data collection, usage, legal basis, user rights, etc.
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';

export const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = 'Privacy Policy | NextSaaS';
  }, []);

  return (
    <Layout>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-slate max-w-none">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">
            <strong>Last updated:</strong> January 2026
          </p>

          {/* Introduction */}
          <section className="mb-8">
            <p className="text-lg">
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
              We are committed to protecting your privacy and complying with the General Data Protection Regulation (GDPR) and other applicable data protection laws.
            </p>
          </section>

          {/* Data Controller */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Controller (Who We Are)</h2>
            <p>
              NextSaaS is the data controller responsible for your personal data. If you have any questions about this privacy policy
              or our data practices, please contact us at:
            </p>
            <ul className="list-none mt-4">
              <li><strong>Email:</strong> privacy@nextsaas.com</li>
              <li><strong>Support:</strong> support@nextsaas.com</li>
            </ul>
          </section>

          {/* Data We Collect */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data We Collect (Information We Collect)</h2>
            <p>We collect the following types of personal data:</p>
            <h3 className="text-xl font-semibold mt-4 mb-2">Account Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name and email address (required for account creation)</li>
              <li>Password (encrypted)</li>
              <li>Profile information (optional)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-2">Usage Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>IP address and browser information</li>
              <li>Pages visited and features used</li>
              <li>Login history and session data</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-2">Payment Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Payment card details (processed securely by our payment providers)</li>
              <li>Billing address</li>
              <li>Transaction history</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-2">Communications</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Support tickets and correspondence</li>
              <li>Newsletter subscription preferences</li>
              <li>Notification preferences</li>
            </ul>
          </section>

          {/* How We Use Data */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Data (Use of Data)</h2>
            <p>We use your personal data for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Provision:</strong> To provide, maintain, and improve our service</li>
              <li><strong>Account Management:</strong> To manage your account and authenticate you</li>
              <li><strong>Communications:</strong> To send you service updates, newsletters (with consent), and respond to inquiries</li>
              <li><strong>Payment Processing:</strong> To process transactions and manage subscriptions</li>
              <li><strong>Analytics:</strong> To understand how our service is used and improve it (with consent)</li>
              <li><strong>Security:</strong> To protect against fraud and unauthorized access</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations</li>
            </ul>
          </section>

          {/* Legal Basis */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Legal Basis for Processing (Lawful Basis)</h2>
            <p>Under GDPR, we process your personal data based on the following legal grounds:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Contract Performance:</strong> Processing necessary to fulfill our service agreement with you</li>
              <li><strong>Consent:</strong> You have given explicit consent for specific processing activities (e.g., marketing emails, analytics cookies)</li>
              <li><strong>Legitimate Interests:</strong> Processing necessary for our legitimate business interests (e.g., fraud prevention, service improvement)</li>
              <li><strong>Legal Obligation:</strong> Processing required to comply with legal requirements</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Sharing (Third Parties)</h2>
            <p>We may share your personal data with the following third parties:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Payment Processors:</strong> Stripe, Razorpay, or Cashfree to process payments securely</li>
              <li><strong>Cloud Infrastructure:</strong> Hosting providers to store and process data</li>
              <li><strong>Analytics Services:</strong> With your consent, to understand service usage</li>
              <li><strong>Email Service Providers:</strong> To send transactional and marketing emails</li>
              <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
            </ul>
            <p className="mt-4">
              We ensure all third parties comply with GDPR and have appropriate data protection measures in place.
            </p>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Retention (How Long We Keep Your Data)</h2>
            <p>We retain your personal data for as long as necessary to fulfill the purposes outlined in this policy:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Data:</strong> Retained while your account is active and for 90 days after deletion (for recovery)</li>
              <li><strong>Transaction Records:</strong> Retained for 7 years for accounting and legal purposes</li>
              <li><strong>Marketing Consents:</strong> Retained until you withdraw consent</li>
              <li><strong>Analytics Data:</strong> Aggregated and anonymized after 24 months</li>
              <li><strong>Audit Logs:</strong> Retained for 2 years for security purposes</li>
            </ul>
          </section>

          {/* User Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Rights (Data Subject Rights)</h2>
            <p>Under GDPR, you have the following rights regarding your personal data:</p>

            <h3 className="text-xl font-semibold mt-4 mb-2">Right to Access</h3>
            <p>You can request a copy of all personal data we hold about you.</p>

            <h3 className="text-xl font-semibold mt-4 mb-2">Right to Rectification (Right to Correct)</h3>
            <p>You can request correction of inaccurate or incomplete personal data.</p>

            <h3 className="text-xl font-semibold mt-4 mb-2">Right to Erasure (Right to be Forgotten)</h3>
            <p>You can request deletion of your personal data in certain circumstances.</p>

            <h3 className="text-xl font-semibold mt-4 mb-2">Right to Data Portability (Right to Portability)</h3>
            <p>You can request a machine-readable copy of your data to transfer to another service.</p>

            <h3 className="text-xl font-semibold mt-4 mb-2">Right to Object</h3>
            <p>You can object to certain processing activities, such as direct marketing.</p>

            <h3 className="text-xl font-semibold mt-4 mb-2">Right to Withdraw Consent (Right to Withdraw)</h3>
            <p>You can withdraw consent for processing activities that require consent.</p>

            <h3 className="text-xl font-semibold mt-4 mb-2">Right to Restriction</h3>
            <p>You can request restriction of processing in certain circumstances.</p>

            <p className="mt-4">
              To exercise any of these rights, please visit your{' '}
              <Link to="/gdpr-settings" className="text-blue-600 hover:text-blue-800 underline">
                Privacy Settings (GDPR Settings)
              </Link>{' '}
              or contact us at privacy@nextsaas.com.
            </p>
          </section>

          {/* Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to enhance your experience, analyze usage, and deliver personalized content.
              You can manage your cookie preferences at any time.
            </p>
            <p className="mt-4">
              For detailed information about the cookies we use, please read our{' '}
              <Link to="/cookie-policy" className="text-blue-600 hover:text-blue-800 underline">
                Cookie Policy
              </Link>.
            </p>
          </section>

          {/* Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal data against unauthorized access,
              alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption of data in transit (HTTPS/TLS) and at rest</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Secure password hashing (bcrypt)</li>
              <li>Regular backups and disaster recovery procedures</li>
              <li>Staff training on data protection and security</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the Internet is 100% secure. While we strive to protect your personal data,
              we cannot guarantee absolute security.
            </p>
          </section>

          {/* International Transfers */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">International Data Transfers</h2>
            <p>
              Your personal data may be transferred to and processed in countries outside your country of residence. We ensure that
              such transfers comply with GDPR requirements through appropriate safeguards, such as Standard Contractual Clauses (SCCs).
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
            <p>
              Our service is not intended for children under 16 years of age. We do not knowingly collect personal data from children.
              If you are a parent or guardian and believe your child has provided us with personal data, please contact us.
            </p>
          </section>

          {/* Changes to Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to This Policy (Updates to Policy)</h2>
            <p>
              We may update this privacy policy from time to time to reflect changes in our practices or legal requirements.
              We will notify you of any material changes by:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Posting the updated policy on this page</li>
              <li>Updating the "Last updated" date at the top</li>
              <li>Sending you an email notification (for significant changes)</li>
            </ul>
            <p className="mt-4">
              We encourage you to review this privacy policy periodically to stay informed about how we protect your data.
            </p>
          </section>

          {/* Contact Us */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us (Reach Us)</h2>
            <p>
              If you have any questions, concerns, or requests regarding this privacy policy or our data practices, please contact us:
            </p>
            <ul className="list-none mt-4">
              <li><strong>Email:</strong> privacy@nextsaas.com</li>
              <li><strong>Support:</strong> support@nextsaas.com</li>
              <li><strong>Data Protection Officer:</strong> dpo@nextsaas.com</li>
            </ul>
            <p className="mt-4">
              You also have the right to lodge a complaint with your local data protection authority if you believe we have not
              adequately addressed your concerns.
            </p>
          </section>

          {/* Related Links */}
          <section className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Related Documents</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-blue-600 hover:text-blue-800 underline">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="text-blue-600 hover:text-blue-800 underline">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/gdpr-settings" className="text-blue-600 hover:text-blue-800 underline">
                  Manage Your Data (Privacy Settings)
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </Layout>
  );
};
