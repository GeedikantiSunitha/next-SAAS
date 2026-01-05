/**
 * Newsletter Settings Page
 * 
 * User-facing page for newsletter subscription management
 */

import { Layout } from '../components/Layout';
import { NewsletterSubscription } from '../components/NewsletterSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export const NewsletterSettings = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Newsletter Settings</h1>
            <p className="text-gray-600 mt-1">
              Manage your newsletter subscription preferences
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Newsletter Subscription</CardTitle>
              <CardDescription>
                Subscribe to receive updates, news, and announcements via email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NewsletterSubscription />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
