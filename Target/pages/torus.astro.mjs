import { c as createComponent, r as renderTemplate, a as renderComponent } from '../chunks/astro/server_Co1wDJYm.mjs';
import 'kleur/colors';
import { $ as $$Base } from '../chunks/Base_DYeB59EK.mjs';
export { renderers } from '../renderers.mjs';

const $$Torus = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Base", $$Base, {})}`;
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
//# sourceMappingURL=torus.astro.mjs.map
