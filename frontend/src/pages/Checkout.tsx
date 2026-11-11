import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CreditCard,
  LockKeyhole,
  MapPin,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Address, PaymentIntent } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useUiStore } from '@/store/uiStore';
import { useConfig } from '@/context/ConfigContext';
import { orderService } from '@/services/orderService';
import { getErrorMessage } from '@/services/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/utils/cn';
import { formatMoney } from '@/utils/format';
import { formatCardNumber, formatExpiry, validateTestCard } from '@/utils/card';
import { Button, buttonStyles } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductImage } from '@/components/product/ProductImage';
import { StripePaymentModal } from '@/components/checkout/StripePaymentModal';
import { Badge } from '@/components/ui/Badge';

const steps = [
  { id: 0, label: 'Delivery' },
  { id: 1, label: 'Payment' },
];

const emptyAddress = (name = '', phone = ''): Address => ({
  label: 'Home',
  fullName: name,
  phone,
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'United States',
  isDefault: false,
});

export const CheckoutPage = () => {
  useDocumentTitle('Checkout');
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
  const summary = useCartStore((state) => state.summary);
  const initialized = useCartStore((state) => state.initialized);
  const refreshCart = useCartStore((state) => state.refresh);
  const config = useConfig();
  const pushActivity = useUiStore((state) => state.pushActivity);

  const [step, setStep] = useState(0);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [newAddress, setNewAddress] = useState<Address>(emptyAddress(user?.name, user?.phone));
  const [saveAddress, setSaveAddress] = useState(true);
  const [addressError, setAddressError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  const [card, setCard] = useState({ number: '', name: user?.name || '', expiry: '', cvc: '' });
  const [placing, setPlacing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [stripeIntent, setStripeIntent] = useState<PaymentIntent | null>(null);
  const [stripeOpen, setStripeOpen] = useState(false);
  const newIdempotencyKey = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `checkout-${Date.now()}`;
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);

  const addresses = user?.addresses || [];
  const isNewAddress = selectedAddressId === 'new' || addresses.length === 0;

  useEffect(() => {
    if (!selectedAddressId && user) {
      const preferred = user.addresses.find((address) => address.isDefault) || user.addresses[0];
      setSelectedAddressId(preferred?._id || 'new');
      if (!preferred) {
        setNewAddress((current) => ({ ...current, fullName: user.name, phone: user.phone || '' }));
      }
      setCard((current) => ({ ...current, name: current.name || user.name }));
    }
  }, [user, selectedAddressId]);

  const shippingAddress = useMemo(() => {
    if (!isNewAddress) {
      const selected = addresses.find((address) => address._id === selectedAddressId);
      if (selected) {
        return {
          fullName: selected.fullName,
          phone: selected.phone,
          line1: selected.line1,
          line2: selected.line2 || '',
          city: selected.city,
          state: selected.state,
          postalCode: selected.postalCode,
          country: selected.country,
        };
      }
    }
    return {
      fullName: newAddress.fullName,
      phone: newAddress.phone,
      line1: newAddress.line1,
      line2: newAddress.line2 || '',
      city: newAddress.city,
      state: newAddress.state,
      postalCode: newAddress.postalCode,
      country: newAddress.country,
    };
  }, [isNewAddress, addresses, selectedAddressId, newAddress]);

  const goToPayment = (event?: FormEvent) => {
    event?.preventDefault();
    setAddressError('');
    if (isNewAddress) {
      const required: (keyof Address)[] = ['fullName', 'phone', 'line1', 'city', 'state', 'postalCode', 'country'];
      if (required.some((field) => !String(newAddress[field] || '').trim())) {
        setAddressError('Please complete every required delivery field.');
        return;
      }
      if (newAddress.phone.replace(/\D/g, '').length < 6) {
        setAddressError('Please enter a valid phone number for delivery.');
        return;
      }
    }
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaid = async (orderId: string) => {
    await refreshCart();
    pushActivity({
      title: 'Order confirmed',
      message: 'Payment verified. Your pieces are being prepared.',
      href: `/orders/${orderId}`,
      actionLabel: 'Track order',
      tone: 'accent',
    });
    navigate(`/checkout/success/${orderId}`, { replace: true });
  };

  const placeOrder = async () => {
    if (!user) return;
    setPaymentError('');

    if (paymentMethod === 'card' && !config.payments.stripeEnabled) {
      const cardError = validateTestCard(card);
      if (cardError) {
        setPaymentError(cardError);
        return;
      }
    }

    setPlacing(true);
    let orderId = pendingOrderId;

    try {
      if (!orderId) {
        const { order } = await orderService.create({
          shippingAddress,
          paymentMethod,
          saveAddress: isNewAddress && saveAddress,
          idempotencyKey,
        });
        orderId = order._id;
        setPendingOrderId(order._id);

        if (paymentMethod === 'cod') {
          await refreshCart();
          pushActivity({
            title: 'Order placed',
            message: 'Cash on delivery selected. Your order is being prepared.',
            href: `/orders/${order._id}`,
            actionLabel: 'Track order',
            tone: 'accent',
          });
          toast.success('Order placed successfully.');
          navigate(`/checkout/success/${order._id}`, { replace: true });
          return;
        }
      }

      const intent = await orderService.createPaymentIntent(orderId);

      if (intent.provider === 'stripe') {
        setStripeIntent(intent);
        setStripeOpen(true);
        return;
      }

      await orderService.confirmPayment(orderId, intent.confirmationRef);
      await handlePaid(orderId);
    } catch (error) {
      if (orderId) {
        try {
          const current = await orderService.get(orderId);
          if (current.paymentStatus === 'paid') {
            await handlePaid(orderId);
            return;
          }
        } catch {
          /* Preserve the original payment error. */
        }
      }
      setPaymentError(getErrorMessage(error));
    } finally {
      setPlacing(false);
    }
  };

  const onStripePaid = async (paymentIntentId: string) => {
    if (!pendingOrderId) return;
    await orderService.confirmPayment(pendingOrderId, paymentIntentId);
    setStripeOpen(false);
    await handlePaid(pendingOrderId);
  };

  const abandonPendingOrder = async () => {
    if (!pendingOrderId) return;
    try {
      await orderService.cancel(pendingOrderId, 'Payment cancelled by customer.');
      setPendingOrderId(null);
      setIdempotencyKey(newIdempotencyKey());
      setPaymentError('');
      setStripeIntent(null);
      toast.success('Attempt cancelled. Your bag is unchanged.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (!initialized) {
    return (
      <div className="container-premium py-24 text-center">
        <span className="text-[10px] uppercase tracking-[0.22em] text-white/35">Preparing secure checkout</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-premium py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          description="Add a piece to your bag before checking out. Your selection will be held here when you return."
          action={<Link to="/shop" className={buttonStyles('primary', 'md')}>Explore the collection</Link>}
        />
      </div>
    );
  }

  return (
    <div className="container-premium pb-10 pt-8 sm:pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <Link to="/cart" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-white/30 transition hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to bag
          </Link>
          <h1 className="mt-3 text-[32px] leading-none tracking-[-0.045em] text-pearl sm:text-[42px]">Secure checkout.</h1>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-4 py-2 text-[9px] uppercase tracking-[0.16em] text-white/35">
          <LockKeyhole className="h-3 w-3 text-emerald-300/70" /> Encrypted & server verified
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        {steps.map((entry, index) => (
          <div key={entry.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (index < step) setStep(index);
              }}
              disabled={index > step}
              className={cn(
                'flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.14em] transition',
                index === step
                  ? 'border-accent/30 bg-accent/10 text-accent-light'
                  : index < step
                    ? 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300/70'
                    : 'border-white/[0.07] text-white/25'
              )}
            >
              <span className={cn('flex h-4 w-4 items-center justify-center rounded-full border text-[8px]', index === step ? 'border-accent/40' : index < step ? 'border-emerald-400/30' : 'border-white/15')}>
                {index < step ? <Check className="h-2.5 w-2.5" /> : index + 1}
              </span>
              {entry.label}
            </button>
            {index < steps.length - 1 && <span className="h-px w-8 bg-white/[0.08]" />}
          </div>
        ))}
        <span className="ml-auto hidden items-center gap-2 text-[10px] text-white/20 sm:flex">
          <ShieldCheck className="h-3.5 w-3.5" /> Test mode may be active · no real charge is made without Stripe keys
        </span>
      </div>

      <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
        <div className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            {step === 0 ? (
              <motion.div
                key="delivery"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={goToPayment}>
                  <section className="rounded-[26px] border border-white/[0.07] bg-white/[0.022] p-6 sm:p-8">
                    <div className="flex items-center gap-3 border-b border-white/[0.06] pb-5">
                      <MapPin className="h-4 w-4 text-accent/70" />
                      <div>
                        <h2 className="text-[17px] text-pearl">Where should it arrive?</h2>
                        <p className="mt-0.5 text-[10px] text-white/30">Complimentary delivery over {formatMoney(config.freeShippingThreshold, 'USD', false)}.</p>
                      </div>
                    </div>

                    {addresses.length > 0 && (
                      <div className="mt-6 space-y-2.5">
                        {addresses.map((address) => (
                          <button
                            key={address._id}
                            type="button"
                            onClick={() => {
                              setSelectedAddressId(address._id || 'new');
                              setAddressError('');
                            }}
                            className={cn(
                              'flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition',
                              selectedAddressId === address._id
                                ? 'border-accent/35 bg-accent/[0.05]'
                                : 'border-white/[0.07] bg-white/[0.015] hover:border-white/[0.14]'
                            )}
                          >
                            <span
                              className={cn(
                                'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                                selectedAddressId === address._id ? 'border-accent bg-accent text-ink' : 'border-white/20'
                              )}
                            >
                              {selectedAddressId === address._id && <Check className="h-2.5 w-2.5" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2 text-[12px] text-white/75">
                                {address.label || 'Address'}
                                {address.isDefault && <Badge tone="accent" className="px-1.5 py-0.5 text-[8px]">Default</Badge>}
                              </span>
                              <span className="mt-1.5 block text-[11px] leading-relaxed text-white/35">
                                {address.fullName} · {address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} {address.postalCode}, {address.country}
                              </span>
                            </span>
                          </button>
                        ))}

                        <button
                          type="button"
                          onClick={() => setSelectedAddressId('new')}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition',
                            selectedAddressId === 'new'
                              ? 'border-accent/35 bg-accent/[0.05]'
                              : 'border-dashed border-white/[0.1] hover:border-white/[0.2]'
                          )}
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/15 text-white/40">
                            <Plus className="h-3 w-3" />
                          </span>
                          <span className="text-[11px] text-white/50">Deliver to a new address</span>
                        </button>
                      </div>
                    )}

                    {(isNewAddress || addresses.length === 0) && (
                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <FormField label="Full name" htmlFor="checkout-name">
                          <input
                            id="checkout-name"
                            value={newAddress.fullName}
                            onChange={(event) => setNewAddress({ ...newAddress, fullName: event.target.value })}
                            className="field"
                            required={isNewAddress}
                            autoComplete="name"
                          />
                        </FormField>
                        <FormField label="Phone" htmlFor="checkout-phone">
                          <input
                            id="checkout-phone"
                            value={newAddress.phone}
                            onChange={(event) => setNewAddress({ ...newAddress, phone: event.target.value })}
                            className="field"
                            required={isNewAddress}
                            autoComplete="tel"
                            placeholder="+1 415 555 0100"
                          />
                        </FormField>
                        <FormField label="Street address" htmlFor="checkout-line1" className="sm:col-span-2">
                          <input
                            id="checkout-line1"
                            value={newAddress.line1}
                            onChange={(event) => setNewAddress({ ...newAddress, line1: event.target.value })}
                            className="field"
                            required={isNewAddress}
                            autoComplete="address-line1"
                          />
                        </FormField>
                        <FormField label="Apartment, suite (optional)" htmlFor="checkout-line2" className="sm:col-span-2">
                          <input
                            id="checkout-line2"
                            value={newAddress.line2 || ''}
                            onChange={(event) => setNewAddress({ ...newAddress, line2: event.target.value })}
                            className="field"
                            autoComplete="address-line2"
                          />
                        </FormField>
                        <FormField label="City" htmlFor="checkout-city">
                          <input
                            id="checkout-city"
                            value={newAddress.city}
                            onChange={(event) => setNewAddress({ ...newAddress, city: event.target.value })}
                            className="field"
                            required={isNewAddress}
                            autoComplete="address-level2"
                          />
                        </FormField>
                        <FormField label="State / region" htmlFor="checkout-state">
                          <input
                            id="checkout-state"
                            value={newAddress.state}
                            onChange={(event) => setNewAddress({ ...newAddress, state: event.target.value })}
                            className="field"
                            required={isNewAddress}
                            autoComplete="address-level1"
                          />
                        </FormField>
                        <FormField label="Postal code" htmlFor="checkout-postal">
                          <input
                            id="checkout-postal"
                            value={newAddress.postalCode}
                            onChange={(event) => setNewAddress({ ...newAddress, postalCode: event.target.value })}
                            className="field"
                            required={isNewAddress}
                            autoComplete="postal-code"
                          />
                        </FormField>
                        <FormField label="Country" htmlFor="checkout-country">
                          <input
                            id="checkout-country"
                            value={newAddress.country}
                            onChange={(event) => setNewAddress({ ...newAddress, country: event.target.value })}
                            className="field"
                            required={isNewAddress}
                            autoComplete="country-name"
                          />
                        </FormField>
                        <label className="flex items-center gap-2.5 text-[10px] text-white/35 sm:col-span-2">
                          <input
                            type="checkbox"
                            checked={saveAddress}
                            onChange={(event) => setSaveAddress(event.target.checked)}
                            className="h-3.5 w-3.5 accent-[#C7A17A]"
                          />
                          Save this address for next time
                        </label>
                      </div>
                    )}

                    {addressError && (
                      <p className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-[11px] text-red-200" role="alert">
                        {addressError}
                      </p>
                    )}

                    <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-6">
                      <div className="flex items-center gap-2 text-[10px] text-white/25">
                        <Truck className="h-3.5 w-3.5" /> Standard delivery · 1–2 business days
                      </div>
                      <Button type="submit" size="md">
                        Continue to payment <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </section>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="payment"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <section className="rounded-[26px] border border-white/[0.07] bg-white/[0.022] p-6 sm:p-8">
                  <div className="flex items-center gap-3 border-b border-white/[0.06] pb-5">
                    <CreditCard className="h-4 w-4 text-accent/70" />
                    <div>
                      <h2 className="text-[17px] text-pearl">How would you like to pay?</h2>
                      <p className="mt-0.5 text-[10px] text-white/30">Payment is verified on our server before your order is confirmed.</p>
                    </div>
                  </div>

                  {pendingOrderId && (
                    <div className="mt-5 rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] px-4 py-3">
                      <p className="text-[11px] text-amber-100/80">A payment attempt is open for this order.</p>
                      <p className="mt-1 text-[10px] text-white/30">Retry the payment, or cancel the attempt to release your reserved pieces.</p>
                      <button type="button" onClick={abandonPendingOrder} className="mt-2 text-[10px] text-white/40 underline decoration-white/20 underline-offset-4 hover:text-white">
                        Cancel payment attempt
                      </button>
                    </div>
                  )}

                  <div className="mt-5 grid gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      disabled={Boolean(pendingOrderId)}
                      className={cn(
                        'flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60',
                        paymentMethod === 'card'
                          ? 'border-accent/35 bg-accent/[0.05]'
                          : 'border-white/[0.07] bg-white/[0.015] hover:border-white/[0.14]'
                      )}
                    >
                      <span className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border', paymentMethod === 'card' ? 'border-accent bg-accent text-ink' : 'border-white/20')}>
                        {paymentMethod === 'card' && <Check className="h-2.5 w-2.5" />}
                      </span>
                      <CreditCard className="mt-0.5 h-4 w-4 text-white/45" />
                      <span className="flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[12px] text-white/75">Credit or debit card</span>
                          <Badge tone={config.payments.stripeEnabled ? 'info' : 'warning'} className="px-1.5 py-0.5 text-[8px]">
                            {config.payments.stripeEnabled ? 'Stripe' : 'Test mode'}
                          </Badge>
                        </span>
                        <span className="mt-1 block text-[10px] leading-relaxed text-white/30">
                          {config.payments.stripeEnabled
                            ? 'Secure card entry via Stripe. Your details never touch our servers.'
                            : 'Sandbox processor for this demo. No real charge. Use test card 4242 4242 4242 4242.'}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      disabled={Boolean(pendingOrderId)}
                      className={cn(
                        'flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60',
                        paymentMethod === 'cod'
                          ? 'border-accent/35 bg-accent/[0.05]'
                          : 'border-white/[0.07] bg-white/[0.015] hover:border-white/[0.14]'
                      )}
                    >
                      <span className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border', paymentMethod === 'cod' ? 'border-accent bg-accent text-ink' : 'border-white/20')}>
                        {paymentMethod === 'cod' && <Check className="h-2.5 w-2.5" />}
                      </span>
                      <Banknote className="mt-0.5 h-4 w-4 text-white/45" />
                      <span className="flex-1">
                        <span className="text-[12px] text-white/75">Cash on delivery</span>
                        <span className="mt-1 block text-[10px] leading-relaxed text-white/30">
                          Pay the courier when your order arrives. Available on all orders.
                        </span>
                      </span>
                    </button>
                  </div>

                  {paymentMethod === 'card' && !config.payments.stripeEnabled && (
                    <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.015] p-5">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Test card details</p>
                        <button
                          type="button"
                          onClick={() => setCard({ number: '4242 4242 4242 4242', name: user?.name || 'Test Owner', expiry: '12/34', cvc: '123' })}
                          className="text-[10px] text-accent-light/80 transition hover:text-accent"
                        >
                          Fill test card
                        </button>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label="Card number" htmlFor="card-number" className="sm:col-span-2">
                          <input
                            id="card-number"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            value={card.number}
                            onChange={(event) => setCard({ ...card, number: formatCardNumber(event.target.value) })}
                            className="field font-mono tracking-wider"
                            placeholder="4242 4242 4242 4242"
                            maxLength={23}
                          />
                        </FormField>
                        <FormField label="Name on card" htmlFor="card-name" className="sm:col-span-2">
                          <input
                            id="card-name"
                            autoComplete="cc-name"
                            value={card.name}
                            onChange={(event) => setCard({ ...card, name: event.target.value })}
                            className="field"
                            placeholder="As printed on the card"
                          />
                        </FormField>
                        <FormField label="Expiry" htmlFor="card-expiry">
                          <input
                            id="card-expiry"
                            inputMode="numeric"
                            autoComplete="cc-exp"
                            value={card.expiry}
                            onChange={(event) => setCard({ ...card, expiry: formatExpiry(event.target.value) })}
                            className="field font-mono"
                            placeholder="MM/YY"
                            maxLength={5}
                          />
                        </FormField>
                        <FormField label="CVC" htmlFor="card-cvc">
                          <input
                            id="card-cvc"
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            value={card.cvc}
                            onChange={(event) => setCard({ ...card, cvc: event.target.value.replace(/\D/g, '').slice(0, 4) })}
                            className="field font-mono"
                            placeholder="123"
                            maxLength={4}
                          />
                        </FormField>
                      </div>
                      <p className="mt-3 flex items-center gap-1.5 text-[9px] leading-relaxed text-white/25">
                        <ShieldCheck className="h-3 w-3 text-emerald-300/60" />
                        Test mode: card fields are validated in your browser only. Only a server-issued payment token is sent to the API.
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'card' && config.payments.stripeEnabled && (
                    <div className="mt-6 rounded-2xl border border-sky-400/15 bg-sky-400/[0.04] px-4 py-3">
                      <p className="text-[10px] leading-relaxed text-sky-100/60">
                        After you place the order, a secure Stripe payment sheet will open. Your card details are
                        handled directly by Stripe and verified on the server before confirmation.
                      </p>
                    </div>
                  )}

                  {paymentError && (
                    <p className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-[11px] leading-relaxed text-red-200" role="alert">
                      {paymentError}
                    </p>
                  )}

                  <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(0);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 px-5 text-[11px] text-white/45 transition hover:border-white/25 hover:text-white"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Delivery
                    </button>
                    <Button
                      type="button"
                      size="lg"
                      className="flex-1 sm:flex-none sm:min-w-[240px]"
                      loading={placing}
                      onClick={placeOrder}
                      disabled={stripeOpen}
                    >
                      {!placing && <LockKeyhole className="h-4 w-4" />}
                      {paymentMethod === 'cod' ? `Place order · ${formatMoney(summary.totalAmount)}` : `Pay ${formatMoney(summary.totalAmount)}`}
                    </Button>
                  </div>

                  <p className="mt-3 text-center text-[9px] leading-relaxed text-white/20 sm:text-left">
                    By placing this order you agree to our{' '}
                    <Link to="/about#returns" className="text-white/35 underline decoration-white/15 underline-offset-4 hover:text-white">
                      returns policy
                    </Link>{' '}
                    and{' '}
                    <Link to="/about#warranty" className="text-white/35 underline decoration-white/15 underline-offset-4 hover:text-white">
                      warranty terms
                    </Link>.
                  </p>
                </section>

                <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/35">
                      <MapPin className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/25">Delivering to</p>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-white/50">
                        {shippingAddress.fullName} · {shippingAddress.line1}, {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}, {shippingAddress.country}
                      </p>
                    </div>
                    <button type="button" onClick={() => setStep(0)} className="text-[10px] text-white/35 transition hover:text-white">
                      Change
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="overflow-hidden rounded-[26px] border border-white/[0.07] bg-white/[0.025]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <h2 className="text-[14px] text-pearl">Order summary</h2>
              <span className="text-[10px] text-white/25">{summary.count} pieces</span>
            </div>
            <div className="max-h-[280px] space-y-3 overflow-y-auto px-5 py-4">
              {items.map((item) => (
                <div key={item._id} className="flex gap-3">
                  <div className="relative h-[64px] w-[54px] shrink-0 overflow-hidden rounded-xl product-well">
                    <ProductImage src={item.product.images[0]} alt={item.product.name} />
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[8px] text-white/70">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] text-white/65">{item.product.name}</p>
                    <p className="mt-1 text-[9px] text-white/25">{[item.color, item.size].filter(Boolean).join(' · ') || 'Standard'}</p>
                    <p className="mt-1.5 text-[10px] tabular-nums text-white/40">{formatMoney(item.lineTotal, 'USD', false)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2.5 border-t border-white/[0.06] px-5 py-4 text-[11px]">
              <div className="flex justify-between text-white/35"><span>Subtotal</span><span className="tabular-nums text-white/65">{formatMoney(summary.subtotal)}</span></div>
              <div className="flex justify-between text-white/35"><span>Delivery</span><span className={cn('tabular-nums', summary.shippingCost === 0 ? 'text-emerald-300/70' : 'text-white/65')}>{summary.shippingCost === 0 ? 'Complimentary' : formatMoney(summary.shippingCost)}</span></div>
              <div className="flex justify-between text-white/35"><span>Estimated tax</span><span className="tabular-nums text-white/65">{formatMoney(summary.tax)}</span></div>
              <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
                <span className="text-[12px] text-white/55">Total</span>
                <span className="text-[22px] tracking-[-0.03em] tabular-nums text-pearl">{formatMoney(summary.totalAmount)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-white/[0.06] px-5 py-3.5 text-[9px] uppercase tracking-[0.14em] text-white/20">
              <Package className="h-3 w-3" /> Complimentary returns within 30 days
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300/60" />
            <p className="text-[9px] leading-relaxed text-white/25">
              Every payment is verified on the server against the order total. Duplicate or manipulated confirmations
              are rejected automatically.
            </p>
          </div>
        </aside>
      </div>

      {stripeIntent && (
        <StripePaymentModal
          open={stripeOpen}
          onClose={() => {
            setStripeOpen(false);
            setPaymentError('Payment was not completed. Your reserved pieces are still waiting — retry or cancel the attempt.');
          }}
          clientSecret={stripeIntent.clientSecret}
          publishableKey={stripeIntent.publishableKey}
          amount={summary.totalAmount}
          orderNumber={stripeIntent.orderNumber}
          onPaid={onStripePaid}
        />
      )}
    </div>
  );
};
