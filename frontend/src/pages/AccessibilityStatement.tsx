import React from 'react';
import { SkipToContent } from '../components/accessibility/SkipToContent';
import { usePlatformShortcuts } from '../hooks/usePlatformShortcuts';

export const AccessibilityStatement: React.FC = () => {
  const { modifier, alt } = usePlatformShortcuts();
  return (
    <>
      <SkipToContent targetId="main-content" />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <main id="main-content" tabIndex={-1} className="bg-white shadow rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Accessibility Statement
            </h1>

            <div className="prose prose-lg text-gray-700 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                  Our Commitment
                </h2>
                <p>
                  We are committed to ensuring digital accessibility for people with disabilities.
                  We are continually improving the user experience for everyone and applying the
                  relevant accessibility standards.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                  Conformance Status
                </h2>
                <p>
                  The Web Content Accessibility Guidelines (WCAG) defines requirements for
                  designers and developers to improve accessibility for people with disabilities.
                  It defines three levels of conformance: Level A, Level AA, and Level AAA.
                </p>
                <p>
                  <strong>This website is fully conformant with WCAG 2.1 Level AA.</strong>
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                  Accessibility Features
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Keyboard navigation support throughout the application</li>
                  <li>Screen reader compatibility</li>
                  <li>High contrast mode for better visibility</li>
                  <li>Reduced motion option for users sensitive to animations</li>
                  <li>Adjustable font sizes</li>
                  <li>Skip navigation links</li>
                  <li>ARIA labels and landmarks</li>
                  <li>Focus indicators on interactive elements</li>
                  <li>Alternative text for images</li>
                  <li>Proper heading structure</li>
                  <li>Color contrast ratio of at least 4.5:1 for normal text</li>
                  <li>Form labels and error messages</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                  Keyboard Shortcuts
                </h2>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left py-2">Action</th>
                        <th className="text-left py-2">Shortcut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300">
                      <tr>
                        <td className="py-2">Skip to main content</td>
                        <td className="py-2">
                          <kbd className="px-2 py-1 bg-white rounded">{alt} + S</kbd>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2">Toggle high contrast</td>
                        <td className="py-2">
                          <kbd className="px-2 py-1 bg-white rounded">{alt} + C</kbd>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2">Toggle reduced motion</td>
                        <td className="py-2">
                          <kbd className="px-2 py-1 bg-white rounded">{alt} + M</kbd>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2">Increase font size</td>
                        <td className="py-2">
                          <kbd className="px-2 py-1 bg-white rounded">{modifier} + +</kbd>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2">Decrease font size</td>
                        <td className="py-2">
                          <kbd className="px-2 py-1 bg-white rounded">{modifier} + -</kbd>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                  Technologies
                </h2>
                <p>Accessibility of this website relies on the following technologies:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>HTML</li>
                  <li>WAI-ARIA</li>
                  <li>CSS</li>
                  <li>JavaScript</li>
                  <li>React</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                  Assessment Methods
                </h2>
                <p>
                  We assessed the accessibility of this website using the following methods:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Automated testing with axe-core</li>
                  <li>Manual keyboard navigation testing</li>
                  <li>Screen reader testing (NVDA, JAWS, VoiceOver)</li>
                  <li>Color contrast analysis</li>
                  <li>WCAG 2.1 Level AA compliance audit</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                  Feedback
                </h2>
                <p>
                  We welcome your feedback on the accessibility of this website. Please let us
                  know if you encounter accessibility barriers:
                </p>
                <ul className="list-none space-y-2 mt-4">
                  <li>
                    <strong>Email:</strong>{' '}
                    <a href="mailto:accessibility@nextsaas.com" className="text-blue-600 underline">
                      accessibility@nextsaas.com
                    </a>
                  </li>
                  <li>
                    <strong>Response time:</strong> We aim to respond within 2 business days
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                  Legal Compliance
                </h2>
                <p>
                  This website complies with:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>UK Equality Act 2010</li>
                  <li>EU Web Accessibility Directive</li>
                  <li>Section 508 (US)</li>
                  <li>WCAG 2.1 Level AA Standards</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                  Date
                </h2>
                <p>
                  This statement was created on {new Date().toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })} and last reviewed on {new Date().toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}.
                </p>
              </section>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};