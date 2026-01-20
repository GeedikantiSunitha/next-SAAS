/**
 * Data Processing Agreement (DPA) Page
 *
 * GDPR Article 28 compliant DPA for B2B customers
 * Defines controller-processor relationship and data processing terms
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Download } from 'lucide-react';

export const DataProcessingAgreement = () => {
  useEffect(() => {
    document.title = 'Data Processing Agreement | NextSaaS';
  }, []);

  const handleDownloadDPA = () => {
    // TODO: Implement actual PDF download
    // For now, this is a placeholder
    alert('DPA PDF download will be implemented. Please contact legal@nextsaas.com to request a signed DPA.');
  };

  return (
    <Layout>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-slate max-w-none">
          <h1 className="text-4xl font-bold mb-4">Data Processing Agreement (DPA)</h1>
          <p className="text-gray-600 mb-8">
            <strong>Last updated:</strong> January 2026
          </p>

          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Introduction (Overview)</h2>
            <p className="text-lg">
              This Data Processing Agreement ("DPA") is entered into between you (the "Controller" or "Customer")
              and NextSaaS (the "Processor" or "Service Provider"). This DPA governs the processing of personal
              data in accordance with GDPR Article 28 and other applicable data protection laws.
            </p>
            <p className="mt-4">
              This DPA forms part of the agreement between you and NextSaaS and applies when we process personal
              data on your behalf as part of providing our Service.
            </p>

            <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <Button
                onClick={handleDownloadDPA}
                className="w-full sm:w-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Full DPA (PDF)
              </Button>
              <p className="text-sm text-gray-600 mt-3">
                For enterprise customers requiring a signed DPA, please contact <strong>legal@nextsaas.com</strong>
              </p>
            </div>
          </section>

          {/* Roles and Responsibilities */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Roles and Responsibilities (Controller vs Processor)</h2>

            <h3 className="text-xl font-semibold mt-4 mb-2">You are the Data Controller</h3>
            <p>
              As the Controller, you determine the purposes and means of processing personal data. You are
              responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Determining what personal data is collected and for what purpose</li>
              <li>Ensuring you have a lawful basis for processing</li>
              <li>Obtaining necessary consents from your users/customers</li>
              <li>Providing privacy notices to data subjects</li>
              <li>Responding to data subject rights requests</li>
              <li>Ensuring compliance with applicable data protection laws</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-2">NextSaaS is the Data Processor</h3>
            <p>
              As the Processor, we process personal data only on your documented instructions. We are
              responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Processing data only as instructed by you</li>
              <li>Implementing appropriate technical and organizational security measures</li>
              <li>Assisting you with data subject rights requests</li>
              <li>Assisting you with data breach notifications</li>
              <li>Ensuring our personnel are bound by confidentiality</li>
              <li>Deleting or returning your data upon termination</li>
            </ul>
          </section>

          {/* Data Processing */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Processing (Scope of Processing)</h2>

            <h3 className="text-xl font-semibold mt-4 mb-2">Subject Matter and Duration</h3>
            <p>
              We process personal data for the duration of your subscription to our Service, plus any retention
              period required by law or agreed in our Terms of Service.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-2">Nature and Purpose of Processing</h3>
            <p>We process personal data to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Provide, maintain, and support our SaaS platform</li>
              <li>Authenticate users and manage accounts</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send transactional communications</li>
              <li>Provide customer support</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-2">Types of Personal Data</h3>
            <p>We process the following categories of personal data on your behalf:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Account Data:</strong> Names, email addresses, passwords (encrypted)</li>
              <li><strong>Usage Data:</strong> IP addresses, browser information, session data</li>
              <li><strong>Payment Data:</strong> Billing information (processed via third-party payment processors)</li>
              <li><strong>Communications:</strong> Support tickets, correspondence</li>
              <li><strong>Profile Data:</strong> Any optional profile information you or your users provide</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-2">Categories of Data Subjects</h3>
            <p>
              The personal data processed may concern the following categories of data subjects:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Your customers and end-users</li>
              <li>Your employees and contractors</li>
              <li>Authorized users of your account</li>
            </ul>
          </section>

          {/* Sub-Processors */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Sub-Processors (Third Parties)</h2>
            <p className="mb-4">
              We engage the following sub-processors to assist in providing our Service. All sub-processors
              are bound by data protection agreements and GDPR-compliant terms:
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 mt-4">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left">Sub-Processor</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Purpose</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Location</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">AWS (Amazon Web Services)</td>
                    <td className="border border-gray-300 px-4 py-2">Cloud infrastructure and hosting</td>
                    <td className="border border-gray-300 px-4 py-2">EU/US (as configured)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Stripe</td>
                    <td className="border border-gray-300 px-4 py-2">Payment processing</td>
                    <td className="border border-gray-300 px-4 py-2">US (GDPR compliant)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Razorpay</td>
                    <td className="border border-gray-300 px-4 py-2">Payment processing (India)</td>
                    <td className="border border-gray-300 px-4 py-2">India</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Cashfree</td>
                    <td className="border border-gray-300 px-4 py-2">Payment processing (India)</td>
                    <td className="border border-gray-300 px-4 py-2">India</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Resend</td>
                    <td className="border border-gray-300 px-4 py-2">Email service provider</td>
                    <td className="border border-gray-300 px-4 py-2">US (GDPR compliant)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-sm text-gray-600">
              <strong>Note:</strong> We will notify you of any changes to our sub-processors with at least
              30 days' notice. You may object to the appointment of a new sub-processor on reasonable data
              protection grounds.
            </p>
          </section>

          {/* Security Measures */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Security Measures (Technical and Organizational Measures)</h2>
            <p className="mb-4">
              In accordance with GDPR Article 28, we implement appropriate technical and organizational
              measures to ensure a level of security appropriate to the risk:
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">Technical Measures</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption of data in transit (TLS/SSL)</li>
              <li>Encryption of data at rest (database encryption)</li>
              <li>Password hashing using bcrypt</li>
              <li>Multi-factor authentication (MFA)</li>
              <li>Regular security updates and patch management</li>
              <li>Intrusion detection and prevention systems</li>
              <li>Regular vulnerability scanning</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-2">Organizational Measures</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Role-based access control (RBAC)</li>
              <li>Employee confidentiality agreements</li>
              <li>Security awareness training for staff</li>
              <li>Incident response procedures</li>
              <li>Regular security audits and reviews</li>
              <li>Data backup and disaster recovery plans</li>
              <li>Vendor management and due diligence</li>
            </ul>
          </section>

          {/* Data Breach Notification */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Breach Notification</h2>
            <p className="mb-4">
              In the event of a personal data breach, we will:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Notify you without undue delay upon becoming aware of the breach</li>
              <li>Provide notification within 72 hours of discovery where feasible</li>
              <li>Provide details of the nature of the breach, affected data categories, and approximate number of data subjects</li>
              <li>Describe the likely consequences of the breach</li>
              <li>Describe measures taken or proposed to address the breach</li>
              <li>Provide contact information for further inquiries</li>
              <li>Assist you in notifying supervisory authorities and affected data subjects as required</li>
            </ul>

            <p className="mt-4">
              You remain responsible for determining whether the breach requires notification to supervisory
              authorities or data subjects under applicable data protection laws.
            </p>
          </section>

          {/* Audit Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Audit Rights</h2>
            <p className="mb-4">
              You have the right to audit our compliance with this DPA, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Requesting information about our security measures and data processing practices</li>
              <li>Conducting on-site audits (with reasonable notice and at your expense)</li>
              <li>Engaging third-party auditors (subject to confidentiality agreements)</li>
              <li>Reviewing our SOC 2 reports or other security certifications (when available)</li>
            </ul>

            <p className="mt-4">
              Audits must be conducted during normal business hours with at least 30 days' notice and
              no more than once per year unless required by a supervisory authority or in response to a breach.
            </p>
          </section>

          {/* Data Return and Deletion */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Return and Deletion</h2>
            <p className="mb-4">
              Upon termination of our agreement or at your request, we will:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide you with the option to export your data in a machine-readable format (JSON)</li>
              <li>Delete or anonymize all personal data within 90 days of termination</li>
              <li>Provide written certification of deletion upon request</li>
              <li>Retain data only as required by law (e.g., tax records for 7 years)</li>
            </ul>
          </section>

          {/* How to Request a DPA */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How to Request a DPA</h2>
            <p className="mb-4">
              If you require a signed Data Processing Agreement (for compliance or audit purposes),
              please contact us:
            </p>
            <ul className="list-none mt-4">
              <li><strong>Email:</strong> legal@nextsaas.com</li>
              <li><strong>Subject:</strong> "DPA Request - [Your Company Name]"</li>
              <li><strong>Include:</strong> Your company name, contact information, and any specific requirements</li>
            </ul>

            <p className="mt-4">
              We typically execute DPAs for enterprise customers and B2B clients. We will respond to your
              request within 5 business days.
            </p>
          </section>

          {/* GDPR Article 28 Reference */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">GDPR Article 28 Compliance</h2>
            <p>
              This DPA complies with GDPR Article 28 requirements for processor agreements. It establishes:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>The subject matter, duration, nature, and purpose of processing</li>
              <li>The types of personal data and categories of data subjects</li>
              <li>The obligations and rights of the controller (you)</li>
              <li>The obligations of the processor (us)</li>
              <li>Appropriate technical and organizational security measures</li>
              <li>Sub-processor engagement terms</li>
              <li>Assistance with data subject rights and regulatory compliance</li>
              <li>Data breach notification procedures</li>
              <li>Audit rights and data deletion/return obligations</li>
            </ul>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="mb-2">For questions about this DPA or to request a signed agreement:</p>
            <ul className="list-none mt-4">
              <li><strong>Legal Inquiries:</strong> legal@nextsaas.com</li>
              <li><strong>Data Protection Officer:</strong> dpo@nextsaas.com</li>
              <li><strong>Privacy Questions:</strong> privacy@nextsaas.com</li>
              <li><strong>General Support:</strong> support@nextsaas.com</li>
            </ul>
          </section>

          {/* Footer Links */}
          <section className="mt-12 pt-8 border-t border-gray-300">
            <p className="text-sm text-gray-600">
              Related Policies:{' '}
              <Link to="/privacy-policy" className="text-indigo-600 hover:underline">
                Privacy Policy
              </Link>
              {' | '}
              <Link to="/terms" className="text-indigo-600 hover:underline">
                Terms of Service
              </Link>
              {' | '}
              <Link to="/acceptable-use" className="text-indigo-600 hover:underline">
                Acceptable Use Policy
              </Link>
            </p>
          </section>
        </div>
      </main>
    </Layout>
  );
};
