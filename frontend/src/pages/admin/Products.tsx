import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Archive,
  Check,
  ChevronDown,
  ImagePlus,
  Layers,
  Loader2,
  Package,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Category, Product } from '@/types';
import { adminService } from '@/services/adminService';
import { productService } from '@/services/productService';
import { getErrorMessage } from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/utils/cn';
import { formatMoney, resolveImage } from '@/utils/format';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { ProductImage } from '@/components/product/ProductImage';

interface ProductFormState {
  name: string;
  sku: string;
  shortDescription: string;
  description: string;
  brand: string;
  price: string;
  originalPrice: string;
  stock: string;
  category: string;
  images: string[];
  specifications: { label: string; value: string }[];
  colors: { name: string; hex: string }[];
  sizes: string;
  tags: string;
  featured: boolean;
  isActive: boolean;
}

const emptyForm = (category = ''): ProductFormState => ({
  name: '',
  sku: '',
  shortDescription: '',
  description: '',
  brand: 'AURELIS',
  price: '',
  originalPrice: '',
  stock: '0',
  category,
  images: [],
  specifications: [{ label: '', value: '' }],
  colors: [],
  sizes: '',
  tags: '',
  featured: false,
  isActive: true,
});

const formFromProduct = (product: Product): ProductFormState => ({
  name: product.name,
  sku: product.sku || '',
  shortDescription: product.shortDescription,
  description: product.description,
  brand: product.brand,
  price: String(product.price),
  originalPrice: product.originalPrice ? String(product.originalPrice) : '',
  stock: String(product.stock),
  category: typeof product.category === 'object' ? product.category._id : product.category,
  images: [...product.images],
  specifications: product.specifications.length ? product.specifications : [{ label: '', value: '' }],
  colors: product.colors.length ? product.colors : [],
  sizes: product.sizes.join(', '),
  tags: product.tags.join(', '),
  featured: product.featured,
  isActive: product.isActive,
});

export const AdminProductsPage = () => {
  useDocumentTitle('Product management');
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState(searchParams.get('q') || '');
  const debouncedQ = useDebounce(q, 350);
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', image: '', featured: false });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await productService.categories());
    } catch {
      setCategories([]);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminService.products({
        q: debouncedQ || undefined,
        status: status === 'all' ? undefined : status,
        category: categoryFilter || undefined,
        page,
        limit: 10,
      });
      setProducts(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, status, categoryFilter, page]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    if (!categories.length) {
      toast.error('Create a collection before adding products.');
      openCategories();
      return;
    }
    setEditing(null);
    setForm(emptyForm(categories[0]._id));
    setImageUrl('');
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm(formFromProduct(product));
    setImageUrl('');
    setModalOpen(true);
  };

  const addImageUrl = () => {
    const url = imageUrl.trim();
    if (!url) return;
    if (!/^(https?:\/\/|\/uploads\/)/.test(url)) {
      toast.error('Enter a valid image URL or upload a file.');
      return;
    }
    if (form.images.length >= 8) {
      toast.error('Up to 8 images per product.');
      return;
    }
    setForm((current) => ({ ...current, images: [...current.images, url] }));
    setImageUrl('');
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    if (form.images.length + files.length > 8) {
      toast.error('Up to 8 images per product.');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await adminService.uploadImages(Array.from(files));
      setForm((current) => ({ ...current, images: [...current.images, ...uploaded.map((entry) => entry.url)] }));
      toast.success(`${uploaded.length} image${uploaded.length === 1 ? '' : 's'} uploaded.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submitProduct = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.category) {
      toast.error('Name, description and collection are required.');
      return;
    }
    if (form.images.length === 0) {
      toast.error('Add at least one product image.');
      return;
    }
    const price = Number(form.price);
    const originalPrice = form.originalPrice ? Number(form.originalPrice) : null;
    const stock = Number(form.stock);
    if (!Number.isFinite(price) || price < 0) {
      toast.error('Enter a valid price.');
      return;
    }
    if (originalPrice !== null && (!Number.isFinite(originalPrice) || originalPrice < price)) {
      toast.error('Original price must be greater than or equal to the sale price.');
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      toast.error('Stock must be a whole number of zero or more.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      ...(form.sku.trim() ? { sku: form.sku.trim() } : {}),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      brand: form.brand.trim() || 'AURELIS',
      price,
      originalPrice,
      stock,
      category: form.category,
      images: form.images,
      specifications: form.specifications.filter((entry) => entry.label.trim() && entry.value.trim()),
      colors: form.colors.filter((entry) => entry.name.trim()),
      sizes: form.sizes.split(',').map((entry) => entry.trim()).filter(Boolean),
      tags: form.tags.split(',').map((entry) => entry.trim().toLowerCase()).filter(Boolean).slice(0, 12),
      featured: form.featured,
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (editing) {
        await adminService.updateProduct(editing._id, payload);
        toast.success('Product updated.');
      } else {
        await adminService.createProduct(payload);
        toast.success('Product created.');
      }
      setModalOpen(false);
      await Promise.all([load(), loadCategories()]);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminService.deleteProduct(deleteTarget._id);
      toast.success('Product deleted.');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const openCategories = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', image: '', featured: false });
    setCategoriesOpen(true);
  };

  const editCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description,
      image: category.image,
      featured: category.featured,
    });
  };

  const saveCategory = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error('Collection name is required.');
      return;
    }
    setSavingCategory(true);
    try {
      if (editingCategory) {
        await adminService.updateCategory(editingCategory._id, {
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim(),
          image: categoryForm.image.trim(),
          featured: categoryForm.featured,
        });
        toast.success('Collection updated.');
      } else {
        await adminService.createCategory({
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim(),
          image: categoryForm.image.trim(),
          featured: categoryForm.featured,
        });
        toast.success('Collection created.');
      }
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', image: '', featured: false });
      await loadCategories();
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingCategory(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryTarget) return;
    setDeletingCategory(true);
    try {
      await adminService.deleteCategory(deleteCategoryTarget._id);
      toast.success('Collection deleted.');
      setDeleteCategoryTarget(null);
      await loadCategories();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingCategory(false);
    }
  };

  return (
    <div>
      <AdminHeader
        eyebrow="Catalogue"
        title="Products & collections."
        description="Shape the catalogue, manage inventory and control what appears in the storefront."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={openCategories}>
              <Layers className="h-3.5 w-3.5" /> Collections
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" /> New product
            </Button>
          </>
        }
      />

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
          <input
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
            placeholder="Search products or SKU"
            aria-label="Search products"
            className="h-10 w-full rounded-full border border-white/[0.08] bg-white/[0.035] pl-9 pr-4 text-[11px] text-white/65 placeholder:text-white/25 focus:border-accent/35"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by status"
              className="h-10 appearance-none rounded-full border border-white/[0.08] bg-white/[0.035] pl-4 pr-8 text-[10px] text-white/50"
            >
              <option value="all" className="bg-graphite">All statuses</option>
              <option value="active" className="bg-graphite">Active</option>
              <option value="archived" className="bg-graphite">Archived</option>
              <option value="low" className="bg-graphite">Low stock</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-white/25" />
          </div>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by collection"
              className="h-10 appearance-none rounded-full border border-white/[0.08] bg-white/[0.035] pl-4 pr-8 text-[10px] text-white/50"
            >
              <option value="" className="bg-graphite">All collections</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id} className="bg-graphite">{category.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-white/25" />
          </div>
          <span className="flex h-10 items-center rounded-full border border-white/[0.07] bg-white/[0.02] px-3.5 text-[9px] uppercase tracking-[0.12em] text-white/25">
            {meta.total} products
          </span>
        </div>
      </div>

      {error ? (
        <div className="mt-6">
          <EmptyState icon={RefreshCcw} title="Products could not load" description={error} action={<Button onClick={() => void load()}>Try again</Button>} />
        </div>
      ) : loading ? (
        <div className="mt-5 space-y-2">
          {[1, 2, 3, 4, 5].map((entry) => <Skeleton key={entry} className="h-[74px] rounded-2xl" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Package}
            title="No products found"
            description="Adjust the filters, or add the first piece to the catalogue."
            action={<Button onClick={openCreate}>Add a product</Button>}
          />
        </div>
      ) : (
        <>
          <div className="mt-5 overflow-x-auto rounded-[20px] border border-white/[0.07] bg-white/[0.02]">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-white/[0.06] text-[8px] uppercase tracking-[0.16em] text-white/20">
                  <th className="px-5 py-3.5 font-medium">Product</th>
                  <th className="px-3 py-3.5 font-medium">Collection</th>
                  <th className="px-3 py-3.5 font-medium">Price</th>
                  <th className="px-3 py-3.5 font-medium">Inventory</th>
                  <th className="px-3 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.045]">
                {products.map((product) => {
                  const category = typeof product.category === 'object' ? product.category : null;
                  return (
                    <tr key={product._id} className="group transition hover:bg-white/[0.025]">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-10 shrink-0 overflow-hidden rounded-lg product-well">
                            <ProductImage src={product.images[0]} alt={product.name} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="max-w-[210px] truncate text-[11px] font-medium text-white/70">{product.name}</p>
                              {product.featured && <Star className="h-2.5 w-2.5 fill-accent text-accent" />}
                            </div>
                            <p className="mt-0.5 text-[9px] text-white/25">{product.sku || product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-[10px] text-white/40">{category?.name || '—'}</td>
                      <td className="px-3 py-3.5">
                        <p className="text-[10px] tabular-nums text-white/55">{formatMoney(product.price, 'USD', false)}</p>
                        {product.originalPrice && (
                          <p className="mt-0.5 text-[9px] tabular-nums text-white/20 line-through">{formatMoney(product.originalPrice, 'USD', false)}</p>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={cn('inline-flex items-center gap-1.5 text-[10px] tabular-nums', product.stock === 0 ? 'text-red-300/70' : product.stock <= 5 ? 'text-amber-200/80' : 'text-white/45')}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', product.stock === 0 ? 'bg-red-400' : product.stock <= 5 ? 'bg-amber-300' : 'bg-emerald-400/60')} />
                          {product.stock === 0 ? 'Sold out' : `${product.stock} in stock`}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <Badge tone={product.isActive ? 'success' : 'neutral'}>
                          {product.isActive ? 'Live' : 'Archived'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(product)}
                            aria-label={`Edit ${product.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/[0.06] hover:text-white"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(product)}
                            aria-label={`Delete ${product.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/25 transition hover:bg-red-500/10 hover:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[9px] uppercase tracking-[0.14em] text-white/20">Showing {products.length} of {meta.total}</p>
            <Pagination page={meta.page} pages={meta.pages} onChange={setPage} />
          </div>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit product' : 'New product'}
        description={editing ? 'Changes take effect in the storefront immediately.' : 'Add a considered piece to the AURELIS catalogue.'}
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" form="product-form" loading={saving}>
              {editing ? 'Save changes' : 'Create product'}
            </Button>
          </div>
        }
      >
        <form id="product-form" onSubmit={submitProduct} className="space-y-6">
          <div>
            <p className="mb-3 text-[9px] uppercase tracking-[0.2em] text-accent">Essentials</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Product name" htmlFor="product-name" className="sm:col-span-2">
                <input id="product-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="field" placeholder="Titan X Pro" maxLength={120} />
              </FormField>
              <FormField label="Collection" htmlFor="product-category">
                <select id="product-category" required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="field appearance-none">
                  <option value="" disabled className="bg-graphite">Choose a collection</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id} className="bg-graphite">{category.name}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Brand" htmlFor="product-brand">
                <input id="product-brand" value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} className="field" maxLength={60} />
              </FormField>
              <FormField label="SKU (optional)" htmlFor="product-sku">
                <input id="product-sku" value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value.toUpperCase() })} className="field font-mono text-[11px]" placeholder="AUR-TXP-001" maxLength={40} />
              </FormField>
              <FormField label="Short description" htmlFor="product-short">
                <input id="product-short" value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} className="field" placeholder="One considered sentence" maxLength={220} />
              </FormField>
              <FormField label="Full description" htmlFor="product-description" className="sm:col-span-2">
                <textarea id="product-description" required minLength={10} rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="field resize-none" maxLength={4000} placeholder="The story, materials and details of this piece." />
              </FormField>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[9px] uppercase tracking-[0.2em] text-accent">Imagery</p>
              <span className="text-[9px] text-white/20">{form.images.length}/8 · first image is the cover</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {form.images.map((image, index) => (
                <div key={`${image}-${index}`} className="group relative aspect-square overflow-hidden rounded-xl border border-white/[0.08] product-well">
                  <ProductImage src={image} alt={`Product image ${index + 1}`} />
                  {index === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-ink/80 px-1.5 py-0.5 text-[7px] uppercase tracking-[0.12em] text-white/70">Cover</span>}
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, images: current.images.filter((_, imageIndex) => imageIndex !== index) }))}
                    aria-label="Remove image"
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink/80 text-white/60 opacity-0 transition group-hover:opacity-100 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading || form.images.length >= 8}
                className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.12] text-white/25 transition hover:border-accent/30 hover:text-accent disabled:opacity-40"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                <span className="text-[8px] uppercase tracking-[0.12em]">{uploading ? 'Uploading' : 'Upload'}</span>
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/avif" multiple hidden onChange={(event) => void handleUpload(event.target.files)} />
            </div>
            <div className="mt-2.5 flex gap-2">
              <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Or paste an image URL" className="field h-10 flex-1 text-[11px]" />
              <button type="button" onClick={addImageUrl} className="flex h-10 items-center rounded-full border border-white/10 px-4 text-[10px] text-white/50 transition hover:border-white/25 hover:text-white">
                Add
              </button>
            </div>
          </div>

          <div>
            <p className="mb-3 text-[9px] uppercase tracking-[0.2em] text-accent">Pricing & inventory</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Price (USD)" htmlFor="product-price">
                <input id="product-price" inputMode="decimal" required value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value.replace(/[^\d.]/g, '') })} className="field tabular-nums" placeholder="1299" />
              </FormField>
              <FormField label="Compare at (optional)" htmlFor="product-original">
                <input id="product-original" inputMode="decimal" value={form.originalPrice} onChange={(event) => setForm({ ...form, originalPrice: event.target.value.replace(/[^\d.]/g, '') })} className="field tabular-nums" placeholder="1399" />
              </FormField>
              <FormField label="Stock" htmlFor="product-stock">
                <input id="product-stock" inputMode="numeric" required value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value.replace(/[^\d]/g, '') })} className="field tabular-nums" placeholder="24" />
              </FormField>
            </div>
            <div className="mt-4 flex flex-wrap gap-5">
              {[
                { key: 'isActive' as const, label: 'Live in storefront' },
                { key: 'featured' as const, label: 'Signature / featured' },
              ].map((toggle) => (
                <button
                  key={toggle.key}
                  type="button"
                  onClick={() => setForm({ ...form, [toggle.key]: !form[toggle.key] })}
                  className="flex items-center gap-2 text-[11px] text-white/45"
                  role="switch"
                  aria-checked={form[toggle.key]}
                >
                  <span className={cn('relative h-5 w-9 rounded-full border transition', form[toggle.key] ? 'border-accent/40 bg-accent/80' : 'border-white/15 bg-white/[0.05]')}>
                    <span className={cn('absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-all', form[toggle.key] ? 'left-[18px]' : 'left-0.5')} />
                  </span>
                  {toggle.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-[9px] uppercase tracking-[0.2em] text-accent">Variations</p>
            <div className="space-y-2">
              {form.colors.map((color, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color.hex}
                    onChange={(event) => setForm({ ...form, colors: form.colors.map((entry, colorIndex) => colorIndex === index ? { ...entry, hex: event.target.value } : entry) })}
                    aria-label="Colour swatch"
                    className="h-9 w-9 shrink-0 cursor-pointer rounded-full border border-white/15 bg-transparent p-0.5"
                  />
                  <input
                    value={color.name}
                    onChange={(event) => setForm({ ...form, colors: form.colors.map((entry, colorIndex) => colorIndex === index ? { ...entry, name: event.target.value } : entry) })}
                    placeholder="Colour name"
                    className="field h-9 flex-1 text-[11px]"
                  />
                  <button type="button" onClick={() => setForm({ ...form, colors: form.colors.filter((_, colorIndex) => colorIndex !== index) })} aria-label="Remove colour" className="flex h-8 w-8 items-center justify-center rounded-lg text-white/25 hover:text-red-300">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setForm({ ...form, colors: [...form.colors, { name: '', hex: '#8E8E93' }] })} className="inline-flex items-center gap-1.5 text-[10px] text-white/35 transition hover:text-accent">
                <Plus className="h-3 w-3" /> Add colour
              </button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField label="Options / sizes" htmlFor="product-sizes" hint="Comma separated, e.g. 256GB, 512GB, 1TB">
                <input id="product-sizes" value={form.sizes} onChange={(event) => setForm({ ...form, sizes: event.target.value })} className="field" />
              </FormField>
              <FormField label="Tags" htmlFor="product-tags" hint="Comma separated, used for search and filtering.">
                <input id="product-tags" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} className="field" />
              </FormField>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[9px] uppercase tracking-[0.2em] text-accent">Specifications</p>
              <button type="button" onClick={() => setForm({ ...form, specifications: [...form.specifications, { label: '', value: '' }] })} className="inline-flex items-center gap-1 text-[10px] text-white/35 transition hover:text-accent">
                <Plus className="h-3 w-3" /> Add row
              </button>
            </div>
            <div className="space-y-2">
              {form.specifications.map((spec, index) => (
                <div key={index} className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={spec.label}
                    onChange={(event) => setForm({ ...form, specifications: form.specifications.map((entry, specIndex) => specIndex === index ? { ...entry, label: event.target.value } : entry) })}
                    placeholder="Label (e.g. Display)"
                    className="field h-10 text-[11px] sm:w-[200px]"
                  />
                  <input
                    value={spec.value}
                    onChange={(event) => setForm({ ...form, specifications: form.specifications.map((entry, specIndex) => specIndex === index ? { ...entry, value: event.target.value } : entry) })}
                    placeholder="Value (e.g. 6.9-inch LTPO OLED)"
                    className="field h-10 flex-1 text-[11px]"
                  />
                  <button type="button" onClick={() => setForm({ ...form, specifications: form.specifications.filter((_, specIndex) => specIndex !== index) })} aria-label="Remove specification" className="flex h-10 w-8 shrink-0 items-center justify-center text-white/25 hover:text-red-300">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      <Modal open={categoriesOpen} onClose={() => setCategoriesOpen(false)} title="Collections" description="Organise the catalogue into considered worlds." size="lg">
        <div className="grid gap-6 sm:grid-cols-[1fr_1.2fr]">
          <form onSubmit={saveCategory} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/30">{editingCategory ? 'Edit collection' : 'New collection'}</p>
            <div className="mt-3 space-y-3">
              <FormField label="Name" htmlFor="category-name">
                <input id="category-name" required value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} className="field h-10 text-[11px]" placeholder="Audio" />
              </FormField>
              <FormField label="Description" htmlFor="category-description">
                <textarea id="category-description" rows={3} value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} className="field resize-none text-[11px]" maxLength={400} />
              </FormField>
              <FormField label="Cover image URL" htmlFor="category-image">
                <input id="category-image" value={categoryForm.image} onChange={(event) => setCategoryForm({ ...categoryForm, image: event.target.value })} className="field h-10 text-[11px]" placeholder="https://… or upload via product" />
              </FormField>
              <button type="button" onClick={() => setCategoryForm({ ...categoryForm, featured: !categoryForm.featured })} className="flex items-center gap-2 text-[10px] text-white/40" role="switch" aria-checked={categoryForm.featured}>
                <span className={cn('relative h-4.5 w-8 rounded-full border transition', categoryForm.featured ? 'border-accent/40 bg-accent/80' : 'border-white/15 bg-white/[0.05]')}>
                  <span className={cn('absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all', categoryForm.featured ? 'left-[17px]' : 'left-0.5')} />
                </span>
                Feature on homepage
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              <Button type="submit" size="sm" loading={savingCategory}>{editingCategory ? 'Save' : 'Create'}</Button>
              {editingCategory && (
                <Button type="button" size="sm" variant="ghost" onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', description: '', image: '', featured: false }); }}>
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <div className="space-y-2">
            {categories.length === 0 && <p className="text-[11px] text-white/25">No collections yet.</p>}
            {categories.map((category) => (
              <div key={category._id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white/[0.04]">
                  {category.image ? <img src={resolveImage(category.image)} alt={category.name} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full w-full items-center justify-center text-white/20"><Layers className="h-4 w-4" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] text-white/65">{category.name}</p>
                  <p className="mt-0.5 text-[9px] text-white/25">{category.productCount ?? 0} products {category.featured ? '· featured' : ''}</p>
                </div>
                <button type="button" onClick={() => editCategory(category)} aria-label={`Edit ${category.name}`} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:bg-white/[0.06] hover:text-white">
                  <Pencil className="h-3 w-3" />
                </button>
                <button type="button" onClick={() => setDeleteCategoryTarget(category)} aria-label={`Delete ${category.name}`} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/25 hover:bg-red-500/10 hover:text-red-300">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete this product?"
        description={`${deleteTarget?.name || 'This product'} will be permanently removed from the catalogue. Products with order history cannot be deleted — archive them instead to preserve customer records.`}
        confirmLabel="Delete product"
        danger
      />

      <ConfirmDialog
        open={Boolean(deleteCategoryTarget)}
        onClose={() => setDeleteCategoryTarget(null)}
        onConfirm={confirmDeleteCategory}
        loading={deletingCategory}
        title="Delete this collection?"
        description={`${deleteCategoryTarget?.name || 'This collection'} can only be deleted when it contains no products. Move products to another collection first.`}
        confirmLabel="Delete collection"
        danger
      />

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-white/[0.05] px-4 py-3 text-[9px] text-white/20">
        <Check className="h-3 w-3 text-emerald-300/50" />
        All catalogue changes are applied through protected server-side APIs and take effect immediately.
        <Archive className="ml-auto h-3 w-3" />
      </div>
    </div>
  );
};
