import { useState, useEffect } from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';

export const NetworkErrorBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [networkError, setNetworkError] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => {
      setIsOffline(false);
      setIsVisible(false);
      if (networkError) {
        toast({
          title: 'Connection restored',
          description: 'You are back online.',
        });
        setNetworkError(null);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setIsVisible(true);
      toast({
        title: 'You are offline',
        description: 'Please check your internet connection.',
        variant: 'error',
      });
    };

    // Listen for network error events from API client
    const handleNetworkError = (event: CustomEvent) => {
      const error = event.detail;
      setNetworkError(error);
      setIsVisible(true);
      
      toast({
        title: error.isTimeout ? 'Request timeout' : 'Network error',
        description: error.isOffline 
          ? 'You are offline. Please check your internet connection.'
          : error.isTimeout
          ? 'The request took too long. Please try again.'
          : 'Unable to connect to the server. Please try again.',
        variant: 'error',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('network-error', handleNetworkError as EventListener);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('network-error', handleNetworkError as EventListener);
    };
  }, [networkError, toast]);

  const handleRetry = () => {
    setIsVisible(false);
    setNetworkError(null);
    window.location.reload();
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-50 border-b border-red-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-800">
              {isOffline
                ? 'You are offline'
                : networkError?.isTimeout
                ? 'Request timeout'
                : 'Network error'}
            </p>
            <p className="text-xs text-red-600">
              {isOffline
                ? 'Please check your internet connection.'
                : networkError?.isTimeout
                ? 'The request took too long. Please try again.'
                : 'Unable to connect to the server. Please try again.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isOffline && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="bg-white hover:bg-red-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-red-600 hover:text-red-700 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
