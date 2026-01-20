/**
 * Security Policy Page
 *
 * Public-facing security policy explaining our security practices
 * Builds trust with enterprise customers and demonstrates security commitment
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';

export const SecurityPolicy = () => {
  useEffect(() => {
    document.title = 'Security Policy | NextSaaS';
  }, []);

  return (
    <Layout>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-slate max-w-none">
          <h1 className="text-4xl font-bold mb-4">Security Policy</h1>
          <p className="text-gray-600 mb-8">
            <strong>Last updated:</strong> January 2026
          </p>

          {/* Overview */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Overview</h2>
            <p className="text-lg">
              At NextSaaS, we take security seriously. This Security Policy outlines the technical and
              organizational measures we implement to protect your data and ensure the confidentiality,
              integrity, and availability of our Service.
            </p>
          </section>

          {/* Encryption */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Encryption</h2>

            <h3 className="text-xl font-semibold mt-4 mb-2">Encryption in Transit</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>All data transmitted between your browser and our servers is encrypted using TLS 1.2+ (HTTPS)</li>
              <li>SSL/TLS certificates from trusted certificate authorities</li>
              <li>Strong cipher suites and perfect forward secrecy</li>
              <li>Forced HTTPS redirects for all HTTP requests</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-2">Encryption at Rest</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Database encryption for all personal data at rest</li>
              <li>Password hashing using bcrypt (12 rounds)</li>
              <li>Encrypted backups with AES-256 encryption</li>
              <li>Secure key management and rotation policies</li>
            </ul>
          </section>

          {/* Access Control and Authentication */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Access Control and Authentication</h2>

            <h3 className="text-xl font-semibold mt-4 mb-2">User Authentication</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Multi-Factor Authentication (MFA):</strong> Optional 2FA using TOTP, email OTP, or backup codes</li>
              <li><strong>Password Requirements:</strong> Strong password policies enforced (min 8 characters, complexity requirements)</li>
              <li><strong>Password Hashing:</strong> bcrypt with work factor of 12</li>
              <li><strong>OAuth Integration:</strong> Secure third-party authentication (Google, GitHub, Microsoft)</li>
              <li><strong>Session Management:</strong> Secure JWT tokens with expiration and revocation</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-2">Role-Based Access Control (RBAC)</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Granular access control based on user roles (USER, ADMIN, SUPER_ADMIN)</li>
              <li>Least privilege principle enforced</li>
              <li>Regular access reviews and audits</li>
              <li>Automatic session termination after inactivity</li>
            </ul>
          </section>

          {/* Infrastructure Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Infrastructure Security</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cloud Infrastructure:</strong> Hosted on industry-leading cloud providers (AWS) with SOC 2 compliance</li>
              <li><strong>Network Security:</strong> Firewalls, intrusion detection/prevention systems</li>
              <li><strong>DDoS Protection:</strong> Rate limiting and DDoS mitigation</li>
              <li><strong>Security Headers:</strong> HSTS, CSP, X-Frame-Options, X-Content-Type-Options</li>
              <li><strong>Regular Updates:</strong> Automated security patching and dependency updates</li>
            </ul>
          </section>

          {/* Application Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Application Security</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>OWASP Top 10 Protection:</strong> Guards against SQL injection, XSS, CSRF, and other common vulnerabilities</li>
              <li><strong>Input Validation:</strong> All user inputs validated and sanitized</li>
              <li><strong>CSRF Protection:</strong> Anti-CSRF tokens on all state-changing operations</li>
              <li><strong>Rate Limiting:</strong> Protection against brute force and abuse</li>
              <li><strong>Secure Dependencies:</strong> Regular dependency scanning and updates</li>
              <li><strong>Code Reviews:</strong> Security-focused code reviews before deployment</li>
            </ul>
          </section>

          {/* Monitoring and Logging */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Monitoring and Logging</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Audit Logging:</strong> Comprehensive logs of all user actions and system events</li>
              <li><strong>Security Monitoring:</strong> Real-time detection of suspicious activity</li>
              <li><strong>Alert System:</strong> Automated alerts for security incidents</li>
              <li><strong>Log Retention:</strong> Secure storage of logs for compliance and forensics</li>
              <li><strong>Regular Reviews:</strong> Periodic security log analysis</li>
            </ul>
          </section>

          {/* Incident Response */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Incident Response (Security Incident Management)</h2>
            <p className="mb-4">
              We have established incident response procedures to handle security incidents effectively:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Incident Detection:</strong> 24/7 monitoring and automated alerting</li>
              <li><strong>Response Team:</strong> Dedicated security team for incident handling</li>
              <li><strong>Containment:</strong> Immediate action to contain and mitigate incidents</li>
              <li><strong>Investigation:</strong> Root cause analysis and forensic investigation</li>
              <li><strong>Notification:</strong> Timely notification to affected users and authorities as required by law (GDPR 72-hour rule)</li>
              <li><strong>Remediation:</strong> Fix vulnerabilities and prevent recurrence</li>
              <li><strong>Documentation:</strong> Comprehensive incident reports and lessons learned</li>
            </ul>
          </section>

          {/* Vulnerability Reporting */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Vulnerability Reporting (Responsible Disclosure)</h2>
            <p className="mb-4">
              We welcome security researchers and users to report security vulnerabilities responsibly.
              If you discover a security issue, please report it to us:
            </p>

            <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 my-6">
              <h3 className="text-lg font-semibold mb-3">How to Report a Security Vulnerability</h3>
              <ul className="list-none space-y-2">
                <li><strong>Email:</strong> security@nextsaas.com</li>
                <li><strong>Subject:</strong> "Security Vulnerability Report - [Brief Description]"</li>
                <li><strong>Include:</strong>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Detailed description of the vulnerability</li>
                    <li>Steps to reproduce</li>
                    <li>Potential impact</li>
                    <li>Suggested remediation (if any)</li>
                    <li>Your contact information</li>
                  </ul>
                </li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">Our Commitment</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>We will acknowledge your report within 48 hours</li>
              <li>We will investigate and validate the vulnerability</li>
              <li>We will keep you informed of our progress</li>
              <li>We will credit you (if desired) once the issue is resolved</li>
              <li>We will not take legal action against researchers acting in good faith</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Safe Harbor</h3>
            <p>
              We will not pursue legal action against security researchers who:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Report vulnerabilities promptly and in good faith</li>
              <li>Avoid privacy violations and data destruction</li>
              <li>Do not exploit vulnerabilities beyond necessary testing</li>
              <li>Give us reasonable time to fix issues before public disclosure</li>
            </ul>
          </section>

          {/* Compliance */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Compliance and Certifications</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>GDPR Compliant:</strong> Full compliance with EU data protection regulations</li>
              <li><strong>UK GDPR:</strong> Compliant with UK data protection laws</li>
              <li><strong>ICO Registered:</strong> Registered with UK Information Commissioner's Office</li>
              <li><strong>PCI-DSS:</strong> Payment data handled via PCI-DSS compliant providers (Stripe, Razorpay, Cashfree)</li>
              <li><strong>SOC 2 Ready:</strong> Working towards SOC 2 Type II certification</li>
            </ul>
          </section>

          {/* Employee Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Employee Security</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Background Checks:</strong> Security screening for all employees</li>
              <li><strong>Confidentiality Agreements:</strong> All staff bound by confidentiality agreements</li>
              <li><strong>Security Training:</strong> Regular security awareness training</li>
              <li><strong>Access Reviews:</strong> Quarterly review of employee access rights</li>
              <li><strong>Offboarding:</strong> Immediate access revocation upon termination</li>
            </ul>
          </section>

          {/* Contact Us */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="mb-2">For security-related inquiries:</p>
            <ul className="list-none mt-4">
              <li><strong>Security Issues:</strong> security@nextsaas.com</li>
              <li><strong>General Privacy:</strong> privacy@nextsaas.com</li>
              <li><strong>Support:</strong> support@nextsaas.com</li>
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
              <Link to="/dpa" className="text-indigo-600 hover:underline">
                Data Processing Agreement
              </Link>
            </p>
          </section>
        </div>
      </main>
    </Layout>
  );
};
