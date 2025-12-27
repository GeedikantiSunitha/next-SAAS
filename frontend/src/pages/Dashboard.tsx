import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom';
import { User as UserIcon } from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="bg-gradient-to-br from-background to-muted/20 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Welcome, {user?.name || user?.email}!</CardTitle>
              <CardDescription>
                You are successfully logged in to the application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3 text-foreground">User Information</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p className="text-sm"><strong className="text-foreground">ID:</strong> <span className="text-muted-foreground">{user?.id}</span></p>
                    <p className="text-sm"><strong className="text-foreground">Email:</strong> <span className="text-muted-foreground">{user?.email}</span></p>
                    <p className="text-sm"><strong className="text-foreground">Name:</strong> <span className="text-muted-foreground">{user?.name || 'Not set'}</span></p>
                    <p className="text-sm"><strong className="text-foreground">Role:</strong> <span className="text-muted-foreground">{user?.role}</span></p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild>
                      <Link to="/profile" className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        View Profile
                      </Link>
                    </Button>
                    <p className="text-sm text-muted-foreground flex items-center">
                      This is a basic dashboard. You can now build your application features here.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </Layout>
  );
};

