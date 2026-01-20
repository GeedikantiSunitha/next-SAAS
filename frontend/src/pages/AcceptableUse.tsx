/**
 * Acceptable Use Policy Page
 *
 * Defines prohibited activities, account suspension, and reporting mechanisms
 * Protects the service and sets clear usage expectations
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';

export const AcceptableUse = () => {
  useEffect(() => {
    document.title = 'Acceptable Use Policy | NextSaaS';
  }, []);

  return (
    <Layout>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-slate max-w-none">
          <h1 className="text-4xl font-bold mb-4">Acceptable Use Policy</h1>
          <p className="text-gray-600 mb-8">
            <strong>Last updated:</strong> January 2026
          </p>

          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Introduction (Overview)</h2>
            <p className="text-lg">
              This Acceptable Use Policy ("Policy") governs your use of NextSaaS ("Service"). By using our Service,
              you agree to comply with this Policy. We reserve the right to investigate violations and take appropriate
              action, including suspension or termination of your account.
            </p>
            <p className="mt-4">
              This Policy is designed to protect our Service, our users, and the broader internet community from
              abusive, harmful, or illegal activities.
            </p>
          </section>

          {/* Prohibited Activities */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Prohibited Activities (Unacceptable Use)</h2>
            <p className="mb-4">
              You may not use our Service for any illegal, harmful, or abusive purpose. Specifically, you agree not to:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Illegal Activities</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Engage in any unlawful or illegal activity</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Facilitate or promote criminal activity</li>
              <li>Engage in fraud, identity theft, or money laundering</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Spam and Unsolicited Communications</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Send spam, unsolicited bulk emails, or marketing messages</li>
              <li>Use the Service to conduct phishing attacks</li>
              <li>Harvest email addresses or personal data without consent</li>
              <li>Distribute chain letters or pyramid schemes</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Harmful or Malicious Content</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Upload, transmit, or distribute viruses, malware, or other harmful code</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Disrupt, damage, or interfere with the Service or servers</li>
              <li>Launch denial-of-service (DoS) attacks</li>
              <li>Probe, scan, or test vulnerabilities without authorization</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Harassment and Abuse</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Harass, threaten, bully, or intimidate other users</li>
              <li>Post hateful, discriminatory, or offensive content</li>
              <li>Engage in stalking or doxxing (publishing private information)</li>
              <li>Impersonate any person or entity</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Intellectual Property Violations</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Infringe on copyright, trademark, patent, or other intellectual property rights</li>
              <li>Upload or distribute pirated content</li>
              <li>Use our Service to sell counterfeit goods</li>
              <li>Violate software licensing agreements</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Service Abuse</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Circumvent usage limits or access controls</li>
              <li>Use automated tools (bots, scrapers) without permission</li>
              <li>Resell or sublicense the Service without authorization</li>
              <li>Create multiple accounts to abuse free trials or promotions</li>
              <li>Reverse engineer, decompile, or disassemble our software</li>
            </ul>
          </section>

          {/* Account Suspension and Termination */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Account Suspension and Termination</h2>
            <p className="mb-4">
              We reserve the right to suspend or terminate your account if you violate this Policy.
              Our enforcement actions may include:
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-3">Warning</h3>
            <p>For minor or first-time violations, we may issue a warning and request that you cease the prohibited activity.</p>

            <h3 className="text-xl font-semibold mt-4 mb-3">Temporary Suspension</h3>
            <p>
              We may temporarily suspend your account while we investigate suspected violations.
              During suspension, you will not be able to access your account or data.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-3">Permanent Termination</h3>
            <p>
              For serious or repeated violations, we may permanently terminate your account and delete your data.
              Terminated accounts cannot be reinstated, and you may be prohibited from creating new accounts.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-3">No Refunds</h3>
            <p>
              If your account is suspended or terminated due to Policy violations, you will not be entitled to
              a refund of any fees paid.
            </p>
          </section>

          {/* Consequences of Violations */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Consequences of Violations</h2>
            <p className="mb-4">
              Violations of this Policy may result in one or more of the following consequences:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Suspension or Termination:</strong> Immediate or delayed suspension/termination</li>
              <li><strong>Content Removal:</strong> Removal of violating content from our Service</li>
              <li><strong>Legal Action:</strong> Referral to law enforcement or civil litigation for serious violations</li>
              <li><strong>Reporting to Authorities:</strong> Cooperation with law enforcement investigations</li>
              <li><strong>IP/Account Bans:</strong> Blocking of IP addresses or email domains</li>
              <li><strong>Financial Liability:</strong> You may be held liable for damages caused by your violations</li>
            </ul>

            <p className="mt-4">
              We reserve the right to investigate all suspected violations. During an investigation, we may
              review your account data, communications, and usage patterns.
            </p>
          </section>

          {/* Reporting Violations */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Reporting Violations (Report Abuse)</h2>
            <p className="mb-4">
              If you become aware of any violations of this Policy, please report them to us immediately.
              We take all reports seriously and will investigate promptly.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-3">How to Report Abuse</h3>
            <p className="mb-2">
              To report a violation, please email us at <strong>abuse@nextsaas.com</strong> with the following information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Description of the violation</li>
              <li>Account username or identifier (if known)</li>
              <li>Date and time of the incident</li>
              <li>Screenshots or evidence (if available)</li>
              <li>Your contact information</li>
            </ul>

            <p className="mt-4">
              We will review all reports within 48 hours and take appropriate action. You may be contacted
              for additional information during our investigation.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-3">Confidentiality</h3>
            <p>
              We will keep your report confidential and will not disclose your identity to the reported user
              unless required by law.
            </p>
          </section>

          {/* Modifications to Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Modifications to This Policy</h2>
            <p>
              We may update this Policy from time to time to reflect changes in our practices or legal requirements.
              We will notify you of significant changes via email or through the Service. Your continued use of
              the Service after changes are posted constitutes acceptance of the updated Policy.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="mb-2">If you have questions about this Policy, please contact us:</p>
            <ul className="list-none mt-4">
              <li><strong>Abuse Reports:</strong> abuse@nextsaas.com</li>
              <li><strong>General Support:</strong> support@nextsaas.com</li>
              <li><strong>Legal Inquiries:</strong> legal@nextsaas.com</li>
            </ul>
          </section>

          {/* Footer Links */}
          <section className="mt-12 pt-8 border-t border-gray-300">
            <p className="text-sm text-gray-600">
              Related Policies:{' '}
              <Link to="/legal/privacy" className="text-indigo-600 hover:underline">
                Privacy Policy
              </Link>
              {' | '}
              <Link to="/legal/terms" className="text-indigo-600 hover:underline">
                Terms of Service
              </Link>
              {' | '}
              <Link to="/legal/cookies" className="text-indigo-600 hover:underline">
                Cookie Policy
              </Link>
            </p>
          </section>
        </div>
      </main>
    </Layout>
  );
};
