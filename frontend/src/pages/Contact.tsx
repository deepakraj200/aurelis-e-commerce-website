import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, Mail, MapPin, MessageSquare, Phone, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { miscService } from '@/services/miscService';
import { getErrorMessage } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageIntro } from '@/components/ui/PageIntro';
import { FormField } from '@/components/ui/FormField';
import { Button, buttonStyles } from '@/components/ui/Button';

const subjects = ['Order support', 'Product advice', 'Returns & exchanges', 'Press', 'Partnerships', 'Something else'];

export const ContactPage = () => {
  useDocumentTitle('Contact');
  const user = useAuthStore((state) => state.user);
  const [form, setForm] = useState({ name: '', email: '', subject: subjects[0], message: '' });
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (user) {
      setForm((current) => ({
        ...current,
        name: current.name || user.name,
        email: current.email || user.email,
      }));
    }
  }, [user]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    setLoading(true);
    try {
      const result = await miscService.contact({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject,
        message: form.message.trim(),
      });
      setReference(result.data.reference);
      toast.success('Message received. We will be in touch.');
      setForm((current) => ({ ...current, subject: subjects[0], message: '' }));
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-premium pb-10 pt-10 sm:pt-14">
      <PageIntro
        eyebrow="Client care"
        title="Speak with the studio."
        description="A real person reads every message. Whether it is a sizing question, a repair, or a thought about the collection, we answer within one business day."
        actions={
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-white/25">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Concierge online
          </div>
        }
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-16">
        <div>
          {reference ? (
            <div className="rounded-[28px] border border-emerald-400/15 bg-emerald-400/[0.045] p-8 sm:p-12">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                <Send className="h-5 w-5" />
              </span>
              <h2 className="mt-6 text-[28px] text-pearl">Your message is with us.</h2>
              <p className="mt-3 max-w-md text-[13px] leading-relaxed text-white/45">
                Thank you, {form.name.split(' ')[0] || 'friend'}. A member of the AURELIS concierge will reply to{' '}
                <span className="text-white/70">{form.email}</span> within one business day.
              </p>
              <p className="mt-5 text-[10px] uppercase tracking-[0.16em] text-white/30">
                Reference {reference.slice(-8).toUpperCase()}
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    setReference(null);
                    setForm((current) => ({ ...current, message: '' }));
                  }}
                >
                  Send another message
                </Button>
                <Link to="/shop" className={buttonStyles('outline', 'md')}>Continue exploring</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="rounded-[28px] border border-white/[0.07] bg-white/[0.022] p-6 sm:p-9">
              <div className="flex items-center gap-3 border-b border-white/[0.07] pb-5">
                <MessageSquare className="h-4 w-4 text-accent/70" strokeWidth={1.5} />
                <h2 className="text-[18px] text-pearl">Write to us</h2>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <FormField label="Your name" htmlFor="contact-name">
                  <input
                    id="contact-name"
                    required
                    minLength={2}
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    className="field"
                    placeholder="Alex Morgan"
                  />
                </FormField>
                <FormField label="Email" htmlFor="contact-email">
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    className="field"
                    placeholder="alex@example.com"
                  />
                </FormField>
              </div>

              <FormField label="Subject" htmlFor="contact-subject" className="mt-4">
                <select
                  id="contact-subject"
                  value={form.subject}
                  onChange={(event) => setForm({ ...form, subject: event.target.value })}
                  className="field appearance-none"
                >
                  {subjects.map((subject) => (
                    <option key={subject} value={subject} className="bg-graphite">
                      {subject}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Message" htmlFor="contact-message" className="mt-4" hint="A little context helps us help you.">
                <textarea
                  id="contact-message"
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={6}
                  value={form.message}
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                  className="field resize-none"
                  placeholder="Tell us what you are considering, or how we can help."
                />
              </FormField>

              {formError && (
                <p className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-[11px] text-red-200" role="alert">
                  {formError}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <p className="text-[10px] leading-relaxed text-white/25">
                  By sending, you agree to be contacted about this message only.
                </p>
                <Button type="submit" loading={loading} size="md">
                  {!loading && <Send className="h-3.5 w-3.5" />} Send message
                </Button>
              </div>
            </form>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">Direct</p>
            <div className="mt-5 space-y-5">
              <a href="mailto:concierge@aurelis.com" className="group flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent/70" />
                <div>
                  <p className="text-[11px] text-white/65 transition group-hover:text-white">concierge@aurelis.com</p>
                  <p className="mt-0.5 text-[10px] text-white/25">Orders, care and product advice</p>
                </div>
              </a>
              <a href="tel:+14155550190" className="group flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent/70" />
                <div>
                  <p className="text-[11px] text-white/65 transition group-hover:text-white">+1 415 555 0190</p>
                  <p className="mt-0.5 text-[10px] text-white/25">Monday to Sunday, 7am–7pm PT</p>
                </div>
              </a>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent/70" />
                <div>
                  <p className="text-[11px] text-white/65">AURELIS Studio</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-white/25">
                    88 Montgomery Street
                    <br />
                    San Francisco, CA 94104
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-6">
            <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/30">
              <Clock3 className="h-3.5 w-3.5" /> Response time
            </p>
            <p className="mt-3 text-[24px] text-pearl">Under 1 day</p>
            <p className="mt-1 text-[10px] text-white/25">Typical first reply, seven days a week.</p>
          </div>

          <div className="rounded-[24px] border border-accent/15 bg-accent/[0.04] p-6">
            <p className="text-[11px] leading-relaxed text-white/45">
              Looking for delivery, returns or warranty details? They are documented in our{' '}
              <Link to="/about#shipping" className="text-accent-light hover:text-accent">client care notes</Link>.
            </p>
          </div>
        </aside>
      </div>

      <section className="mt-16 border-t border-white/[0.06] pt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">Before you write</p>
            <h2 className="text-[26px] text-pearl">Quick answers.</h2>
          </div>
          <Link to="/about" className="hidden items-center gap-2 text-[11px] text-white/35 transition hover:text-white sm:inline-flex">
            Client care notes <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            { title: 'Where is my order?', copy: 'Open My Orders to see live tracking and the full timeline. Tracking begins as soon as your parcel leaves the studio.' },
            { title: 'Can I return a piece?', copy: 'Yes — 30 days from delivery in original condition. Start from the order page and we will arrange collection.' },
            { title: 'Is checkout secure?', copy: 'Payments are verified on the server before an order is confirmed. Card details never touch our database.' },
          ].map((item) => (
            <details key={item.title} className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[12px] text-white/65">
                {item.title}
                <span className="text-white/25 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[11px] leading-relaxed text-white/35">{item.copy}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
};
