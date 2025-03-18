
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useStripe } from '@/hooks/use-stripe';
import { formatCurrency } from '@/lib/utils';

interface PaymentHistoryProps {
  className?: string;
  limit?: number;
}

export const PaymentHistory = ({ className, limit }: PaymentHistoryProps) => {
  const { paymentHistory, isPaymentHistoryLoading } = useStripe();
  
  const formattedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const displayedPayments = limit ? paymentHistory?.slice(0, limit) : paymentHistory;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>Your recent payment transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {isPaymentHistoryLoading ? (
          <p className="text-center text-muted-foreground py-4">Loading payment history...</p>
        ) : !displayedPayments?.length ? (
          <p className="text-center text-muted-foreground py-4">No payments found</p>
        ) : (
          <div className="space-y-4">
            {displayedPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="space-y-1">
                  <p className="font-medium">{payment.description || 'Payment'}</p>
                  <p className="text-sm text-muted-foreground">{formattedDate(payment.created_at)}</p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="font-medium">
                    {formatCurrency(payment.amount / 100)}
                  </p>
                  <p className={`text-sm ${payment.status === 'succeeded' ? 'text-green-500' : 'text-amber-500'}`}>
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
