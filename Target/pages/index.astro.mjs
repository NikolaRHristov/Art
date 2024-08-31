import { c as createComponent, r as renderTemplate, a as renderComponent, m as maybeRenderHead } from '../chunks/astro/server_9JS3_Hc2.mjs';
import 'kleur/colors';
import { $ as $$Base } from '../chunks/Base_CwCrcD8r.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Base", $$Base, {}, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<ul class="flex flex-1 flex-col justify-center sm:flex-row"> <li> <a href="/Noise" rel="prefetch">📄 Noise —</a> </li> <li> <a href="/Torus" rel="prefetch">📄 Torus —</a> </li> </ul> ` })}`;
}, "D:/Developer/Application/NikolaRHristov/Art/Source/pages/index.astro", void 0);

const $$file = "D:/Developer/Application/NikolaRHristov/Art/Source/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Index,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
//# sourceMappingURL=index.astro.mjs.map
