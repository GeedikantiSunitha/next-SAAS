/**
 * Payment Settings Page
 * 
 * User-facing page for payment management
 */

import { useState } from 'react';
import { Checkout } from '../components/Checkout';
import { PaymentHistory } from '../components/PaymentHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CreditCard, History } from 'lucide-react';

export const PaymentSettings = () => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Payment Settings</h1>

      <Tabs defaultValue="checkout" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="checkout" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Make Payment
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Payment History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkout" className="mt-6">
          <Checkout />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <PaymentHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};
