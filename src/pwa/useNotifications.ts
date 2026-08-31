import { useCallback,useEffect,useState } from 'react'
import type { ApiClient } from '../api/client'
import type { Locale,SessionInfo } from '../domain/types'

const preferenceKey='shop.notifications.enabled'

export function useNotifications({api,session,locale}:{api:ApiClient|null;session:SessionInfo|null;locale:Locale}){
  const supported='Notification' in window&&'serviceWorker' in navigator
  const [enabled,setEnabled]=useState(()=>supported&&Notification.permission==='granted'&&localStorage.getItem(preferenceKey)==='true')
  const [count,setCount]=useState(0)
  const enable=useCallback(async()=>{if(!supported)return false;const permission=await Notification.requestPermission();const granted=permission==='granted';localStorage.setItem(preferenceKey,String(granted));setEnabled(granted);return granted},[supported])
  useEffect(()=>{if(!enabled||!api||!session)return;const cursorKey=`shop.notifications.cursor.${session.user.id}`;if(!localStorage.getItem(cursorKey))localStorage.setItem(cursorKey,new Date().toISOString());let active=true;const poll=async()=>{try{const since=localStorage.getItem(cursorKey)||new Date().toISOString();const result=await api.notificationFeed(session.token,since);if(!active)return;localStorage.setItem(cursorKey,result.cursor);if(!result.events.length)return;setCount(value=>value+result.events.length);const registration=await navigator.serviceWorker.ready;for(const event of result.events.slice(-3)){await registration.showNotification(locale==='th'?event.titleTh:event.titleEn,{body:locale==='th'?event.bodyTh:event.bodyEn,icon:`${import.meta.env.BASE_URL}icon-192.png`,badge:`${import.meta.env.BASE_URL}icon-192.png`,tag:event.id,data:{url:['ADMIN','OWNER'].includes(session.user.role)?'#/admin':'#/orders'}})}}catch{/* keep polling without interrupting the app */}};void poll();const timer=window.setInterval(poll,30000);return()=>{active=false;clearInterval(timer)}},[api,enabled,locale,session?.token,session?.user.id,session?.user.role])
  return{supported,enabled,count,enable,clearCount:()=>setCount(0)}
}
