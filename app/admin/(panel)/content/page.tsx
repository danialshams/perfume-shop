"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Save, RefreshCw, ArrowUp, ArrowDown, Package,
  UploadCloud, Plus, Trash2, ExternalLink,
} from "lucide-react";
import type { FertiniSiteContent, HomepageSection } from "@/lib/fertini-site-content";
import { DEFAULT_SITE_CONTENT } from "@/lib/fertini-site-content";
import type { HomeProduct } from "@/lib/fertini-home-products";
import { DEMO_HOME_PRODUCTS } from "@/lib/fertini-home-products";
import { uploadAdminFile } from "@/lib/admin-upload-client";
import LiveHomePreview from "@/components/admin/LiveHomePreview";

type Asset = { url: string; label: string };
type CatalogKey = "bestsellerIds" | "latestIds";
const sectionTitles: Record<HomepageSection, string> = {
  campaign:"کمپین‌ها",bestsellers: "پرفروش‌ترین‌ها", latest: "جدیدترین عطرها", families: "گروه‌های بویایی", shipping:"روش‌های ارسال",
};


export default function AdminContentPage() {
  const [content, setContent] = useState<FertiniSiteContent>(DEFAULT_SITE_CONTENT);
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [assets, setAssets] = useState<Asset[]>([
    ...DEFAULT_SITE_CONTENT.heroSlides.map((x, i) => ({ url: x.photo, label: "هیرو " + (i + 1) })),
    ...DEMO_HOME_PRODUCTS.map(x => ({ url: x.image, label: x.name })),
  ]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [snapshot, setSnapshot] = useState(JSON.stringify(DEFAULT_SITE_CONTENT));
  const changed = JSON.stringify(content) !== snapshot;
  const byId = new Map(products.map(p => [p.id, p]));
  const assetOptions = (current: string) =>
    [...new Map([...assets, { url: current, label: "تصویر فعلی" }].map(x => [x.url, x])).values()];

  function edit<K extends keyof FertiniSiteContent>(key: K, value: FertiniSiteContent[K]) {
    setContent(previous => ({ ...previous, [key]: value }));
    setSuccess("");
  }
  function setHero(index: number, patch: Partial<FertiniSiteContent["heroSlides"][number]>) {
    edit("heroSlides", content.heroSlides.map((s, i) => i === index ? { ...s, ...patch } : s));
  }
  function move<T>(arr: T[], index: number, delta: number): T[] {
    const next = [...arr], other = index + delta;
    if (other < 0 || other >= next.length) return arr;
    [next[index], next[other]] = [next[other], next[index]];
    return next;
  }
  async function load() {
    setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/v1/admin/content", { cache: "no-store", credentials: "same-origin" });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw Error(result?.error || "دسترسی به دیتابیس محتوای سایت وجود ندارد.");
      if (!result?.content || !Array.isArray(result?.products)) throw Error("ساختار پاسخ دیتابیس نامعتبر است.");
      setContent(result.content);
      setSnapshot(JSON.stringify(result.content));
      setProducts(result.products);
      setConnected(true);
    } catch (e) {
      setConnected(false);
      setProducts([]);
      setError(e instanceof Error ? e.message : "خطا در ارتباط با دیتابیس");
    } finally { setBusy(false); }
  }
  useEffect(() => {
    void load();
    fetch("/api/v1/admin/media-assets", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(data => {
      if (Array.isArray(data?.items)) setAssets(previous => [
        ...new Map([...previous, ...data.items].map((x: Asset) => [x.url, x])).values(),
      ]);
    }).catch(() => {});
    // Initial loading only: manual reload is available for subsequent edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function upload(file: File, target: "hero", index: number) {
    setUploading(target + index); setError(""); setSuccess("");
    try {
      const saved = await uploadAdminFile(file, "image");
      setAssets(previous => [{ url: saved.url, label: file.name }, ...previous]);
      if (target === "hero") setContent(previous => ({
        ...previous, heroSlides: previous.heroSlides.map((s, i) => i === index ? { ...s, photo: saved.url } : s),
      }));

    } catch (e) {
      setError(e instanceof Error ? e.message : "آپلود فایل ناموفق بود.");
    } finally { setUploading(null); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!connected || busy || !changed) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/v1/admin/content", {
        method: "PUT", cache: "no-store", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.saved) throw Error(result?.error || "ذخیره‌سازی ناموفق بود.");
      setContent(result.content); setSnapshot(JSON.stringify(result.content));
      setSuccess("تغییرات صفحه اصلی ذخیره شدند و در فروشگاه قابل مشاهده‌اند.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ذخیره");
    } finally { setBusy(false); }
  }
  function chooseProduct(key: CatalogKey, index: number, id: string) {
    if (content[key].some((existing, i) => existing === id && i !== index)) return;
    const next = [...content[key]]; next[index] = id; edit(key, next);
  }
  function addProduct(key: CatalogKey) {
    const next = products.find(p => !content[key].includes(p.id));
    if (next) edit(key, [...content[key], next.id]);
  }
  function productEditor(key: CatalogKey) {
    return <div className="fst-selection-list">
      {!content[key].length && <p className="fst-helper" role="status">هنوز محصولی در این بخش انتخاب نشده است. می‌توانی هیرو و متن‌های صفحه را بدون محصول هم ذخیره کنی.</p>}
      {content[key].map((id, index) => <div className="fst-product-pick" key={index}>
        <span className="fst-index">{String(index + 1).padStart(2, "0")}</span>
        {byId.get(id)?.image ? <img src={byId.get(id)?.image} alt="" /> : <span className="fst-product-placeholder">عطر</span>}
        <select aria-label={"انتخاب محصول " + (index + 1)} value={id} disabled={!connected}
          onChange={event => chooseProduct(key, index, event.target.value)}>
          {!byId.has(id) && <option value={id}>محصول قبلی؛ نیازمند انتخاب مجدد</option>}
          {products.map(product => <option key={product.id} value={product.id}
            disabled={content[key].includes(product.id) && product.id !== id}>{product.name}</option>)}
        </select>
        <button type="button" title="بالا" aria-label="انتقال محصول به بالا" disabled={index === 0}
          onClick={() => edit(key, move(content[key], index, -1))}><ArrowUp size={16} /></button>
        <button type="button" title="پایین" aria-label="انتقال محصول به پایین" disabled={index === content[key].length - 1}
          onClick={() => edit(key, move(content[key], index, 1))}><ArrowDown size={16} /></button>
        <button type="button" title="حذف" aria-label="حذف محصول از این بخش" disabled={!connected}
          onClick={() => edit(key, content[key].filter((_, i) => i !== index))}><Trash2 size={15} /></button>
      </div>)}
      <button type="button" className="fst-btn" disabled={!connected || content[key].length >= 6 || !products.some(p => !content[key].includes(p.id))}
        onClick={() => addProduct(key)}>افزودن محصول <Plus size={15}/></button>
      <p className="fst-helper">فقط محصولات فعال و منتشرشده دیتابیس قابل انتخاب هستند. قیمت و تصویر هر کارت از همان محصول خوانده می‌شود.</p>
    </div>;
  }
  return <div>
    <header className="fst-page-heading">
      <div><small>FERTINI / HOMEPAGE STUDIO</small><h1>مدیریت صفحه اصلی</h1>
        <p>چیدمان بخش‌ها دقیقا مطابق هوم‌پیج است. هر بخش را انتخاب کن، محتوایش را تغییر بده و ذخیره کن.</p>
      </div>
      <Link href="/" target="_blank" className="fst-btn">مشاهده فروشگاه <ExternalLink size={16}/></Link>
    </header>
    {error && <div className="fst-error" role="alert">{error}</div>}
    {success && <div className="fst-notice" role="status">{success}</div>}
    {!connected && <div className="fst-notice mb-4">
      امکان ذخیره تغییرات در حال حاضر در دسترس نیست. دوباره تلاش کنید.
    </div>}
    <LiveHomePreview unsaved={changed}/>
    <form onSubmit={e => void save(e)} className="grid gap-4">
      <section className="fst-card scroll-mt-24" id="fst-editor-layout">
        <div className="fst-editor-heading"><span>00 / PAGE STRUCTURE</span><h2>ترتیب و نمایش بخش‌ها</h2></div>
        <p className="fst-helper">هیرو همیشه اول است. کمپین، محصولات، گروه‌های بویایی و راهنمای ارسال را می‌توان مستقل از هم جابه‌جا یا پنهان کرد.</p>
        {content.sectionOrder.map((section, i) => <div className="fst-list-row" key={section}>
          <span className="fst-index">{String(i + 1).padStart(2, "0")}</span>
          <strong className="flex-1 text-sm">{sectionTitles[section]}</strong>
          <label className="fst-visibility"><input type="checkbox" checked={content.sectionVisibility[section]}
            onChange={event => edit("sectionVisibility", { ...content.sectionVisibility, [section]: event.target.checked })}/> نمایش</label>
          <button aria-label={"انتقال " + sectionTitles[section] + " به بالا"} type="button" disabled={i === 0}
            onClick={() => edit("sectionOrder", move(content.sectionOrder, i, -1))}><ArrowUp size={17}/></button>
          <button aria-label={"انتقال " + sectionTitles[section] + " به پایین"} type="button" disabled={i === content.sectionOrder.length - 1}
            onClick={() => edit("sectionOrder", move(content.sectionOrder, i, 1))}><ArrowDown size={17}/></button>
        </div>)}
      </section>
      <section className="fst-card scroll-mt-24" id="fst-editor-campaign">
       <div className="fst-editor-heading"><span>CAMPAIGNS / PROMOTION</span><h2>کمپین‌ها</h2></div>
       <p className="fst-helper">کمپین فعال مطابق بازه زمانی و ترتیب انتخاب‌شده پس از هیرو نمایش داده می‌شود. بنر، تاریخ و محصولات را در بخش اختصاصی مدیریت کن.</p>
       <Link href="/admin/campaigns" className="fst-btn">مدیریت کمپین‌ها <ExternalLink size={15}/></Link>
      </section>
      <section className="fst-card scroll-mt-24" id="fst-editor-hero">
        <div className="fst-editor-heading"><span>HERO / SLIDER</span><h2>اسلایدهای هیرو</h2></div>
        <p className="fst-helper">بین دو تا پنج تصویر؛ ترتیب اسلایدها، متن جایگزین و فایل هر اسلاید مستقل است.</p>
        <div className="fst-hero-editors">
          {content.heroSlides.map((slide, index) => <div className="fst-hero-editor" key={index}>
            <div className="fst-hero-image"><img src={slide.photo} alt={slide.alt}/></div>
            <div className="fst-hero-fields">
              <strong>اسلاید {index + 1}</strong>
              <label className="fst-field">انتخاب تصویر موجود
                <select value={slide.photo} onChange={e => setHero(index, { photo: e.target.value })}>
                  {assetOptions(slide.photo).map(x => <option value={x.url} key={x.url}>{x.label}</option>)}
                </select>
              </label>
              <label className="fst-field">متن جایگزین تصویر
                <input required maxLength={180} value={slide.alt} onChange={e => setHero(index, { alt: e.target.value })}/>
              </label>
              <div className="fst-editor-actions">
                <label className="fst-btn cursor-pointer">آپلود تصویر <UploadCloud size={15}/>
                  <input className="sr-only" type="file" accept=".jpg,.jpeg,.png,.webp"
                    disabled={uploading !== null} onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file, "hero", index); e.target.value = ""; }}/>
                </label>
                {uploading === "hero" + index && <small>در حال آپلود…</small>}
                <button className="fst-btn" type="button" disabled={index === 0}
                  onClick={() => edit("heroSlides", move(content.heroSlides, index, -1))}>بالا <ArrowUp size={14}/></button>
                <button className="fst-btn" type="button" disabled={index === content.heroSlides.length - 1}
                  onClick={() => edit("heroSlides", move(content.heroSlides, index, 1))}>پایین <ArrowDown size={14}/></button>
                <button className="fst-btn" type="button" disabled={content.heroSlides.length <= 2}
                  onClick={() => { edit("heroSlides", content.heroSlides.filter((_, i) => i !== index));  }}>حذف <Trash2 size={14}/></button>
              </div>
            </div>
          </div>)}
        </div>
        <button className="fst-btn mt-4" type="button" disabled={content.heroSlides.length >= 5}
          onClick={() => edit("heroSlides", [...content.heroSlides, { ...content.heroSlides[content.heroSlides.length - 1] }])}>
          اسلاید جدید <Plus size={16}/></button>
      </section>
      <section className="fst-card scroll-mt-24" id="fst-editor-best">
        <div className="fst-editor-heading"><span>01 / THE MOST LOVED</span><h2>پرفروش‌ترین‌ها</h2></div>
        <div className="fst-tools-grid mb-5">
          <label className="fst-field">عنوان<input required maxLength={70} value={content.bestsellerTitle}
            onChange={e => edit("bestsellerTitle", e.target.value)}/></label>
          <label className="fst-field">توضیح<textarea maxLength={260} value={content.bestsellerDescription}
            onChange={e => edit("bestsellerDescription", e.target.value)}/></label>
        </div>{productEditor("bestsellerIds")}
      </section>
      <section className="fst-card scroll-mt-24" id="fst-editor-latest">
        <div className="fst-editor-heading"><span>02 / JUST ARRIVED</span><h2>جدیدترین عطرها</h2></div>
        <div className="fst-tools-grid mb-5">
          <label className="fst-field">عنوان<input required maxLength={70} value={content.latestTitle}
            onChange={e => edit("latestTitle", e.target.value)}/></label>
          <label className="fst-field">توضیح<textarea maxLength={260} value={content.latestDescription}
            onChange={e => edit("latestDescription", e.target.value)}/></label>
        </div>
        <label className="fst-field mb-5">متن دکمه مشاهده همه
          <input maxLength={45} required value={content.latestCtaLabel} onChange={e => edit("latestCtaLabel", e.target.value)}/>
        </label>
        {productEditor("latestIds")}
      </section>
      <section className="fst-card scroll-mt-24" id="fst-editor-families">
        <div className="fst-editor-heading"><span>03 / OLFACTIVE FAMILIES</span><h2>گروه‌های بویایی</h2></div>
        <div className="fst-tools-grid mb-5">
          <label className="fst-field">عنوان<input maxLength={70} required value={content.familyTitle}
            onChange={e => edit("familyTitle", e.target.value)}/></label>
          <label className="fst-field">توضیح<textarea maxLength={260} value={content.familyDescription}
            onChange={e => edit("familyDescription", e.target.value)}/></label>
        </div>
        <div className="fst-notice">کارت‌های گروه بویایی مستقیما از دیتابیس خوانده می‌شوند و تصویر هر گروه را از مدیریت گروه‌های بویایی می‌گیرند.
         <Link className="underline mx-1" href="/admin/scent-families">مدیریت عکس و گروه‌های بویایی</Link>
        </div>
      </section>
      <section className="fst-card scroll-mt-24" id="fst-editor-footer">
        <div className="fst-editor-heading"><span>FOOTER / COPY</span><h2>متن‌های فوتر</h2></div>
        <div className="fst-tools-grid">
          <label className="fst-field">شعار کوتاه انگلیسی
            <input value={content.footerTagline} maxLength={130} onChange={e => edit("footerTagline", e.target.value)}/></label>
          <label className="fst-field">شعار فارسی
            <input value={content.footerCaption} maxLength={130} onChange={e => edit("footerCaption", e.target.value)}/></label>
        </div>
        <p className="fst-helper">لینک‌های فوتر به صفحه‌های داخلی موجود متصل‌اند و آدرس آن‌ها دستی وارد نمی‌شود.</p>
      </section>
      <div className="fst-notice">
        مدیریت قیمت، حجم، موجودی، تصاویر محصول و وویس اختصاصی هر عطر در
        <Link className="underline mx-1" href="/admin/products">مدیریت محصولات <Package size={13} className="inline"/></Link>
        انجام می‌شود؛ اینجا فقط نحوه نمایش محصولات روی هوم‌پیج تنظیم می‌شود.
      </div>
      <div className="fst-save-bar">
        <span>{!connected ? "امکان ذخیره فعلا در دسترس نیست" : changed ? "تغییرات ذخیره‌نشده وجود دارد" : "همه تغییرات ذخیره شده‌اند"}</span>
        <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={() => void load()} className="fst-btn">بازخوانی <RefreshCw size={15}/></button>
          <button type="submit" disabled={!connected || !changed || busy} className="fst-btn fst-btn-primary">
            {busy ? "در حال ذخیره…" : "ذخیره تغییرات"} <Save size={16}/>
          </button>
        </div>
      </div>
    </form>
  </div>;
}
