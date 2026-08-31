import { useEffect, useMemo, useRef, useState } from 'react'
import { CaretLeft, CaretRight, Heart, MagnifyingGlass, Minus, Plus } from '@phosphor-icons/react'
import type { Announcement, Locale, Product, Route, StorefrontData } from '../domain/types'
import type { ProductReview, SessionInfo } from '../domain/types'
import type { ApiClient } from '../api/client'
import { availableStock } from '../domain/logic'
import { MediaImage } from '../components/MediaImage'
import { RichContent } from '../components/RichContent'

interface Common {
  data: StorefrontData
  locale: Locale
  online: boolean
  navigate: (route: Route, id?: string) => void
  addToCart: (product: Product, quantity?: number) => void
  favoriteIds: string[]
  toggleFavorite: (productId: string) => void
  api: ApiClient | null
  session: SessionInfo | null
}
const text = (locale: Locale, th: string, en: string) => locale === 'th' ? th : en

export function StorefrontPage({ data, locale, navigate, addToCart, favoriteIds, toggleFavorite, favoritesOnly = false }: Common & { favoritesOnly?: boolean }) {
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('all')
  const products = useMemo(() => data.products.filter((product) => {
    const search = `${product.titleTh} ${product.titleEn}`.toLowerCase()
    const matchesQuery = search.includes(query.toLowerCase())
    const matchesCategory = category === 'all' || category === 'ready' && product.type === 'READY' || category === 'preorder' && product.type === 'PREORDER' || product.categoryId === category
    return product.active && matchesQuery && matchesCategory && (!favoritesOnly || favoriteIds.includes(product.id))
  }), [data.products, query, category, favoritesOnly, favoriteIds])
  return <div className="page storefront-page">
    {!favoritesOnly && <AnnouncementSlideshow announcements={data.announcements.filter((item) => item.active)} locale={locale} onOpen={id=>navigate('announcement',id)} />}
    <label className="search-field" data-animate-item><MagnifyingGlass size={21} aria-hidden="true" /><span className="sr-only">{text(locale, 'ค้นหาสินค้า', 'Search products')}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text(locale, 'ค้นหาสินค้าและหมวดหมู่', 'Search products and categories')} /></label>
    {!favoritesOnly && <div className="category-scroll" data-animate-item>{data.categories.filter((item) => item.active).map((item) => <button type="button" key={item.id} className={category === item.id ? 'is-active' : ''} onClick={() => setCategory(item.id)}>{text(locale, item.nameTh, item.nameEn)}</button>)}</div>}
    <div className="section-heading" data-animate-item><div><h1>{favoritesOnly ? text(locale, 'รายการโปรด', 'Favorites') : text(locale, 'แนะนำสำหรับคุณ', 'Recommended for you')}</h1><p>{text(locale, `${products.length} รายการ`, `${products.length} items`)}</p></div></div>
    {products.length === 0 ? <div className="empty-state" data-animate-item><Heart size={32} /><h2>{favoritesOnly ? text(locale, 'ยังไม่มีสินค้าที่กดหัวใจ', 'No favorites yet') : text(locale, 'ไม่พบสินค้าที่ค้นหา', 'No matching products')}</h2><p>{favoritesOnly ? text(locale, 'แตะหัวใจที่สินค้าเพื่อเก็บไว้ดูภายหลัง', 'Tap the heart on a product to save it here.') : text(locale, 'ลองใช้คำค้นอื่นหรือเลือกหมวดหมู่ทั้งหมด', 'Try another search or view all categories.')}</p><button className="secondary-button" onClick={() => favoritesOnly ? navigate('home') : (setQuery(''), setCategory('all'))}>{text(locale, 'ดูสินค้าทั้งหมด', 'View all products')}</button></div> : <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} locale={locale} favorite={favoriteIds.includes(product.id)} onFavorite={() => toggleFavorite(product.id)} onOpen={() => navigate('product', product.id)} onAdd={() => addToCart(product)} />)}</div>}
  </div>
}

function AnnouncementSlideshow({ announcements, locale, onOpen }: { announcements: Announcement[]; locale: Locale; onOpen:(id:string)=>void }) {
  const [index, setIndex] = useState(0); const startX = useRef<number | null>(null)
  const move = (delta: number) => setIndex((value) => (value + delta + announcements.length) % announcements.length)
  useEffect(() => { if (announcements.length < 2) return; const timer = window.setInterval(() => move(1), 5500); return () => clearInterval(timer) }, [announcements.length])
  useEffect(() => { if (index >= announcements.length) setIndex(0) }, [announcements.length, index])
  if (!announcements.length) return null
  const item = announcements[index]
  return <section className="announcement-slider" data-animate-item aria-roledescription="carousel" aria-label={text(locale, 'ประกาศจากร้าน', 'Store announcements')} onPointerDown={(event) => { startX.current = event.clientX }} onPointerUp={(event) => { if (startX.current === null) return; const delta = event.clientX - startX.current; if (Math.abs(delta) > 45) move(delta > 0 ? -1 : 1); startX.current = null }}>
    <article className={`announcement ${item.imageUrl ? 'has-image' : ''}`}>{item.imageUrl && <MediaImage src={item.imageUrl} alt="" loading="eager"/>}<span className="announcement-copy"><span className="announcement-type">{item.kind === 'PREORDER' ? 'Pre-order' : text(locale, 'ประกาศ', 'Announcement')}</span><strong>{text(locale, item.headerTh, item.headerEn)}</strong><span className="announcement-summary">{text(locale, item.bodyTh, item.bodyEn)}</span><button className="announcement-more" type="button" onClick={()=>onOpen(item.id)}>{text(locale,'อ่านต่อ','Read more')}<CaretRight/></button></span></article>
    {announcements.length > 1 && <><button type="button" className="slide-control is-prev" onClick={() => move(-1)} aria-label={text(locale, 'ประกาศก่อนหน้า', 'Previous announcement')}><CaretLeft /></button><button type="button" className="slide-control is-next" onClick={() => move(1)} aria-label={text(locale, 'ประกาศถัดไป', 'Next announcement')}><CaretRight /></button><div className="slide-dots">{announcements.map((announcement, dot) => <button key={announcement.id} type="button" className={dot === index ? 'is-active' : ''} onClick={() => setIndex(dot)} aria-label={`${dot + 1}/${announcements.length}`} />)}</div></>}
  </section>
}

function ProductCard({ product, locale, favorite, onOpen, onAdd, onFavorite }: { product: Product; locale: Locale; favorite: boolean; onOpen: () => void; onAdd: () => void; onFavorite: () => void }) {
  const remaining = availableStock(product)
  return <article className="product-card" data-animate-item>
    <div className="product-image-wrap"><button type="button" className="product-image" onClick={onOpen} aria-label={text(locale, product.titleTh, product.titleEn)}><MediaImage src={product.imageUrls[0]} alt=""/><span className={`stock-pill ${remaining <= 3 ? 'is-low' : ''}`}>{product.type === 'PREORDER' ? 'Pre-order' : text(locale, `เหลือ ${remaining}`, `${remaining} left`)}</span></button><button type="button" className={`favorite-button ${favorite ? 'is-active' : ''}`} onClick={onFavorite} aria-pressed={favorite} aria-label={text(locale, favorite ? 'นำออกจากรายการโปรด' : 'เพิ่มในรายการโปรด', favorite ? 'Remove from favorites' : 'Add to favorites')}><Heart size={20} weight={favorite ? 'fill' : 'regular'} /></button></div>
    <div className="product-content"><button type="button" className="product-title" onClick={onOpen}>{text(locale, product.titleTh, product.titleEn)}</button><p>{product.type === 'PREORDER' ? text(locale, `มัดจำ ฿${product.deposit.toLocaleString()}`, `Deposit ฿${product.deposit.toLocaleString()}`) : text(locale, `ได้ ${product.points} แต้ม`, `Earn ${product.points} points`)}</p><div className="product-price"><strong>฿{product.price.toLocaleString()}</strong><button type="button" className="add-button" onClick={onAdd} disabled={remaining < 1} aria-label={text(locale, `เพิ่ม ${product.titleTh}`, `Add ${product.titleEn}`)}><Plus size={21} /></button></div></div>
  </article>
}

function ProductGallery({ product, locale }: { product: Product; locale: Locale }) {
  const images = product.imageUrls.length ? product.imageUrls : ['']; const [index, setIndex] = useState(0)
  useEffect(() => setIndex(0), [product.id])
  return <div className="product-gallery" data-animate-item><div className="detail-image"><MediaImage src={images[index]} alt={`${text(locale, product.titleTh, product.titleEn)} ${index + 1}`} loading="eager"/>{images.length > 1 && <><button className="gallery-control is-prev" onClick={() => setIndex((index - 1 + images.length) % images.length)} aria-label={text(locale, 'รูปก่อนหน้า', 'Previous image')}><CaretLeft /></button><button className="gallery-control is-next" onClick={() => setIndex((index + 1) % images.length)} aria-label={text(locale, 'รูปถัดไป', 'Next image')}><CaretRight /></button></>}</div>{images.length > 1 && <div className="gallery-thumbs">{images.map((image, imageIndex) => <button type="button" key={`${image}-${imageIndex}`} className={imageIndex === index ? 'is-active' : ''} onClick={() => setIndex(imageIndex)}><MediaImage src={image} alt=""/></button>)}</div>}</div>
}

export function ProductPage({ data, locale, productId, navigate, addToCart, favoriteIds, toggleFavorite, api, session }: Common & { productId?: string }) {
  const product = data.products.find((item) => item.id === productId) || data.products[0]; const [quantity, setQuantity] = useState(1)
  if (!product) return null
  const remaining = availableStock(product); const campaign = data.campaigns.find((item) => item.id === product.preorderCampaignId); const favorite = favoriteIds.includes(product.id)
  return <div className="page product-page">
    <button className="back-button" type="button" onClick={() => navigate('home')}>← {text(locale, 'กลับ', 'Back')}</button>
    <div className="product-detail-grid">
      <ProductGallery product={product} locale={locale} />
      <section data-animate-item><div className="eyebrow-row"><span className="stock-pill">{product.type === 'PREORDER' ? 'Pre-order' : text(locale, 'พร้อมส่ง', 'Ready stock')}</span><button className={`icon-button ${favorite ? 'is-favorite' : ''}`} type="button" onClick={() => toggleFavorite(product.id)} aria-pressed={favorite} aria-label={text(locale, 'สลับรายการโปรด', 'Toggle favorite')}><Heart size={21} weight={favorite ? 'fill' : 'regular'} /></button></div><h1>{text(locale, product.titleTh, product.titleEn)}</h1><p className="lead">{text(locale, product.descriptionTh, product.descriptionEn)}</p>
        {campaign && <div className="campaign-note"><strong>{text(locale, campaign.nameTh, campaign.nameEn)}</strong><span>{text(locale, `คาดว่าถึง ${new Date(campaign.expectedArrival).toLocaleDateString('th-TH')}`, `Expected ${new Date(campaign.expectedArrival).toLocaleDateString('en-US')}`)}</span></div>}
        <div className="detail-price"><strong>฿{product.price.toLocaleString()}</strong><span>{product.type === 'PREORDER' ? text(locale, `มัดจำวันนี้ ฿${product.deposit.toLocaleString()}`, `Deposit today ฿${product.deposit.toLocaleString()}`) : text(locale, `คงเหลือ ${remaining} ชิ้น`, `${remaining} remaining`)}</span></div>
        <div className="quantity-row"><div><strong>{text(locale, 'จำนวน', 'Quantity')}</strong><span>{text(locale, `สูงสุด ${product.purchaseLimit} ชิ้นต่อคน`, `Maximum ${product.purchaseLimit} per person`)}</span></div><div className="stepper"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label={text(locale, 'ลดจำนวน', 'Decrease quantity')}><Minus /></button><output>{quantity}</output><button type="button" onClick={() => setQuantity(Math.min(product.purchaseLimit, remaining, quantity + 1))} aria-label={text(locale, 'เพิ่มจำนวน', 'Increase quantity')}><Plus /></button></div></div>
        <button className="primary-button sticky-mobile-action" type="button" onClick={() => addToCart(product, quantity)} disabled={remaining < 1}>{text(locale, `เพิ่มลงตะกร้า · ฿${(product.price * quantity).toLocaleString()}`, `Add to cart · ฿${(product.price * quantity).toLocaleString()}`)}</button>
      </section>
    </div>
    {product.contentEnabled&&<RichContent blocks={product.content} locale={locale}/>}
    {data.settings.reviewsEnabled&&product.reviewEnabled&&<ReviewsPanel locale={locale} productId={product.id} api={api} session={session}/>}
  </div>
}

export function AnnouncementPage({data,locale,productId,navigate,addToCart}:Common&{productId?:string}){const item=data.announcements.find(row=>row.id===productId);if(!item)return <div className="page narrow-page"><div className="empty-state"><h1>{text(locale,'ไม่พบประกาศ','Announcement not found')}</h1><button onClick={()=>navigate('home')} className="primary-button">{text(locale,'กลับหน้าแรก','Back home')}</button></div></div>;const products=data.products.filter(product=>(item.productIds||[]).includes(product.id));return <div className="page announcement-page"><button className="back-button" onClick={()=>navigate('home')}>← {text(locale,'กลับ','Back')}</button><header>{item.imageUrl&&<MediaImage src={item.imageUrl} alt="" loading="eager"/>}<span>{item.kind}</span><h1>{text(locale,item.headerTh,item.headerEn)}</h1><p>{text(locale,item.bodyTh,item.bodyEn)}</p></header>{item.contentEnabled&&<RichContent blocks={item.content} locale={locale}/>} {products.length>0&&<section><div className="section-heading"><div><h2>{text(locale,'สินค้าในประกาศนี้','Products in this announcement')}</h2><p>{products.length} {text(locale,'รายการ','items')}</p></div></div><div className="announcement-products">{products.map(product=><article key={product.id}><button onClick={()=>navigate('product',product.id)}><MediaImage src={product.imageUrls[0]} alt=""/><strong>{text(locale,product.titleTh,product.titleEn)}</strong><span>฿{product.price.toLocaleString()}</span></button><button className="add-button" disabled={availableStock(product)<1} onClick={()=>addToCart(product)}><Plus/></button></article>)}</div></section>}</div>}

function ReviewsPanel({locale,productId,api,session}:{locale:Locale;productId:string;api:ApiClient|null;session:SessionInfo|null}){const [reviews,setReviews]=useState<ProductReview[]>([]);const [rating,setRating]=useState(5);const [body,setBody]=useState('');const [message,setMessage]=useState('');useEffect(()=>{api?.productReviews(productId).then(setReviews).catch(()=>undefined)},[api,productId]);const submit=async()=>{if(!api||!session){setMessage(text(locale,'กรุณาเข้าสู่ระบบก่อนรีวิว','Sign in to review'));return}try{await api.createReview(session.token,productId,rating,body);setBody('');setMessage(text(locale,'ส่งรีวิวแล้ว รอแอดมินอนุมัติ','Review submitted for approval'))}catch(e){setMessage(e instanceof Error?e.message:'Error')}};return <section className="reviews-panel"><div className="section-heading"><div><h2>{text(locale,'รีวิวจากผู้ซื้อ','Customer reviews')}</h2><p>{reviews.length} {text(locale,'รีวิว','reviews')}</p></div></div>{reviews.map(r=><article key={r.id}><strong>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</strong><span>{r.displayName}</span><p>{r.body}</p>{r.adminReply&&<small>{text(locale,'ร้านตอบ: ','Store reply: ')}{r.adminReply}</small>}</article>)}<div className="review-form"><select value={rating} onChange={e=>setRating(Number(e.target.value))}>{[5,4,3,2,1].map(v=><option key={v} value={v}>{v} ★</option>)}</select><textarea placeholder={text(locale,'เขียนรีวิวหลังได้รับสินค้า','Write a review after delivery')} value={body} onChange={e=>setBody(e.target.value)}/><button className="secondary-button" onClick={submit}>{text(locale,'ส่งรีวิว','Submit review')}</button>{message&&<small>{message}</small>}</div></section>}
