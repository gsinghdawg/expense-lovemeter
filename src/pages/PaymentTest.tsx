
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const PaymentTest = () => {
  const navigate = useNavigate();

  const simulateSuccessfulPayment = () => {
    // Simulate redirect from Stripe with success parameter
    window.location.href = `${window.origin}/?payment_success=true`;
  };

  const simulateCancelledPayment = () => {
    // Simulate redirect from Stripe with cancelled parameter
    window.location.href = `${window.origin}/pricing?payment_cancelled=true`;
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <Button onClick={goBack} variant="outline" className="mb-6">
        Go Back
      </Button>
      
      <h1 className="text-3xl font-bold mb-6">Payment Testing Page</h1>
      <p className="text-muted-foreground mb-8">
        This page is for testing payment flows without making real payments.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Successful Payment</CardTitle>
            <CardDescription>
              Test the successful payment flow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              This will simulate a redirect from Stripe after a successful payment.
              It should show a success toast and redirect you to the main app.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={simulateSuccessfulPayment} className="w-full">
              Simulate Successful Payment
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Cancelled Payment</CardTitle>
            <CardDescription>
              Test the cancelled payment flow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              This will simulate a redirect from Stripe after cancelling payment.
              It should show a cancellation toast on the pricing page.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={simulateCancelledPayment} variant="destructive" className="w-full">
              Simulate Cancelled Payment
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-2">Note:</h3>
        <p>This page is for testing purposes only and does not process any real payments.</p>
      </div>
    </div>
  );
};

export default PaymentTest;
