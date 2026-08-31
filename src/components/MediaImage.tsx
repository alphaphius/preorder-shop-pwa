import { useEffect,useRef,useState } from 'react'
import { ApiClient } from '../api/client'
import { configuredWebAppUrl } from '../config/runtime'

const cache=new Map<string,string>()
const api=new ApiClient(configuredWebAppUrl())

export function MediaImage({src,alt='',className,loading='lazy'}:{src?:string;alt?:string;className?:string;loading?:'eager'|'lazy'}){
  const imageRef=useRef<HTMLImageElement>(null);const [shouldLoad,setShouldLoad]=useState(loading==='eager')
  const [resolved,setResolved]=useState(()=>src?.startsWith('file:')?cache.get(src)||'':src||'')
  useEffect(()=>{if(shouldLoad||!imageRef.current)return;const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setShouldLoad(true);observer.disconnect()}},{rootMargin:'240px'});observer.observe(imageRef.current);return()=>observer.disconnect()},[shouldLoad])
  useEffect(()=>{let active=true;if(!shouldLoad)return;if(!src){setResolved('');return}if(!src.startsWith('file:')){setResolved(src);return}const cached=cache.get(src);if(cached){setResolved(cached);return}api.publicMedia(src.slice(5)).then(file=>{const value=`data:${file.mimeType};base64,${file.base64}`;cache.set(src,value);if(active)setResolved(value)}).catch(()=>{if(active)setResolved('')});return()=>{active=false}},[src,shouldLoad])
  return <img ref={imageRef} src={shouldLoad&&resolved?resolved:undefined} alt={alt} className={`${resolved?'':'media-placeholder'} ${className||''}`} loading={loading}/>
}
