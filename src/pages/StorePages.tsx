import { useMemo, useState } from 'react'
import { Heart, MagnifyingGlass, Minus, Plus } from '@phosphor-icons/react'
import type { Locale, Product, Route, StorefrontData } from '../domain/types'
import { availableStock } from '../domain/logic'

interface Common { data: StorefrontData; locale: Locale; online: boolean; navigate: (route: Route, id?: string) => void; addToCart: (product: Product, quantity?: number) => void }
const text = (locale: Locale, th: string, en: string) => locale === 'th' ? th : en

export function StorefrontPage({ data, locale, navigate, addToCart }: Common) {
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('all')
  const products = useMemo(() => data.products.filter((product) => {
    const search = `${product.titleTh} ${product.titleEn}`.toLowerCase()
    const matchesQuery = search.includes(query.toLowerCase())
    const matchesCategory = category === 'all' || category === 'ready' && product.type === 'READY' || category === 'preorder' && product.type === 'PREORDER' || product.categoryId === category
    return product.active && matchesQuery && matchesCategory
  }), [data.products, query, category])
  return <div className="page storefront-page">
    {data.announcements.filter((item) => item.active).slice(0, 1).map((item) => <button type="button" className="announcement" key={item.id} data-animate-item onClick={() => category !== 'preorder' && setCategory('preorder')}><span className="announcement-type">{item.kind === 'PREORDER' ? 'Pre-order' : text(locale, 'ประกาศ', 'Announcement')}</span><strong>{text(locale, item.headerTh, item.headerEn)}</strong><p>{text(locale, item.bodyTh, item.bodyEn)}</p></button>)}
    <label className="search-field" data-animate-item><MagnifyingGlass size={21} aria-hidden="true" /><span className="sr-only">{text(locale, 'ค้นหาสินค้า', 'Search products')}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text(locale, 'ค้นหาสินค้าและหมวดหมู่', 'Search products and categories')} /></label>
    <div className="category-scroll" data-animate-item>{data.categories.filter((item) => item.active).map((item) => <button type="button" key={item.id} className={category === item.id ? 'is-active' : ''} onClick={() => setCategory(item.id)}>{text(locale, item.nameTh, item.nameEn)}</button>)}</div>
    <div className="section-heading" data-animate-item><div><h1>{text(locale, 'แนะนำสำหรับคุณ', 'Recommended for you')}</h1><p>{text(locale, `${products.length} รายการ`, `${products.length} items`)}</p></div></div>
    {products.length === 0 ? <div className="empty-state" data-animate-item><MagnifyingGlass size={32} /><h2>{text(locale, 'ไม่พบสินค้าที่ค้นหา', 'No matching products')}</h2><p>{text(locale, 'ลองใช้คำค้นอื่นหรือเลือกหมวดหมู่ทั้งหมด', 'Try another search or view all categories.')}</p><button className="secondary-button" onClick={() => { setQuery(''); setCategory('all') }}>{text(locale, 'ดูสินค้าทั้งหมด', 'View all products')}</button></div> : <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} locale={locale} onOpen={() => navigate('product', product.id)} onAdd={() => addToCart(product)} />)}</div>}
  </div>
}

function ProductCard({ product, locale, onOpen, onAdd }: { product: Product; locale: Locale; onOpen: () => void; onAdd: () => void }) {
  const remaining = availableStock(product)
  return <article className="product-card" data-animate-item>
    <button type="button" className="product-image" onClick={onOpen} aria-label={text(locale, product.titleTh, product.titleEn)}>{product.imageUrls[0] ? <img src={product.imageUrls[0]} alt="" /> : <span>1:1</span>}<span className={`stock-pill ${remaining <= 3 ? 'is-low' : ''}`}>{product.type === 'PREORDER' ? 'Pre-order' : text(locale, `เหลือ ${remaining}`, `${remaining} left`)}</span></button>
    <div className="product-content"><button type="button" className="product-title" onClick={onOpen}>{text(locale, product.titleTh, product.titleEn)}</button><p>{product.type === 'PREORDER' ? text(locale, `มัดจำ ฿${product.deposit.toLocaleString()}`, `Deposit ฿${product.deposit.toLocaleString()}`) : text(locale, `ได้ ${product.points} แต้ม`, `Earn ${product.points} points`)}</p><div className="product-price"><strong>฿{product.price.toLocaleString()}</strong><button type="button" className="add-button" onClick={onAdd} disabled={remaining < 1} aria-label={text(locale, `เพิ่ม ${product.titleTh}`, `Add ${product.titleEn}`)}><Plus size={21} /></button></div></div>
  </article>
}

export function ProductPage({ data, locale, productId, navigate, addToCart }: Common & { productId?: string }) {
  const product = data.products.find((item) => item.id === productId) || data.products[0]; const [quantity, setQuantity] = useState(1)
  const remaining = availableStock(product); const campaign = data.campaigns.find((item) => item.id === product.preorderCampaignId)
  return <div className="page product-page">
    <button className="back-button" type="button" onClick={() => navigate('home')}>← {text(locale, 'กลับ', 'Back')}</button>
    <div className="product-detail-grid">
      <div className="detail-image" data-animate-item>{product.imageUrls[0] ? <img src={product.imageUrls[0]} alt={text(locale, product.titleTh, product.titleEn)} /> : <span>{text(locale, 'รูปสินค้า', 'Product image')}</span>}</div>
      <section data-animate-item><div className="eyebrow-row"><span className="stock-pill">{product.type === 'PREORDER' ? 'Pre-order' : text(locale, 'พร้อมส่ง', 'Ready stock')}</span><button className="icon-button" type="button" aria-label={text(locale, 'เพิ่มในรายการโปรด', 'Add to favorites')}><Heart size={21} /></button></div><h1>{text(locale, product.titleTh, product.titleEn)}</h1><p className="lead">{text(locale, product.descriptionTh, product.descriptionEn)}</p>
        {campaign && <div className="campaign-note"><strong>{text(locale, campaign.nameTh, campaign.nameEn)}</strong><span>{text(locale, `คาดว่าถึง ${new Date(campaign.expectedArrival).toLocaleDateString('th-TH')}`, `Expected ${new Date(campaign.expectedArrival).toLocaleDateString('en-US')}`)}</span></div>}
        <div className="detail-price"><strong>฿{product.price.toLocaleString()}</strong><span>{product.type === 'PREORDER' ? text(locale, `มัดจำวันนี้ ฿${product.deposit.toLocaleString()}`, `Deposit today ฿${product.deposit.toLocaleString()}`) : text(locale, `คงเหลือ ${remaining} ชิ้น`, `${remaining} remaining`)}</span></div>
        <div className="quantity-row"><div><strong>{text(locale, 'จำนวน', 'Quantity')}</strong><span>{text(locale, `สูงสุด ${product.purchaseLimit} ชิ้นต่อคน`, `Maximum ${product.purchaseLimit} per person`)}</span></div><div className="stepper"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label={text(locale, 'ลดจำนวน', 'Decrease quantity')}><Minus /></button><output>{quantity}</output><button type="button" onClick={() => setQuantity(Math.min(product.purchaseLimit, remaining, quantity + 1))} aria-label={text(locale, 'เพิ่มจำนวน', 'Increase quantity')}><Plus /></button></div></div>
        <button className="primary-button sticky-mobile-action" type="button" onClick={() => addToCart(product, quantity)} disabled={remaining < 1}>{text(locale, `เพิ่มลงตะกร้า · ฿${(product.price * quantity).toLocaleString()}`, `Add to cart · ฿${(product.price * quantity).toLocaleString()}`)}</button>
      </section>
    </div>
  </div>
}
