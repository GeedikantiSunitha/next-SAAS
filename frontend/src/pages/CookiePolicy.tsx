/**
 * Cookie Policy Page
 *
 * Explains cookie usage, types, and how users can manage them
 * GDPR/PECR compliant cookie policy
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';

export const CookiePolicy = () => {
  useEffect(() => {
    document.title = 'Cookie Policy | NextSaaS';
  }, []);

  return (
    <Layout>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-slate max-w-none">
          <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-gray-600 mb-8">
            <strong>Last updated:</strong> January 2026
          </p>

          {/* Introduction */}
          <section className="mb-8">
            <p className="text-lg">
              This Cookie Policy explains what cookies are, how we use them on NextSaaS, what types of cookies we use,
              and how you can control or delete them. Please read this policy carefully to understand our practices
              regarding cookies.
            </p>
          </section>

          {/* What Are Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">What Are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your computer or mobile device when you visit a website.
              They are widely used to make websites work more efficiently and provide information to website owners.
            </p>
            <p className="mt-4">
              Cookies can be "session cookies" (which are deleted when you close your browser) or "persistent cookies"
              (which remain on your device until they expire or you delete them).
            </p>
          </section>

          {/* Why We Use Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Why We Use Cookies (How We Use Cookies)</h2>
            <p>We use cookies for several important reasons:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Essential Functionality:</strong> To enable core features like user authentication and account access</li>
              <li><strong>Security:</strong> To protect your account and detect fraudulent activity</li>
              <li><strong>Performance:</strong> To understand how you use our service and improve it</li>
              <li><strong>Personalization:</strong> To remember your preferences and settings</li>
              <li><strong>Analytics:</strong> To analyze traffic and usage patterns (with your consent)</li>
              <li><strong>Marketing:</strong> To deliver relevant content and advertisements (with your consent)</li>
            </ul>
          </section>

          {/* Types of Cookies We Use */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Types of Cookies We Use (Cookies We Use)</h2>
            <p>We use the following categories of cookies:</p>

            <h3 className="text-xl font-semibold mt-6 mb-2">1. Essential Cookies (Strictly Necessary)</h3>
            <p>
              These cookies are necessary for the website to function and cannot be switched off. They are usually only
              set in response to actions you take, such as logging in or filling in forms.
            </p>
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold">Examples:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><code>session_token</code> - Authentication and session management</li>
                <li><code>csrf_token</code> - Security and CSRF protection</li>
                <li><code>cookie_consent</code> - Stores your cookie preferences</li>
              </ul>
              <p className="mt-2 text-sm"><strong>Duration:</strong> Session or 30 days</p>
              <p className="text-sm"><strong>Legal Basis:</strong> Strictly necessary for service provision</p>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-2">2. Analytics Cookies (Performance Cookies)</h3>
            <p>
              These cookies help us understand how visitors interact with our website by collecting and reporting
              information anonymously. They help us improve the website's performance and user experience.
            </p>
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold">Examples:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><code>_ga</code> - Google Analytics: Distinguishes users</li>
                <li><code>_gid</code> - Google Analytics: Distinguishes users</li>
                <li><code>_gat</code> - Google Analytics: Throttles request rate</li>
              </ul>
              <p className="mt-2 text-sm"><strong>Duration:</strong> 2 years (ga), 24 hours (gid), 1 minute (gat)</p>
              <p className="text-sm"><strong>Legal Basis:</strong> Consent required</p>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-2">3. Functional Cookies (Preference Cookies)</h3>
            <p>
              These cookies enable enhanced functionality and personalization, such as remembering your preferences,
              language selection, and region.
            </p>
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold">Examples:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><code>user_preferences</code> - Stores UI preferences (theme, language)</li>
                <li><code>notification_settings</code> - Notification preferences</li>
              </ul>
              <p className="mt-2 text-sm"><strong>Duration:</strong> 1 year</p>
              <p className="text-sm"><strong>Legal Basis:</strong> Consent required</p>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-2">4. Marketing Cookies (Advertising Cookies)</h3>
            <p>
              These cookies are used to deliver advertisements that are relevant to you and your interests. They may be
              set by our advertising partners through our site.
            </p>
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold">Examples:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><code>_fbp</code> - Facebook Pixel: Tracks conversions and user behavior</li>
                <li><code>IDE</code> - Google DoubleClick: Serves targeted advertisements</li>
              </ul>
              <p className="mt-2 text-sm"><strong>Duration:</strong> 3 months (fbp), 1 year (IDE)</p>
              <p className="text-sm"><strong>Legal Basis:</strong> Consent required</p>
            </div>
          </section>

          {/* Third-Party Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Third-Party Cookies</h2>
            <p>
              In addition to our own cookies, we use third-party cookies from trusted partners to provide analytics,
              advertising, and other services. These partners may use cookies to collect information about your online
              activities across different websites.
            </p>
            <p className="mt-4">Our third-party partners include:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Google Analytics:</strong> Website analytics and user behavior tracking</li>
              <li><strong>Facebook:</strong> Social media integration and advertising</li>
              <li><strong>Stripe:</strong> Payment processing (essential)</li>
              <li><strong>Cloudflare:</strong> Security and performance optimization</li>
            </ul>
          </section>

          {/* How to Manage Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How to Manage and Control Cookies</h2>
            <p>
              You have several options to manage and control cookies:
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-2">Cookie Consent Banner</h3>
            <p>
              When you first visit our website, you'll see a cookie consent banner where you can choose to accept all
              cookies, accept only essential cookies, or customize your preferences.
            </p>
            <p className="mt-4">
              You can change your cookie preferences at any time by visiting your{' '}
              <Link to="/gdpr-settings" className="text-blue-600 hover:text-blue-800 underline">
                Cookie Settings (GDPR Settings)
              </Link>.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-2">Browser Settings (Browser Preferences)</h3>
            <p>
              You can also control cookies through your browser settings. Most browsers allow you to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>View and delete cookies</li>
              <li>Block third-party cookies</li>
              <li>Block cookies from specific websites</li>
              <li>Block all cookies</li>
              <li>Delete all cookies when you close your browser</li>
            </ul>
            <p className="mt-4">
              Please note that blocking or deleting cookies may affect your user experience and some features may not
              work properly.
            </p>

            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <p className="font-semibold mb-2">Browser-Specific Instructions:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and data stored</li>
              </ul>
            </div>
          </section>

          {/* Do Not Track */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Do Not Track Signals</h2>
            <p>
              Some browsers have a "Do Not Track" (DNT) feature that signals to websites that you do not want to be tracked.
              We respect DNT signals and will not track users who have enabled this feature for non-essential cookies.
            </p>
          </section>

          {/* Changes to Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to This Cookie Policy (Updates to Policy)</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in our practices, technology, or
              legal requirements. We will notify you of any significant changes by:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Posting the updated policy on this page</li>
              <li>Updating the "Last updated" date at the top</li>
              <li>Sending you an email notification (for material changes)</li>
            </ul>
            <p className="mt-4">
              We encourage you to review this Cookie Policy periodically to stay informed about how we use cookies.
            </p>
          </section>

          {/* Contact Us */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us (Questions)</h2>
            <p>
              If you have any questions about this Cookie Policy or our use of cookies, please contact us:
            </p>
            <ul className="list-none mt-4">
              <li><strong>Email:</strong> privacy@nextsaas.com</li>
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
                <Link to="/terms" className="text-blue-600 hover:text-blue-800 underline">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/gdpr-settings" className="text-blue-600 hover:text-blue-800 underline">
                  Manage Cookie Preferences (Cookie Settings)
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </Layout>
  );
};
