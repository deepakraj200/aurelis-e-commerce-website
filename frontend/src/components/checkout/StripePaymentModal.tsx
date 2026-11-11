import { useState, type FormEvent } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { formatMoney } from '@/utils/format';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

let cachedKey = '';
let cachedStripe: Promise<Stripe | null> | null = null;

const getStripe = (publishableKey: string) => {
  if (!cachedStripe || cachedKey !== publishableKey) {
    cachedKey = publishableKey;
    cachedStripe = loadStripe(publishableKey);
  }
  return cachedStripe;
};

const StripeForm = ({
  amount,
  orderNumber,
  onPaid,
}: {
  amount: number;
  orderNumber: string;
  onPaid: (paymentIntentId: string) => Promise<void>;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError('');

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/orders` },
        redirect: 'if_required',
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment could not be completed.');
        return;
      }
      if (paymentIntent?.status === 'succeeded') {
        await onPaid(paymentIntent.id);
      } else {
        setError('Payment was not completed. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment could not be completed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {error && (
        <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-[11px] text-red-200" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={!stripe}>
        {!submitting && <LockKeyhole className="h-4 w-4" />}
        Pay {formatMoney(amount)} securely
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-[0.16em] text-white/20">
        <ShieldCheck className="h-3 w-3" /> Order {orderNumber} · card details are handled by Stripe
      </p>
    </form>
  );
};

export const StripePaymentModal = ({
  open,
  onClose,
  clientSecret,
  publishableKey,
  amount,
  orderNumber,
  onPaid,
}: {
  open: boolean;
  onClose: () => void;
  clientSecret: string;
  publishableKey: string;
  amount: number;
  orderNumber: string;
  onPaid: (paymentIntentId: string) => Promise<void>;
}) => (
  <Modal
    open={open}
    onClose={onClose}
    title="Secure payment"
    description={`Complete your payment for order ${orderNumber}. Stock is reserved while you finish.`}
    size="sm"
  >
    {publishableKey && clientSecret ? (
      <Elements
        stripe={getStripe(publishableKey)}
        options={{
          clientSecret,
          appearance: {
            theme: 'night',
            variables: {
              colorPrimary: '#C7A17A',
              colorBackground: '#111113',
              colorText: '#F5F5F7',
              colorDanger: '#F87171',
              borderRadius: '14px',
              fontFamily: 'Inter, system-ui, sans-serif',
            },
          },
        }}
      >
        <StripeForm amount={amount} orderNumber={orderNumber} onPaid={onPaid} />
      </Elements>
    ) : (
      <p className="text-[12px] text-white/40">The payment form could not be initialised. Please try again.</p>
    )}
  </Modal>
);
