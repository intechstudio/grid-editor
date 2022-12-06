export function decodeBase64(s){
  let e={},i,b=0,c,x,l=0,a,r='',w=String.fromCharCode,L=s.length;
  const A="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  for(i=0;i<64;i++){e[A.charAt(i)]=i;}
  for(x=0;x<L;x++){
      c=e[s.charAt(x)];b=(b<<6)+c;l+=6;
      while(l>=8){((a=(b>>>(l-=8))&0xff)||(x<(L-2)))&&(r+=w(a));}
  }
  return r;
}