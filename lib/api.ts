export const API_URL=(process.env.NEXT_PUBLIC_API_URL||"http://localhost/appscope/backend/public").replace(/\/$/,"");
const TOKEN_KEY="appscope_admin_token";
export const auth={get:()=>typeof window==="undefined"?null:sessionStorage.getItem(TOKEN_KEY),set:(v:string)=>sessionStorage.setItem(TOKEN_KEY,v),clear:()=>sessionStorage.removeItem(TOKEN_KEY)};
export async function api<T=unknown>(path:string,init:RequestInit={}):Promise<T>{
 const token=auth.get(); const response=await fetch(API_URL+path,{...init,headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`} :{}),...(init.headers||{})},cache:"no-store"});
 const payload=await response.json().catch(()=>({success:false,error:"Invalid server response"}));
 if(!response.ok||!payload.success){if(response.status===401&&path!=="/api/auth/login"&&path!=="/api/auth/mfa/verify")auth.clear();throw new Error(payload.error||`Request failed (${response.status})`)}
 return payload.data as T;
}

