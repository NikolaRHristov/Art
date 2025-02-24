import { c as createComponent, r as renderComponent, a as renderTemplate, d as renderScript } from '../chunks/astro/server_CZophjH_.mjs';
import 'kleur/colors';
import { $ as $$Base } from '../chunks/Base_C1q5ZvIS.mjs';
export { renderers } from '../renderers.mjs';

const $$Torus = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Base, {}, { "default": ($$result2) => renderTemplate` ${renderScript($$result2, "D:/Developer/Application/NikolaRHristov/Art/Source/pages/Torus.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "D:/Developer/Application/NikolaRHristov/Art/Source/pages/Torus.astro", void 0);

const $$file = "D:/Developer/Application/NikolaRHristov/Art/Source/pages/Torus.astro";
const $$url = "/Torus";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Torus,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
