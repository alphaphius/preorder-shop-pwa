import { useEffect, useState } from 'react'

interface InstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

export function useInstallPrompt() {
  const [promptEvent,setPromptEvent]=useState<InstallPromptEvent|null>(null)
  const [installed,setInstalled]=useState(()=>matchMedia('(display-mode: standalone)').matches)
  useEffect(()=>{const ready=(event:Event)=>{event.preventDefault();setPromptEvent(event as InstallPromptEvent)};const done=()=>{setInstalled(true);setPromptEvent(null)};addEventListener('beforeinstallprompt',ready);addEventListener('appinstalled',done);return()=>{removeEventListener('beforeinstallprompt',ready);removeEventListener('appinstalled',done)}},[])
  const install=async()=>{if(!promptEvent)return;await promptEvent.prompt();const result=await promptEvent.userChoice;if(result.outcome==='accepted')setPromptEvent(null)}
  return { canInstall:!installed&&Boolean(promptEvent),installed,install }
}
