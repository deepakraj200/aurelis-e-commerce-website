import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import { authService } from '@/services/authService';
import { getErrorMessage } from '@/services/api';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';

export const ForgotPasswordPage = () => {
  useDocumentTitle('Reset your password');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await authService.forgotPassword(email.trim());
      setSent(true);
      if (result.devResetUrl) setDevResetUrl(result.devResetUrl);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link to="/login" className="mb-8 inline-flex items-center gap-2 text-[11px] text-white/35 transition hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
      </Link>

      <p className="eyebrow mb-4">Account recovery</p>
      <h1 className="text-[34px] leading-[1.04] tracking-[-0.04em] text-pearl">Reset your password.</h1>

      {sent ? (
        <div className="mt-7 rounded-[22px] border border-emerald-400/15 bg-emerald-400/[0.045] p-6">
          <p className="text-[13px] leading-relaxed text-white/55">
            If an account exists for <span className="text-white/85">{email}</span>, a single-use reset link is on its
            way. It expires in 30 minutes.
          </p>
          <p className="mt-3 text-[11px] leading-relaxed text-white/30">
            Check your spam folder if it has not arrived within a few minutes. For security we do not disclose whether
            an account exists.
          </p>
          {devResetUrl && (
            <div className="mt-5 rounded-xl border border-accent/20 bg-accent/[0.06] p-4">
              <p className="text-[9px] uppercase tracking-[0.16em] text-accent">Development mode</p>
              <p className="mt-1.5 text-[10px] leading-relaxed text-white/35">
                SMTP is not configured, so the reset link is shown here instead of being emailed.
              </p>
              <Link
                to={new URL(devResetUrl).pathname + new URL(devResetUrl).search}
                className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-accent-light hover:text-accent"
              >
                Open reset link <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="mt-7 space-y-4">
          <p className="text-[13px] leading-relaxed text-white/40">
            Enter the email associated with your account. We will send a single-use link to choose a new password.
          </p>
          <FormField label="Email" htmlFor="forgot-email">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
              <input
                id="forgot-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="field pl-11"
              />
            </div>
          </FormField>
          {error && (
            <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-[11px] text-red-200" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" loading={loading} className="w-full">
            {!loading && <ArrowRight className="h-4 w-4" />} Send reset link
          </Button>
        </form>
      )}
    </div>
  );
};
