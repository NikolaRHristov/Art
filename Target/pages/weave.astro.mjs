import { c as createComponent, r as renderComponent, a as renderTemplate, d as renderScript } from '../chunks/astro/server_ClTxVl8H.mjs';
import 'kleur/colors';
import { $ as $$Base } from '../chunks/Base_mohS12oS.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Weave = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Base, { "data-astro-cid-utvhmuqa": true }, { "default": ($$result2) => renderTemplate`  ${renderScript($$result2, "D:/Developer/Application/NikolaRHristov/Art/Source/pages/Weave.astro?astro&type=script&index=0&lang.ts")} ${renderScript($$result2, "D:/Developer/Application/NikolaRHristov/Art/Source/pages/Weave.astro?astro&type=script&index=1&lang.ts")} ` })}`;
}, "D:/Developer/Application/NikolaRHristov/Art/Source/pages/Weave.astro", void 0);

const $$file = "D:/Developer/Application/NikolaRHristov/Art/Source/pages/Weave.astro";
const $$url = "/Weave";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Weave,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
