import { c as createComponent, b as renderHead, d as renderScript, a as renderTemplate } from '../chunks/astro/server_ClTxVl8H.mjs';
import 'kleur/colors';
import 'clsx';
/* empty css                                    */
export { renderers } from '../renderers.mjs';

const $$Pamphlet = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`<html lang="en" data-astro-cid-yliycdhu> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>3-Part Pamphlet with Three.js</title>${renderHead()}</head> <body data-astro-cid-yliycdhu> ${renderScript($$result, "D:/Developer/Application/NikolaRHristov/Art/Source/pages/Pamphlet.astro?astro&type=script&index=0&lang.ts")} ${renderScript($$result, "D:/Developer/Application/NikolaRHristov/Art/Source/pages/Pamphlet.astro?astro&type=script&index=1&lang.ts")} </body> </html>`;
}, "D:/Developer/Application/NikolaRHristov/Art/Source/pages/Pamphlet.astro", void 0);

const $$file = "D:/Developer/Application/NikolaRHristov/Art/Source/pages/Pamphlet.astro";
const $$url = "/Pamphlet";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Pamphlet,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
