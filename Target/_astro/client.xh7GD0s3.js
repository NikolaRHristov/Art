import{h as F,r as I,b as d,S as L}from"./web.-BnuLZhQ.js";var R=e=>(t,r,n,{client:o})=>{if(!e.hasAttribute("ssr"))return;const a="only"!==o,s=a?F:I;let l,i={};if(Object.keys(n).length>0){if("only"!==o){const t=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,(t=>t===e?NodeFilter.FILTER_SKIP:"ASTRO-SLOT"===t.nodeName?NodeFilter.FILTER_ACCEPT:"ASTRO-ISLAND"===t.nodeName?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_SKIP));for(;l=t.nextNode();)i[l.getAttribute("name")||"default"]=l}for(const[e,t]of Object.entries(n))i[e]||(i[e]=document.createElement("astro-slot"),"default"!==e&&i[e].setAttribute("name",e),i[e].innerHTML=t)}const{default:c,...u}=i,E=e.dataset.solidRenderId,T=s((()=>{const e=()=>d(t,{...r,...u,children:c});return a?d(L,{get children(){return e()}}):e()}),e,{renderId:E});e.addEventListener("astro:unmount",(()=>T()),{once:!0})};export{R as default};