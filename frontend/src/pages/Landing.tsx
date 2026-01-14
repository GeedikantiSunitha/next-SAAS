/**
 * Landing Page
 * 
 * Standard SaaS product landing page with hero section, features, and CTAs
 */

import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Layout } from '../components/Layout';
import { CheckCircle, Zap, Shield, Users } from 'lucide-react';

export const Landing = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-muted/20 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Welcome to Our Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Build amazing SaaS products with our production-ready template. 
            Get started in minutes with authentication, user management, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link to="/register">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link to="/login">Login</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              <span className="sr-only">Features</span>
              Features
            </h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to build a modern SaaS application
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Fast & Secure</CardTitle>
                <CardDescription>
                  Built with modern technologies for optimal performance and security
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Production Ready</CardTitle>
                <CardDescription>
                  Includes authentication, RBAC, password strength validation, and more
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Complete user profile management with React Query integration
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CheckCircle className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Feature Flags</CardTitle>
                <CardDescription>
                  Enable or disable features dynamically via environment variables
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>API Versioning</CardTitle>
                <CardDescription>
                  Support multiple API versions for smooth migrations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CheckCircle className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Product Safeguards</CardTitle>
                <CardDescription>
                  Idempotency and confirmation dialogs prevent data loss
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

