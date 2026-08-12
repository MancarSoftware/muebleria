import { ArrowLeft, Check, ImagePlus, LoaderCircle, LogOut, PackagePlus, Pencil, Plus, Trash2, UploadCloud } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { deleteProduct, getAdminProducts, removeProductImage, saveProduct, type ProductDraft, uploadProductImages } from '../services/catalog';
import { catalogCategories, type InventoryStatus, type Product, type ProductStatus } from '../types/catalog';

type Profile = { role: 'admin' | 'editor'; display_name: string | null };
const inventoryLabels: Record<InventoryStatus, string> = { in_stock: 'En stock', low_stock: 'Últimas unidades', made_to_order: 'Bajo pedido', out_of_stock: 'No disponible' };
const blankProduct = (): ProductDraft => ({ slug: '', name: '', category: catalogCategories[0], price: 0, description: '', materials: [], dimensions: '', colors: [], tags: [], featured: false, status: 'draft', inventoryStatus: 'made_to_order', leadTimeDays: null, sortOrder: 0 });
const toDraft = (product: Product): ProductDraft => ({ ...product, status: product.status ?? 'draft', inventoryStatus: product.inventoryStatus ?? 'made_to_order', leadTimeDays: product.leadTimeDays ?? null, sortOrder: product.sortOrder ?? 0 });
const listValue = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
const toSlug = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-EC').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function Admin() {
  const [sessionReady, setSessionReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<ProductDraft>(blankProduct());
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedId = selected.id;
  const publishedCount = useMemo(() => products.filter((product) => product.status === 'published').length, [products]);

  const loadProducts = async (): Promise<Product[]> => {
    try {
      const nextProducts = await getAdminProducts();
      setProducts(nextProducts);
      return nextProducts;
    } catch {
      setNotice('No pudimos cargar el catálogo. Revisa las políticas de Supabase.');
      return [];
    }
  };

  const loadProfile = async (userId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase.from('profiles').select('role, display_name').eq('id', userId).maybeSingle();
    if (error || !data) { setProfile(null); return; }
    setProfile(data as Profile);
    await loadProducts();
  };

  useEffect(() => {
    if (!supabase) { setSessionReady(true); return; }
    supabase.auth.getSession().then(async ({ data }) => {
      setIsAuthenticated(Boolean(data.session));
      if (data.session) await loadProfile(data.session.user.id);
      setSessionReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setIsAuthenticated(Boolean(nextSession));
      setProfile(null);
      if (nextSession) void loadProfile(nextSession.user.id);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setLoading(true); setNotice('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setNotice('No pudimos iniciar sesión. Revisa tu correo y contraseña.');
    setLoading(false);
  };

  const update = (next: Partial<ProductDraft>) => setSelected((current) => ({ ...current, ...next }));
  const selectProduct = (product: Product) => { setSelected(toDraft(product)); setFiles([]); setNotice(''); };
  const createProduct = () => { setSelected(blankProduct()); setFiles([]); setNotice(''); };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected.name || !selected.slug || !selected.description || !selected.dimensions) { setNotice('Completa nombre, URL, descripción y dimensiones antes de guardar.'); return; }
    setLoading(true); setNotice('');
    try {
      const id = await saveProduct(selected);
      await uploadProductImages(id, files);
      const nextProducts = await loadProducts();
      const savedProduct = nextProducts.find((product) => product.id === id);
      setSelected(savedProduct ? toDraft(savedProduct) : (current) => ({ ...current, id })); setFiles([]);
      setNotice(selected.status === 'published' ? 'Producto publicado. Ya aparece en el catálogo público.' : 'Borrador guardado. Solo tú puedes verlo aquí.');
    } catch { setNotice('No pudimos guardar el producto. Revisa los permisos de Supabase y vuelve a intentarlo.'); }
    finally { setLoading(false); }
  };

  const removeImage = async (imageUrl: string) => {
    if (!selectedId) return;
    setLoading(true);
    try {
      await removeProductImage(selectedId, imageUrl);
      const nextProducts = await loadProducts();
      const refreshedProduct = nextProducts.find((product) => product.id === selectedId);
      setSelected(refreshedProduct ? toDraft(refreshedProduct) : (current) => ({ ...current, images: current.images?.filter((image) => image !== imageUrl) }));
    }
    catch { setNotice('No pudimos eliminar la imagen.'); }
    finally { setLoading(false); }
  };

  const remove = async () => {
    if (!selectedId || !window.confirm(`¿Eliminar “${selected.name}”? Esta acción no se puede deshacer.`)) return;
    setLoading(true);
    try { await deleteProduct(selectedId); await loadProducts(); createProduct(); setNotice('Producto eliminado.'); }
    catch { setNotice('No pudimos eliminar el producto.'); }
    finally { setLoading(false); }
  };

  const logout = async () => { await supabase?.auth.signOut(); setProducts([]); createProduct(); };

  if (!isSupabaseConfigured) return <AdminSetup/>;
  if (!sessionReady) return <main className="admin-shell admin-state"><LoaderCircle className="spin"/> Preparando el catálogo…</main>;
  if (!isAuthenticated) return <AdminLogin email={email} password={password} notice={notice} loading={loading} onEmail={setEmail} onPassword={setPassword} onSubmit={login}/>;
  if (!profile) return <main className="admin-shell admin-state"><p className="eyebrow">ACCESO RESTRINGIDO</p><h1>Tu cuenta todavía no tiene permisos de catálogo.</h1><p>Pide al administrador que añada tu usuario a la tabla <code>profiles</code> con rol <code>admin</code> o <code>editor</code>.</p><button className="dark-button" onClick={logout}>Cerrar sesión</button></main>;

  return <main className="admin-shell"><header className="admin-header"><Link className="brand" to="/"><i>CN</i><span>Casa Nativa</span></Link><div><span>{profile.display_name || 'Administración'}</span><button onClick={logout}><LogOut/> Cerrar sesión</button></div></header><section className="admin-hero"><div><p className="eyebrow">CATÁLOGO PRIVADO</p><h1>Piezas que<br/><em>sí puedes gestionar.</em></h1></div><div><b>{publishedCount}</b><span>publicadas</span><b>{products.length - publishedCount}</b><span>en borrador</span></div></section><div className="admin-layout"><aside className="admin-list"><button className="admin-new" type="button" onClick={createProduct}><PackagePlus/> Nuevo producto</button><p className="eyebrow">TU CATÁLOGO · {products.length}</p>{products.map((product) => <button className={`admin-product ${selectedId === product.id ? 'selected' : ''}`} type="button" key={product.id} onClick={() => selectProduct(product)}><img src={product.images[0]} alt=""/><span><b>{product.name}</b><small>{product.status === 'published' ? 'Publicado' : 'Borrador'} · ${product.price.toLocaleString('en-US')}</small></span><Pencil/></button>)}</aside><ProductEditor product={selected} files={files} notice={notice} loading={loading} onChange={update} onFiles={setFiles} onSubmit={submit} onDelete={remove} onRemoveImage={removeImage}/></div></main>;
}

function AdminSetup() { return <main className="admin-shell admin-setup"><Link className="brand" to="/"><i>CN</i><span>Casa Nativa</span></Link><p className="eyebrow">CONFIGURACIÓN PENDIENTE</p><h1>Conecta el catálogo<br/><em>del cliente.</em></h1><p>Este espacio queda listo para el propietario en cuanto se conecte su proyecto Supabase.</p><ol><li>Ejecuta la migración <code>supabase/migrations/202608120001_catalog.sql</code>.</li><li>Crea el usuario propietario en Supabase Auth y asígnale rol <code>admin</code>.</li><li>Añade <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> al entorno.</li></ol><Link className="dark-button" to="/">Volver al sitio <ArrowLeft/></Link></main>;
}

function AdminLogin({ email, password, notice, loading, onEmail, onPassword, onSubmit }: { email: string; password: string; notice: string; loading: boolean; onEmail: (value: string) => void; onPassword: (value: string) => void; onSubmit: (event: React.FormEvent) => void }) { return <main className="admin-shell admin-login"><Link className="brand" to="/"><i>CN</i><span>Casa Nativa</span></Link><form onSubmit={onSubmit}><p className="eyebrow">ACCESO DE PROPIETARIO</p><h1>Gestiona tus<br/><em>piezas.</em></h1><label>Correo<input type="email" value={email} onChange={(event) => onEmail(event.target.value)} autoComplete="email" required/></label><label>Contraseña<input type="password" value={password} onChange={(event) => onPassword(event.target.value)} autoComplete="current-password" required/></label>{notice && <p className="admin-notice error">{notice}</p>}<button className="dark-button" disabled={loading}>{loading ? <LoaderCircle className="spin"/> : 'Entrar al catálogo'}</button><small>Solo usuarios autorizados por el propietario pueden administrar el catálogo.</small></form></main>;
}

function ProductEditor({ product, files, notice, loading, onChange, onFiles, onSubmit, onDelete, onRemoveImage }: { product: ProductDraft; files: File[]; notice: string; loading: boolean; onChange: (next: Partial<ProductDraft>) => void; onFiles: (files: File[]) => void; onSubmit: (event: React.FormEvent) => void; onDelete: () => void; onRemoveImage: (imageUrl: string) => void }) { return <section className="admin-editor"><form onSubmit={onSubmit}><div className="admin-editor-head"><div><p className="eyebrow">{product.id ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}</p><h2>{product.name || 'Sin nombre todavía'}</h2></div><select value={product.status ?? 'draft'} onChange={(event) => onChange({ status: event.target.value as ProductStatus })}><option value="draft">Borrador</option><option value="published">Publicado</option></select></div><div className="admin-form-grid"><label className="wide">Nombre<input value={product.name} onChange={(event) => onChange({ name: event.target.value, slug: product.id ? product.slug : toSlug(event.target.value) })} placeholder="Ej. Sofá Olmo" required/></label><label>URL del producto<input value={product.slug} onChange={(event) => onChange({ slug: toSlug(event.target.value) })} placeholder="sofa-olmo" required/></label><label>Categoría<select value={product.category} onChange={(event) => onChange({ category: event.target.value })}>{catalogCategories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Precio (USD)<input type="number" min="0" step="1" value={product.price} onChange={(event) => onChange({ price: Number(event.target.value) })} required/></label><label>Orden<input type="number" min="0" value={product.sortOrder ?? 0} onChange={(event) => onChange({ sortOrder: Number(event.target.value) })}/></label><label className="wide">Descripción<textarea value={product.description} onChange={(event) => onChange({ description: event.target.value })} placeholder="Cuenta qué resuelve la pieza, cómo se siente y para qué espacio funciona." required/></label><label>Dimensiones<input value={product.dimensions} onChange={(event) => onChange({ dimensions: event.target.value })} placeholder="Ej. 240 × 96 × 72 cm" required/></label><label>Materiales<input value={product.materials.join(', ')} onChange={(event) => onChange({ materials: listValue(event.target.value) })} placeholder="Lino, roble"/></label><label>Colores<input value={product.colors.join(', ')} onChange={(event) => onChange({ colors: listValue(event.target.value) })} placeholder="Arena, olivo"/></label><label>Etiquetas para filtros e IA<input value={product.tags.join(', ')} onChange={(event) => onChange({ tags: listValue(event.target.value) })} placeholder="sala, modular, natural"/></label><label>Disponibilidad<select value={product.inventoryStatus ?? 'made_to_order'} onChange={(event) => onChange({ inventoryStatus: event.target.value as InventoryStatus })}>{Object.entries(inventoryLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Plazo de entrega (días)<input type="number" min="0" value={product.leadTimeDays ?? ''} onChange={(event) => onChange({ leadTimeDays: event.target.value ? Number(event.target.value) : null })} placeholder="Por confirmar"/></label><label className="admin-check"><input type="checkbox" checked={product.featured} onChange={(event) => onChange({ featured: event.target.checked })}/> Mostrar entre piezas destacadas</label></div><ImageManager images={product.images ?? []} files={files} disabled={loading} onFiles={onFiles} onRemove={onRemoveImage}/>{notice && <p className={`admin-notice ${notice.startsWith('No pudimos') || notice.startsWith('Completa') ? 'error' : ''}`}>{notice}</p>}<div className="admin-actions"><button className="dark-button" disabled={loading}>{loading ? <LoaderCircle className="spin"/> : product.status === 'published' ? <><Check/> Guardar y publicar</> : 'Guardar borrador'}</button>{product.id && <button className="admin-delete" type="button" onClick={onDelete} disabled={loading}><Trash2/> Eliminar producto</button>}</div></form></section>; }

function ImageManager({ images, files, disabled, onFiles, onRemove }: { images: string[]; files: File[]; disabled: boolean; onFiles: (files: File[]) => void; onRemove: (imageUrl: string) => void }) { const previews = files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })); return <section className="admin-images"><div><p className="eyebrow">FOTOGRAFÍAS</p><p>JPG, PNG o WebP · máximo 10 MB por imagen.</p></div><label className="admin-upload"><ImagePlus/><span>Añadir imágenes<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={disabled} onChange={(event) => onFiles([...files, ...Array.from(event.target.files ?? [])])}/></span></label><div className="admin-image-grid">{images.map((image) => <figure key={image}><img src={image} alt=""/><button type="button" disabled={disabled} onClick={() => onRemove(image)} aria-label="Eliminar imagen"><Trash2/></button></figure>)}{previews.map((image) => <figure key={image.name} className="pending"><img src={image.url} alt=""/><span><UploadCloud/> Se subirá al guardar</span></figure>)}</div></section>; }
