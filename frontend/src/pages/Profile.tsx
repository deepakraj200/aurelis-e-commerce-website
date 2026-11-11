import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Home,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  UserRoundCog,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Address } from '@/types';
import { authService } from '@/services/authService';
import { getErrorMessage } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/utils/cn';
import { formatDate, initials } from '@/utils/format';
import { PageIntro } from '@/components/ui/PageIntro';
import { Button, buttonStyles } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';

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

export const ProfilePage = () => {
  useDocumentTitle('Your profile');
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const pushActivity = useUiStore((state) => state.pushActivity);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>(user?.addresses || []);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState<Address>(emptyAddress(user?.name, user?.phone));
  const [savingAddress, setSavingAddress] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      setAddresses(user.addresses);
    }
  }, [user]);

  if (!user) return null;

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await authService.updateProfile({ name: name.trim(), phone: phone.trim() });
      setUser(updated);
      toast.success('Profile updated.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  };

  const openAddAddress = () => {
    setEditingAddress(null);
    setAddressForm(emptyAddress(user.name, user.phone));
    setAddressModalOpen(true);
  };

  const openEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm(address);
    setAddressModalOpen(true);
  };

  const saveAddress = async (event: FormEvent) => {
    event.preventDefault();
    setSavingAddress(true);
    try {
      const nextAddresses = editingAddress?._id
        ? await authService.updateAddress(editingAddress._id, addressForm)
        : await authService.addAddress(addressForm);
      setAddresses(nextAddresses);
      setUser({ ...user, addresses: nextAddresses });
      setAddressModalOpen(false);
      toast.success(editingAddress ? 'Address updated.' : 'Address saved.');
      pushActivity({ title: 'Address saved', message: 'It is ready to use at checkout.' });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingAddress(false);
    }
  };

  const makeDefault = async (address: Address) => {
    if (!address._id || address.isDefault) return;
    try {
      const nextAddresses = await authService.updateAddress(address._id, { isDefault: true });
      setAddresses(nextAddresses);
      setUser({ ...user, addresses: nextAddresses });
      toast.success('Default address updated.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const deleteAddress = async () => {
    if (!deleteTarget?._id) return;
    setDeleting(true);
    try {
      const nextAddresses = await authService.deleteAddress(deleteTarget._id);
      setAddresses(nextAddresses);
      setUser({ ...user, addresses: nextAddresses });
      setDeleteTarget(null);
      toast.success('Address removed.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    if (passwords.next !== passwords.confirm) {
      setPasswordError('Your new passwords do not match.');
      return;
    }
    if (passwords.next.length < 8) {
      setPasswordError('Your new password must be at least 8 characters.');
      return;
    }
    setChangingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      setPasswords({ current: '', next: '', confirm: '' });
      toast.success('Password updated.');
      pushActivity({ title: 'Password updated', message: 'Your other active sessions have been signed out.' });
    } catch (error) {
      setPasswordError(getErrorMessage(error));
    } finally {
      setChangingPassword(false);
    }
  };

  const signOut = async () => {
    await logout();
    toast.success('You have been signed out.');
    navigate('/');
  };

  return (
    <div className="container-premium pb-10 pt-10 sm:pt-14">
      <PageIntro
        eyebrow="Your account"
        title="Profile & preferences."
        description="Keep your details current, manage saved addresses and protect your account."
      />

      <div className="mt-9 grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-14">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[26px] border border-white/[0.07] bg-white/[0.025] p-6">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent-light to-accent-deep text-[16px] font-semibold text-[#1b140d]">
                {initials(user.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium text-pearl">{user.name}</p>
                <p className="mt-0.5 truncate text-[11px] text-white/35">{user.email}</p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4 text-[10px] text-white/30">
              <span>Member since</span>
              <span className="text-white/55">{formatDate(user.createdAt, { month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-white/30">
              <span>Account</span>
              <Badge tone={user.role === 'admin' ? 'accent' : 'neutral'}>{user.role === 'admin' ? 'Administrator' : 'Member'}</Badge>
            </div>
            <div className="mt-5 space-y-1 border-t border-white/[0.06] pt-4">
              <Link to="/orders" className="flex items-center justify-between rounded-xl px-2 py-2.5 text-[11px] text-white/45 transition hover:bg-white/[0.04] hover:text-white">
                My orders <ArrowRight className="h-3 w-3" />
              </Link>
              <Link to="/wishlist" className="flex items-center justify-between rounded-xl px-2 py-2.5 text-[11px] text-white/45 transition hover:bg-white/[0.04] hover:text-white">
                Wishlist <ArrowRight className="h-3 w-3" />
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="flex items-center justify-between rounded-xl px-2 py-2.5 text-[11px] text-accent-light transition hover:bg-accent/10">
                  Admin studio <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={signOut}
              className="mt-3 flex w-full items-center gap-2 rounded-xl border border-white/[0.07] px-3 py-2.5 text-[11px] text-white/40 transition hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-200"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4">
            <p className="flex items-center gap-2 text-[10px] text-white/35">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300/60" /> Your data is encrypted in transit and never sold.
            </p>
          </div>
        </aside>

        <div className="space-y-8">
          <section className="rounded-[26px] border border-white/[0.07] bg-white/[0.022] p-6 sm:p-8">
            <div className="flex items-center gap-3 border-b border-white/[0.06] pb-5">
              <UserRoundCog className="h-4 w-4 text-accent/70" />
              <div>
                <h2 className="text-[17px] text-pearl">Account details</h2>
                <p className="mt-0.5 text-[10px] text-white/30">How we address you and reach you.</p>
              </div>
            </div>
            <form onSubmit={saveProfile} className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Full name" htmlFor="profile-name">
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                    <input id="profile-name" required minLength={2} value={name} onChange={(event) => setName(event.target.value)} className="field pl-11" />
                  </div>
                </FormField>
                <FormField label="Email" htmlFor="profile-email" hint="Your email is used for sign-in and order notices.">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                    <input id="profile-email" value={user.email} readOnly disabled className="field cursor-not-allowed pl-11 opacity-55" />
                  </div>
                </FormField>
                <FormField label="Phone" htmlFor="profile-phone" className="sm:col-span-2">
                  <input
                    id="profile-phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="field"
                    placeholder="+1 415 555 0100"
                    maxLength={30}
                  />
                </FormField>
              </div>
              <div className="mt-5 flex justify-end">
                <Button type="submit" loading={savingProfile} size="md">Save changes</Button>
              </div>
            </form>
          </section>

          <section className="rounded-[26px] border border-white/[0.07] bg-white/[0.022] p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-5">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-accent/70" />
                <div>
                  <h2 className="text-[17px] text-pearl">Saved addresses</h2>
                  <p className="mt-0.5 text-[10px] text-white/30">{addresses.length} of 8 addresses · used at checkout.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={openAddAddress}
                disabled={addresses.length >= 8}
                className={buttonStyles('secondary', 'sm', 'disabled:opacity-40')}
              >
                <Plus className="h-3.5 w-3.5" /> Add address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-white/[0.09] px-6 py-10 text-center">
                <Home className="mx-auto mb-3 h-5 w-5 text-white/20" />
                <p className="text-[12px] text-white/45">No saved addresses yet</p>
                <p className="mt-1 text-[10px] text-white/25">Add one now, or save it during checkout.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {addresses.map((address) => (
                  <div
                    key={address._id}
                    className={cn(
                      'flex flex-col rounded-2xl border p-5 transition',
                      address.isDefault
                        ? 'border-accent/25 bg-accent/[0.045]'
                        : 'border-white/[0.07] bg-white/[0.015] hover:border-white/[0.13]'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-[11px] font-medium text-white/70">
                        <Home className="h-3.5 w-3.5 text-white/35" /> {address.label || 'Address'}
                      </span>
                      {address.isDefault && <Badge tone="accent">Default</Badge>}
                    </div>
                    <div className="mt-3 space-y-0.5 text-[11px] leading-relaxed text-white/40">
                      <p className="text-white/65">{address.fullName}</p>
                      <p>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                      <p>{address.city}, {address.state} {address.postalCode}</p>
                      <p>{address.country}</p>
                      <p className="pt-1 text-white/30">{address.phone}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
                      <button type="button" onClick={() => openEditAddress(address)} className="inline-flex items-center gap-1.5 text-[10px] text-white/40 transition hover:text-white">
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      {!address.isDefault && (
                        <button type="button" onClick={() => makeDefault(address)} className="inline-flex items-center gap-1.5 text-[10px] text-white/40 transition hover:text-accent-light">
                          <Check className="h-3 w-3" /> Make default
                        </button>
                      )}
                      <button type="button" onClick={() => setDeleteTarget(address)} className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-white/25 transition hover:text-red-300">
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[26px] border border-white/[0.07] bg-white/[0.022] p-6 sm:p-8">
            <div className="flex items-center gap-3 border-b border-white/[0.06] pb-5">
              <LockKeyhole className="h-4 w-4 text-accent/70" />
              <div>
                <h2 className="text-[17px] text-pearl">Security</h2>
                <p className="mt-0.5 text-[10px] text-white/30">Changing your password signs out other sessions.</p>
              </div>
            </div>
            <form onSubmit={changePassword} className="mt-6 grid gap-4 sm:grid-cols-3">
              <FormField label="Current password" htmlFor="current-password" className="sm:col-span-3">
                <PasswordInput
                  id="current-password"
                  required
                  autoComplete="current-password"
                  value={passwords.current}
                  onChange={(event) => setPasswords({ ...passwords, current: event.target.value })}
                  placeholder="Your current password"
                />
              </FormField>
              <FormField label="New password" htmlFor="new-password">
                <PasswordInput
                  id="new-password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={passwords.next}
                  onChange={(event) => setPasswords({ ...passwords, next: event.target.value })}
                  placeholder="At least 8 characters"
                />
              </FormField>
              <FormField label="Confirm new password" htmlFor="confirm-password">
                <PasswordInput
                  id="confirm-password"
                  required
                  autoComplete="new-password"
                  value={passwords.confirm}
                  onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })}
                  placeholder="Repeat new password"
                />
              </FormField>
              <div className="flex items-end">
                <Button type="submit" loading={changingPassword} variant="secondary" className="w-full sm:w-auto">
                  Update password
                </Button>
              </div>
              {passwordError && (
                <p className="sm:col-span-3 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-[11px] text-red-200" role="alert">
                  {passwordError}
                </p>
              )}
            </form>
          </section>
        </div>
      </div>

      <Modal
        open={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        title={editingAddress ? 'Edit address' : 'Add an address'}
        description="This address will be available at checkout."
        size="md"
      >
        <form onSubmit={saveAddress} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Label" htmlFor="address-label">
              <input id="address-label" value={addressForm.label || ''} onChange={(event) => setAddressForm({ ...addressForm, label: event.target.value })} className="field" placeholder="Home" maxLength={40} />
            </FormField>
            <FormField label="Full name" htmlFor="address-name">
              <input id="address-name" required value={addressForm.fullName} onChange={(event) => setAddressForm({ ...addressForm, fullName: event.target.value })} className="field" />
            </FormField>
            <FormField label="Phone" htmlFor="address-phone">
              <input id="address-phone" required value={addressForm.phone} onChange={(event) => setAddressForm({ ...addressForm, phone: event.target.value })} className="field" />
            </FormField>
            <FormField label="Country" htmlFor="address-country">
              <input id="address-country" required value={addressForm.country} onChange={(event) => setAddressForm({ ...addressForm, country: event.target.value })} className="field" />
            </FormField>
            <FormField label="Street address" htmlFor="address-line1" className="sm:col-span-2">
              <input id="address-line1" required value={addressForm.line1} onChange={(event) => setAddressForm({ ...addressForm, line1: event.target.value })} className="field" />
            </FormField>
            <FormField label="Apartment, suite (optional)" htmlFor="address-line2" className="sm:col-span-2">
              <input id="address-line2" value={addressForm.line2 || ''} onChange={(event) => setAddressForm({ ...addressForm, line2: event.target.value })} className="field" />
            </FormField>
            <FormField label="City" htmlFor="address-city">
              <input id="address-city" required value={addressForm.city} onChange={(event) => setAddressForm({ ...addressForm, city: event.target.value })} className="field" />
            </FormField>
            <FormField label="State / region" htmlFor="address-state">
              <input id="address-state" required value={addressForm.state} onChange={(event) => setAddressForm({ ...addressForm, state: event.target.value })} className="field" />
            </FormField>
            <FormField label="Postal code" htmlFor="address-postal">
              <input id="address-postal" required value={addressForm.postalCode} onChange={(event) => setAddressForm({ ...addressForm, postalCode: event.target.value })} className="field" />
            </FormField>
            <label className="flex items-end gap-2 pb-3 text-[10px] text-white/35 sm:col-span-1">
              <input
                type="checkbox"
                checked={addressForm.isDefault || false}
                onChange={(event) => setAddressForm({ ...addressForm, isDefault: event.target.checked })}
                className="h-3.5 w-3.5 rounded border-white/20 bg-white/[0.05] accent-[#C7A17A]"
              />
              Make this my default
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-white/[0.06] pt-4">
            <Button type="button" variant="ghost" onClick={() => setAddressModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={savingAddress}>{editingAddress ? 'Save address' : 'Add address'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteAddress}
        loading={deleting}
        title="Remove this address?"
        description={`${deleteTarget?.line1 || 'This address'} will no longer be available at checkout. Existing orders are unaffected.`}
        confirmLabel="Remove address"
        danger
      />
    </div>
  );
};
