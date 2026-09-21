import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { toast } from '../components/Toast';

export function Pricing() {
  const navigate = useNavigate();
  const { user, subscription, refreshSubscription } = useAuth();

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Checkout modal state
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState('review'); // 'review' | 'payment' | 'processing' | 'success'
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Form inputs for payment
  const [cardData, setCardData] = useState({
    name: '',
    number: '',
    expiry: '',
    cvc: '',
  });
  const [mobileNumber, setMobileNumber] = useState('');

  // Load plans from API
  useEffect(() => {
    api.get('/subscriptions/plans')
      .then((data) => {
        if (Array.isArray(data)) setPlans(data);
      })
      .catch((err) => {
        console.error('Failed to load plans:', err);
        toast.error('Failed to load plans');
      })
      .finally(() => setLoadingPlans(false));
  }, []);

  // Handle plan selection
  const handleSelectPlan = async (plan) => {
    if (!user) {
      toast.error('Please sign in to select a subscription plan');
      navigate('/auth');
      return;
    }

    if (user.role === 'trainer') {
      toast.error('Trainers have a dedicated coach portal and do not require member subscriptions');
      return;
    }

    if (user.role === 'admin') {
      toast.error('Administrator accounts already have full system access');
      return;
    }

    // Free plan flow: activate immediately without checkout
    if (plan.id === 'free') {
      try {
        setProcessing(true);
        await api.post('/subscriptions/free');
        await refreshSubscription();
        toast.success('Free plan activated!');
        navigate('/dashboard');
      } catch (err) {
        console.error('Failed to activate free plan:', err);
        toast.error(err.message || 'Failed to activate plan');
      } finally {
        setProcessing(false);
      }
      return;
    }

    // Paid plan flow: Open checkout
    setSelectedPlan(plan);
    setCheckoutStep('review');
    setPaymentError('');
    setCardData({ name: user.displayName || '', number: '', expiry: '', cvc: '' });
  };

  // Step 1: Create Payment Intent on backend
  const startPayment = async () => {
    setProcessing(true);
    setPaymentError('');

    try {
      const intent = await api.post('/payments/create-intent', {
        planId: selectedPlan.id,
        paymentMethod,
      });

      setPaymentIntent(intent);
      setCheckoutStep('payment');
    } catch (err) {
      console.error('Failed to initiate payment:', err);
      setPaymentError(err.message || 'Could not initiate checkout');
    } finally {
      setProcessing(false);
    }
  };

  // Step 2: Process & Verify Payment with Backend
  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!paymentIntent) return;

    setProcessing(true);
    setPaymentError('');
    setCheckoutStep('processing');

    try {
      // Send verification request to backend with signed verification token
      const verified = await api.post('/payments/verify', {
        paymentId: paymentIntent.paymentId,
        verificationToken: paymentIntent.verificationToken,
      });

      await refreshSubscription();
      setCheckoutStep('success');
      toast.success(verified.message || 'Payment verified successfully!');
    } catch (err) {
      console.error('Payment verification error:', err);
      setCheckoutStep('payment');
      setPaymentError(err.message || 'Payment verification failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const currentPlanId = subscription?.status === 'active' ? subscription?.planId : 'free';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
      {/* Header */}
      <header className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs font-semibold text-primary mb-4 border border-primary/30">
          <Zap className="h-3.5 w-3.5" /> Transparent Fitness Memberships
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
          Choose the Perfect <span className="gradient-text">Fitness Plan</span>
        </h1>
        <p className="mt-4 text-base text-muted-foreground leading-relaxed">
          Level up your training with intelligent AI coaching, custom nutrition blueprints, and 1-on-1 certified trainer guidance.
        </p>
      </header>

      {/* Pricing Cards Grid */}
      {loadingPlans ? (
        <div className="flex justify-center items-center h-64 text-muted-foreground gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm">Loading plans...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const isPro = plan.id === 'pro';

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                  isPro
                    ? 'glass-strong border-2 border-primary shadow-glow md:-translate-y-2'
                    : 'glass border border-border/40 hover:border-border/80'
                }`}
              >
                {/* Pro Badge */}
                {isPro && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full shadow-glow uppercase tracking-wider">
                    Most Popular · Premium
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-2xl font-bold text-foreground">{plan.name}</h3>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isPro
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {plan.badge || 'Plan'}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-4xl font-extrabold tracking-tight text-foreground">
                        {plan.displayPrice}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">/{plan.billingPeriod}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {plan.price === 0 ? 'Forever free access' : 'Billed monthly, cancel anytime'}
                    </p>
                  </div>

                  <div className="h-px bg-border/40 mb-6" />

                  {/* Features list */}
                  <ul className="space-y-3.5 text-sm mb-8">
                    {plan.features?.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-foreground/90 font-medium">{f}</span>
                      </li>
                    ))}
                    {plan.lockedFeatures?.map((f, i) => (
                      <li key={`locked-${i}`} className="flex items-start gap-3 opacity-40">
                        <div className="h-5 w-5 rounded-full bg-secondary text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                          <X className="h-3 w-3" />
                        </div>
                        <span className="text-muted-foreground line-through text-xs">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Call To Action Button */}
                <div>
                  {isCurrent ? (
                    <div className="w-full py-3 rounded-xl bg-secondary/80 text-foreground font-semibold text-center text-sm border border-border/60">
                      Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={processing}
                      className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        isPro
                          ? 'bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95'
                          : 'glass border border-border/60 hover:bg-secondary text-foreground'
                      }`}
                    >
                      {plan.price === 0 ? 'Select Free' : `Upgrade to ${plan.name}`}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── CHECKOUT MODAL ──────────────────────────────────────────────── */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-up">
          <div className="glass-strong rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-border/50 shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={() => {
                if (!processing) setSelectedPlan(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-xl bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white shadow-glow">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Secure Checkout</h3>
                <p className="text-xs text-muted-foreground">FitAI Subscription Service</p>
              </div>
            </div>

            {paymentError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* STEP 1: Plan Review */}
            {checkoutStep === 'review' && (
              <div className="space-y-5">
                <div className="glass rounded-2xl p-4 border border-border/40">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-foreground text-base">{selectedPlan.name} Plan</span>
                    <span className="font-display font-extrabold text-lg text-primary">
                      {selectedPlan.displayPrice}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Billing interval: Monthly recurring</p>
                </div>

                {/* Choose Payment Method */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    Select Payment Gateway
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'card', label: 'Credit Card', icon: CreditCard },
                      { id: 'easypaisa', label: 'EasyPaisa', icon: Smartphone },
                      { id: 'jazzcash', label: 'JazzCash', icon: Smartphone },
                    ].map((m) => {
                      const Icon = m.icon;
                      const active = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                            active
                              ? 'bg-primary/15 border-primary text-primary font-semibold'
                              : 'glass border-border/40 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-xs">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                  <Lock className="h-3.5 w-3.5 text-emerald-400" />
                  <span>256-bit encrypted secure transaction</span>
                </div>

                <button
                  onClick={startPayment}
                  disabled={processing}
                  className="w-full bg-gradient-primary text-primary-foreground py-3.5 rounded-xl font-bold shadow-glow hover:opacity-95 transition-opacity flex items-center justify-center gap-2 text-sm"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>Proceed to Payment ({selectedPlan.displayPrice})</>
                  )}
                </button>
              </div>
            )}

            {/* STEP 2: Enter Payment Details */}
            {checkoutStep === 'payment' && (
              <form onSubmit={handleConfirmPayment} className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-border/40 text-xs">
                  <span className="text-muted-foreground">Order Ref:</span>
                  <span className="font-mono text-primary font-semibold">{paymentIntent?.paymentId}</span>
                </div>

                {paymentMethod === 'card' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        required
                        value={cardData.name}
                        onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full bg-input/60 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Card Number</label>
                      <input
                        type="text"
                        required
                        maxLength={19}
                        value={cardData.number}
                        onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                        placeholder="4242 •••• •••• 4242"
                        className="w-full bg-input/60 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40 font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          value={cardData.expiry}
                          onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                          placeholder="12/28"
                          className="w-full bg-input/60 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">CVC / CVV</label>
                        <input
                          type="password"
                          required
                          maxLength={4}
                          value={cardData.cvc}
                          onChange={(e) => setCardData({ ...cardData, cvc: e.target.value })}
                          placeholder="•••"
                          className="w-full bg-input/60 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      {paymentMethod === 'easypaisa' ? 'EasyPaisa Mobile Number' : 'JazzCash Mobile Number'}
                    </label>
                    <input
                      type="text"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="0300 1234567"
                      className="w-full bg-input/60 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring border border-border/40 font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      You will receive an authorization prompt on your mobile phone to approve the transaction.
                    </p>
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('review')}
                    className="px-4 py-3 rounded-xl glass border border-border/60 text-xs font-semibold hover:bg-secondary"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="flex-1 bg-gradient-primary text-primary-foreground py-3.5 rounded-xl font-bold shadow-glow hover:opacity-95 text-sm flex items-center justify-center gap-2"
                  >
                    Pay & Activate ({selectedPlan.displayPrice})
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Processing */}
            {checkoutStep === 'processing' && (
              <div className="py-12 text-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                <h4 className="font-display font-bold text-lg">Verifying Payment with Gateway...</h4>
                <p className="text-xs text-muted-foreground">
                  Validating cryptographic transaction signature and activating your membership.
                </p>
              </div>
            )}

            {/* STEP 4: Success */}
            {checkoutStep === 'success' && (
              <div className="py-8 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-glow">
                  <Check className="h-8 w-8" />
                </div>
                <h4 className="font-display font-extrabold text-2xl text-foreground">
                  Welcome to {selectedPlan.name}!
                </h4>
                <p className="text-sm text-muted-foreground">
                  Your subscription is now active for 30 days. All premium features have been unlocked.
                </p>
                <button
                  onClick={() => {
                    setSelectedPlan(null);
                    navigate('/dashboard');
                  }}
                  className="mt-4 w-full bg-gradient-primary text-primary-foreground py-3.5 rounded-xl font-bold shadow-glow hover:opacity-95 text-sm"
                >
                  Go to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
