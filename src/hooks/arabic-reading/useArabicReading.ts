import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ArabicActivityId } from '../../types/arabic-reading.contract';
import type { ArabicReadingActions } from '../../components/arabic-reading/presentation';
import { arabicBrowserOwner, type ArabicOwner } from '../../utils/arabicReadingIdentity';
import { ArabicReadingController, arabicInitialState } from './controller';

export function useArabicReading(owner:ArabicOwner,activityId:ArabicActivityId|undefined){
  const navigate=useNavigate(),ref=useRef<ArabicReadingController|null>(null),[state,setState]=useState(arabicInitialState);
  useEffect(()=>{
    const controller=new ArabicReadingController(owner,activityId,()=>arabicBrowserOwner()?.key===owner.key,navigate);ref.current=controller;
    const update=()=>setState(controller.state);const unsubscribe=controller.subscribe(update);update();controller.activate();
    return()=>{ref.current=null;unsubscribe();controller.dispose();};
    // Owner is an immutable scope; token refresh with the same claims preserves recovery.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[owner.key,activityId,navigate]);
  const actions:ArabicReadingActions={choose:id=>ref.current?.choose(id),start:()=>{void ref.current?.start();},back:()=>ref.current?.back(),retry:()=>{void ref.current?.load();},
    play:target=>{void ref.current?.play(target);},seek:position=>ref.current?.seek(position),listen:()=>{void ref.current?.listen();},
    record:()=>{void ref.current?.record();},stop:()=>ref.current?.stop(),cancel:()=>ref.current?.cancel(),
    send:()=>{void ref.current?.send();},resend:()=>{void ref.current?.send();},discard:()=>{void ref.current?.discard();}};
  return {...state,actions};
}
