import { c as createComponent, r as renderComponent, a as renderTemplate } from '../chunks/astro/server_ClTxVl8H.mjs';
import 'kleur/colors';
import { $ as $$Base } from '../chunks/Base_D6EZLmJ6.mjs';
export { renderers } from '../renderers.mjs';

const $$Noise = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Base, {}, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Animated", null, { "client:only": "solid-js", "Text": "Animated", "Animation": 1, "client:component-hydration": "only", "client:component-path": "@Function/Page/Noise/Animated.tsx", "client:component-export": "default" })} ${renderComponent($$result2, "Static", null, { "client:only": "solid-js", "Text": "Static", "client:component-hydration": "only", "client:component-path": "@Function/Page/Noise/Static.tsx", "client:component-export": "default" })} ` })}`;
}, "D:/Developer/Application/NikolaRHristov/Art/Source/pages/Noise.astro", void 0);

const $$file = "D:/Developer/Application/NikolaRHristov/Art/Source/pages/Noise.astro";
const $$url = "/Noise";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Noise,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
