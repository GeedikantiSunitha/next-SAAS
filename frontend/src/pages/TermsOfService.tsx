/**
 * Terms of Service Page
 *
 * Legal terms and conditions for using the service
 * Covers acceptance, user obligations, payments, liability, etc.
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';

export const TermsOfService = () => {
  useEffect(() => {
    document.title = 'Terms of Service | NextSaaS';
  }, []);

  return (
    <Layout>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-slate max-w-none">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-gray-600 mb-8">
            <strong>Last updated:</strong> January 2026
          </p>

          {/* Introduction */}
          <section className="mb-8">
            <p className="text-lg">
              These Terms of Service ("Terms") govern your access to and use of NextSaaS ("Service", "we", "us", or "our").
              By accessing or using our Service, you agree to be bound by these Terms. If you do not agree to these Terms,
              please do not use our Service.
            </p>
          </section>

          {/* Acceptance of Terms */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms (Agreement to Terms)</h2>
            <p>
              By creating an account, accessing, or using our Service, you acknowledge that you have read, understood, and agree
              to be bound by these Terms and our{' '}
              <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline">
                Privacy Policy
              </Link>. These Terms constitute a legally binding agreement between you and NextSaaS.
            </p>
            <p className="mt-4">
              You must be at least 18 years old or the age of majority in your jurisdiction to use our Service. By using our
              Service, you represent and warrant that you meet this age requirement.
            </p>
          </section>

          {/* User Accounts */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">User Accounts</h2>
            <p>
              To access certain features of our Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized access to your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
            </ul>
            <p className="mt-4">
              You may not share your account credentials with others. We reserve the right to suspend or terminate accounts
              that violate these Terms.
            </p>
          </section>

          {/* User Obligations and Prohibited Uses */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">User Obligations (Your Obligations)</h2>
            <p>
              You agree to use our Service only for lawful purposes and in accordance with these Terms. You agree NOT to:
            </p>
            <h3 className="text-xl font-semibold mt-4 mb-2">Prohibited Uses</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any applicable laws, regulations, or third-party rights</li>
              <li>Use the Service for any illegal, fraudulent, or unauthorized purpose</li>
              <li>Interfere with or disrupt the Service or servers/networks connected to the Service</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Upload or transmit viruses, malware, or any malicious code</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Impersonate any person or entity</li>
              <li>Collect or store personal data about other users without permission</li>
              <li>Use automated systems (bots, scrapers) without our written permission</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Intellectual Property (Ownership)</h2>
            <h3 className="text-xl font-semibold mt-4 mb-2">Our Intellectual Property</h3>
            <p>
              The Service and all content, features, and functionality (including but not limited to software, text, graphics,
              logos, and design) are owned by NextSaaS and are protected by copyright, trademark, and other intellectual
              property laws.
            </p>
            <p className="mt-4">
              Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable,
              revocable license to access and use the Service for your personal or internal business purposes.
            </p>
            <h3 className="text-xl font-semibold mt-4 mb-2">Your Content</h3>
            <p>
              You retain all rights to any content you submit, post, or upload to the Service ("User Content"). By submitting
              User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, process, and
              display your User Content solely to provide and improve the Service.
            </p>
          </section>

          {/* Service Availability and Modifications */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Service Availability (Changes to Service)</h2>
            <p>
              We strive to provide a reliable and accessible Service, but we do not guarantee uninterrupted or error-free
              operation. We reserve the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Modify, suspend, or discontinue any part of the Service at any time</li>
              <li>Perform scheduled maintenance and updates</li>
              <li>Limit or restrict access to certain features or functionality</li>
            </ul>
            <p className="mt-4">
              We will provide reasonable notice of any significant changes that materially affect your use of the Service.
            </p>
          </section>

          {/* Payment and Subscriptions */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Payment and Subscriptions (Billing)</h2>
            <h3 className="text-xl font-semibold mt-4 mb-2">Subscription Plans</h3>
            <p>
              Some features of the Service require a paid subscription. By subscribing, you agree to pay all fees associated
              with your chosen plan.
            </p>
            <h3 className="text-xl font-semibold mt-4 mb-2">Billing</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
              <li>You authorize us to charge your payment method for recurring fees</li>
              <li>All fees are non-refundable except as required by law or stated in our refund policy</li>
              <li>We reserve the right to change pricing with 30 days' notice to existing subscribers</li>
            </ul>
            <h3 className="text-xl font-semibold mt-4 mb-2">Cancellation</h3>
            <p>
              You may cancel your subscription at any time through your account settings. Cancellation takes effect at the
              end of your current billing period. You will retain access to paid features until that date.
            </p>
          </section>

          {/* Termination */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Termination (Account Suspension)</h2>
            <p>
              We may suspend or terminate your account and access to the Service at our sole discretion, without notice,
              for conduct that we believe:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Violates these Terms or applicable laws</li>
              <li>Harms or poses a risk to other users or our Service</li>
              <li>Exposes us to legal liability</li>
            </ul>
            <p className="mt-4">
              Upon termination, your right to use the Service will immediately cease. We may, but are not obligated to,
              delete your account and User Content. You remain responsible for all fees incurred up to the termination date.
            </p>
            <p className="mt-4">
              You may terminate your account at any time by contacting us at support@nextsaas.com.
            </p>
          </section>

          {/* Disclaimers */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Disclaimers (Warranties)</h2>
            <p className="uppercase font-semibold">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
            </p>
            <p className="mt-4">
              To the fullest extent permitted by law, NextSaaS disclaims all warranties, express or implied, including but
              not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Implied warranties of merchantability, fitness for a particular purpose, and non-infringement</li>
              <li>Warranties regarding the accuracy, reliability, or availability of the Service</li>
              <li>Warranties that the Service will be uninterrupted, secure, or error-free</li>
              <li>Warranties regarding the results obtained from using the Service</li>
            </ul>
            <p className="mt-4">
              You use the Service at your own risk. We do not warrant that the Service will meet your requirements or
              expectations.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
            <p className="uppercase font-semibold">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEXTSAAS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY,
              OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
            <p className="mt-4">
              Our total liability to you for any claims arising from or related to these Terms or the Service shall not
              exceed the greater of:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>The amount you paid us in the 12 months preceding the claim, or</li>
              <li>$100 USD</li>
            </ul>
            <p className="mt-4">
              Some jurisdictions do not allow the exclusion of certain warranties or limitations of liability. In such
              jurisdictions, our liability will be limited to the maximum extent permitted by law.
            </p>
          </section>

          {/* Indemnification */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless NextSaaS, its affiliates, officers, directors, employees,
              and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable
              attorney fees) arising out of or related to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Your User Content</li>
            </ul>
          </section>

          {/* Governing Law */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Governing Law and Jurisdiction</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without
              regard to its conflict of law provisions.
            </p>
            <p className="mt-4">
              Any disputes arising from or relating to these Terms or the Service shall be resolved exclusively in the
              courts of [Your Jurisdiction]. You consent to the personal jurisdiction of such courts.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Dispute Resolution</h2>
            <p>
              Before filing a legal claim, you agree to try to resolve any dispute informally by contacting us at
              legal@nextsaas.com. We will attempt to resolve the dispute informally within 60 days.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to These Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of material changes by:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Posting the updated Terms on this page</li>
              <li>Updating the "Last updated" date</li>
              <li>Sending you an email notification (for significant changes)</li>
            </ul>
            <p className="mt-4">
              Your continued use of the Service after any changes indicates your acceptance of the updated Terms. If you
              do not agree to the changes, you must stop using the Service and may terminate your account.
            </p>
          </section>

          {/* Severability */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Severability</h2>
            <p>
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will
              continue in full force and effect. The invalid provision will be modified to the minimum extent necessary
              to make it valid and enforceable.
            </p>
          </section>

          {/* Entire Agreement */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy and Cookie Policy, constitute the entire agreement between you
              and NextSaaS regarding the Service and supersede any prior agreements.
            </p>
          </section>

          {/* Contact Us */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us (Questions)</h2>
            <p>
              If you have any questions, concerns, or feedback about these Terms, please contact us:
            </p>
            <ul className="list-none mt-4">
              <li><strong>Email:</strong> legal@nextsaas.com</li>
              <li><strong>Support:</strong> support@nextsaas.com</li>
            </ul>
          </section>

          {/* Related Links */}
          <section className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Related Documents</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="text-blue-600 hover:text-blue-800 underline">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </Layout>
  );
};
