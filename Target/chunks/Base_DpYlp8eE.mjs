import { c as createComponent, s as spreadAttributes, b as renderSlotToString, d as renderAllHeadContent, u as unescapeHTML, e as createAstro, r as renderTemplate, f as addAttribute, g as renderScript, a as renderComponent, m as maybeRenderHead, h as renderSlot } from './astro/server_BBImsahs.mjs';
import 'kleur/colors';
/* empty css                         */
import { renderSync, parse, walkSync, ELEMENT_NODE } from 'ultrahtml';
import 'clsx';

function has(value) {
  return typeof value === "string";
}
function is(a, b) {
  return a === b;
}
function any(a, b) {
  return has(a) && b.includes(a.toLowerCase());
}
const ElementWeights = {
  META: 10,
  TITLE: 9,
  PRECONNECT: 8,
  ASYNC_SCRIPT: 7,
  IMPORT_STYLES: 6,
  SYNC_SCRIPT: 5,
  SYNC_STYLES: 4,
  PRELOAD: 3,
  DEFER_SCRIPT: 2,
  PREFETCH_PRERENDER: 1,
  OTHER: 0
};
const ElementDetectors = {
  META: isMeta,
  TITLE: isTitle,
  PRECONNECT: isPreconnect,
  DEFER_SCRIPT: isDeferScript,
  ASYNC_SCRIPT: isAsyncScript,
  IMPORT_STYLES: isImportStyles,
  SYNC_SCRIPT: isSyncScript,
  SYNC_STYLES: isSyncStyles,
  PRELOAD: isPreload,
  PREFETCH_PRERENDER: isPrefetchPrerender
};
const META_HTTP_EQUIV_KEYWORDS = [
  "accept-ch",
  "content-security-policy",
  "content-type",
  "default-style",
  "delegate-ch",
  "origin-trial",
  "x-dns-prefetch-control"
];
function isMeta(name, a) {
  if (name === "base") return true;
  if (name !== "meta") return false;
  return has(a.charset) || is(a.name, "viewport") || any(a["http-equiv"], META_HTTP_EQUIV_KEYWORDS);
}
function isTitle(name) {
  return name === "title";
}
function isPreconnect(name, { rel }) {
  return name === "link" && is(rel, "preconnect");
}
function isAsyncScript(name, { src, async }) {
  return name === "script" && has(src) && has(async);
}
function isImportStyles(name, a, children) {
  const importRe = /@import/;
  if (name === "style") {
    return importRe.test(children);
  }
  return false;
}
function isSyncScript(name, { src, defer, async, type = "" }) {
  if (name !== "script") return false;
  return !(has(src) && (has(defer) || has(async) || is(type, "module")) || type.includes("json"));
}
function isSyncStyles(name, { rel }) {
  if (name === "style") return true;
  return name === "link" && is(rel, "stylesheet");
}
function isPreload(name, { rel }) {
  return name === "link" && any(rel, ["preload", "modulepreload"]);
}
function isDeferScript(name, { src, defer, async, type }) {
  if (name !== "script") return false;
  return has(src) && has(defer) || has(src) && is(type, "module") && !has(async);
}
function isPrefetchPrerender(name, { rel }) {
  return name === "link" && any(rel, ["prefetch", "dns-prefetch", "prerender"]);
}
function getWeight(element) {
  for (const [id, detector] of Object.entries(ElementDetectors)) {
    const children = element.name === "style" && element.children.length > 0 ? renderSync(element) : "";
    if (detector(element.name, element.attributes, children)) {
      return ElementWeights[id];
    }
  }
  return ElementWeights.OTHER;
}

function capo(html) {
  const ast = parse(html);
  try {
    walkSync(ast, (node, parent, index) => {
      if (node.type === ELEMENT_NODE && node.name === "head") {
        if (parent) {
          parent.children.splice(index, 1, getSortedHead(node));
          throw "done";
        }
      }
    });
  } catch (e) {
    if (e !== "done") throw e;
  }
  return renderSync(ast);
}
function getSortedHead(head) {
  const weightedChildren = head.children.map((node) => {
    if (node.type === ELEMENT_NODE) {
      const weight = getWeight(node);
      return [weight, node];
    }
  }).filter(Boolean);
  const children = weightedChildren.sort((a, b) => b[0] - a[0]).map(([_, element]) => element);
  return { ...head, children };
}

const Head = createComponent({
  factory: async (result, props, slots) => {
    let head = "";
    head += `<head${spreadAttributes(props)} data-capo>`;
    head += await renderSlotToString(result, slots.default);
    head += renderAllHeadContent(result);
    head += "</head>";
    return unescapeHTML(capo(head));
  }
});

const $$Astro$1 = createAstro("http://art.nikolahristov.tech");
const $$ViewTransitions = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$ViewTransitions;
  const { fallback = "animate" } = Astro2.props;
  return renderTemplate`<meta name="astro-view-transitions-enabled" content="true"><meta name="astro-view-transitions-fallback"${addAttribute(fallback, "content")}>${renderScript($$result, "/run/media/nikola/Developer/Developer/node_modules/astro/components/ViewTransitions.astro?astro&type=script&index=0&lang.ts")}`;
}, "/run/media/nikola/Developer/Developer/node_modules/astro/components/ViewTransitions.astro", void 0);

const $$Astro = createAstro("http://art.nikolahristov.tech");
const $$Base = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Base;
  const { Title = "", Description = "" } = Astro2.props;
  return renderTemplate`<html lang="en" class="no-js" dir="ltr"> ${renderComponent($$result, "Head", Head, {}, { "default": ($$result2) => renderTemplate`${renderScript($$result2, "/run/media/nikola/Developer/Developer/Application/NikolaRHristov/Art/Source/Layout/Base.astro?astro&type=script&index=0&lang.ts")}<title>${Title}</title><meta charset="utf-8"><meta name="description"${addAttribute(Description, "content")}><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="theme-color" content=""><meta name="format-detection" content="telephone=no"><meta name="twitter:dnt" content="on"><link rel="preconnect" href="https://fonts.googleapis.com" crossorigin><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="manifest" href="/site.webmanifest" crossorigin="use-credentials">${renderSlot($$result2, $$slots["styles"])}${renderScript($$result2, "/run/media/nikola/Developer/Developer/Application/NikolaRHristov/Art/Source/Layout/Base.astro?astro&type=script&index=1&lang.ts")}${renderSlot($$result2, $$slots["scripts"])}${renderComponent($$result2, "ViewTransitions", $$ViewTransitions, {})}` })}${maybeRenderHead()}<body> <div class="grow"> ${renderSlot($$result, $$slots["default"])} </div> ${renderScript($$result, "/run/media/nikola/Developer/Developer/Application/NikolaRHristov/Art/Source/Layout/Base.astro?astro&type=script&index=2&lang.ts")} </body> </html>`;
}, "/run/media/nikola/Developer/Developer/Application/NikolaRHristov/Art/Source/Layout/Base.astro", void 0);

export { $$Base as $ };
//# sourceMappingURL=Base_DpYlp8eE.mjs.map
