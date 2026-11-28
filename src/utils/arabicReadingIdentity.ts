export interface ArabicOwner {key:string; id:string; username:string; region:'ROW'; role:'student'; authVersion:string}
/** Untrusted token claims bind local resources only. Every server operation independently authorizes. */
export function arabicBrowserOwner():ArabicOwner|null {
  try{
    const user=JSON.parse(localStorage.getItem('AiTutorUser')??'null'),token=localStorage.getItem('accessToken');if(!token||!user)return null;
    const raw=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
    const claims=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(raw),c=>c.charCodeAt(0))));
    if(typeof claims.sub!=='string'||claims.sub!==user.id||typeof claims.username!=='string'||claims.username!==user.username||
      claims.role!=='STUDENT'||user.role?.toLowerCase()!=='student'||claims.region!=='ROW'||
      (user.region!==undefined&&user.region!=='ROW')||typeof claims.authVersion!=='string'||!claims.authVersion)return null;
    const owner={id:claims.sub as string,username:claims.username as string,region:'ROW' as const,role:'student' as const,authVersion:claims.authVersion as string};
    return {...owner,key:JSON.stringify([owner.id,owner.username,owner.region,owner.role,owner.authVersion])};
  }catch{return null;}
}
