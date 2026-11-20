/* etal — landing page interactions */
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => t * t * (3 - 2 * t);
const range = (p, a, b) => ease(clamp((p - a) / (b - a)));

// Seeded random so the generated cells look the same on every load.
function seeded(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Organic closed blob path (Catmull-Rom → Bézier).
function blobPath(cx, cy, r, rnd, n = 9, jitter = 0.16) {
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (1 + (rnd() * 2 - 1) * jitter);
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  });
  const P = (i) => pts[(i + n) % n];
  let d = `M${P(0)[0].toFixed(1)} ${P(0)[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + "Z";
}
const NS = "http://www.w3.org/2000/svg";
function el(tag, attrs = {}, parent) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

/* ---------- nav: transparent over the hero, solid after ---------- */
const nav = $("#nav");
const hero = $(".hero");
function updateNav() {
  nav.classList.toggle("is-solid", scrollY > hero.offsetHeight - 80);
}

/* ---------- hero video: pause offscreen, respect reduced motion ---------- */
const heroVideo = $("#heroVideo");
if (reduceMotion) {
  heroVideo.removeAttribute("autoplay");
  heroVideo.pause();
} else {
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) heroVideo.play().catch(() => {});
    else heroVideo.pause();
  }).observe(hero);
}

/* ---------- reveal on scroll + count-up ---------- */
function countUp(node) {
  const target = +node.dataset.count;
  const suffix = node.dataset.suffix || "";
  if (reduceMotion) return;
  const t0 = performance.now();
  const step = (t) => {
    const k = ease(clamp((t - t0) / 1400));
    node.textContent = Math.round(target * k) + suffix;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const io = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      $$("[data-count]", e.target).forEach(countUp);
      io.unobserve(e.target);
    }),
  { threshold: 0.15 }
);
$$(".reveal").forEach((n) => io.observe(n));

/* ---------- quick facts carousel ---------- */
const facts = $$(".fact");
const factsCount = $("#factsCount");
let factIdx = 0;
$$(".facts__nav .arrow").forEach((b) =>
  b.addEventListener("click", () => {
    facts[factIdx].classList.remove("is-active");
    factIdx = (factIdx + +b.dataset.dir + facts.length) % facts.length;
    facts[factIdx].classList.add("is-active");
    factsCount.textContent = `0${factIdx + 1} / 0${facts.length}`;
  })
);

/* ---------- how it works: accordion + illustration stage ---------- */
const steps = $$(".step");
const arts = $$(".art");
const stageCaption = $("#stageCaption");
let current = 0;
let autoplay = !reduceMotion;
let stepT0 = performance.now();
let howVisible = false;
const STEP_MS = 6500;

function openStep(i) {
  current = i;
  steps.forEach((s, k) => {
    const on = k === i;
    s.classList.toggle("is-open", on);
    $(".step__head", s).setAttribute("aria-expanded", on);
    s.style.setProperty("--p", 0);
  });
  arts.forEach((a, k) => a.classList.toggle("is-active", k === i));
  stageCaption.textContent = `0${i + 1} · ${$(".step__t", steps[i]).textContent}`;
  stepT0 = performance.now();
}
steps.forEach((s, i) =>
  $(".step__head", s).addEventListener("click", () => {
    autoplay = false; // a person chose: stop cycling
    openStep(i);
  })
);
function tickSteps(t) {
  if (autoplay && howVisible) {
    const p = (t - stepT0) / STEP_MS;
    steps[current].style.setProperty("--p", clamp(p));
    if (p >= 1) openStep((current + 1) % steps.length);
  } else {
    stepT0 = t - (parseFloat(steps[current].style.getPropertyValue("--p")) || 0) * STEP_MS;
  }
  if (autoplay) requestAnimationFrame(tickSteps);
  else steps.forEach((s) => s.style.setProperty("--p", 0));
}
new IntersectionObserver(([e]) => (howVisible = e.isIntersecting), { threshold: 0.35 }).observe($("#how"));
if (autoplay) requestAnimationFrame(tickSteps);

// Illustration 02: a field of pages that agentpeers light up as they read.
(function buildPeerGrid() {
  const g = $("#peerGrid");
  const rnd = seeded(21);
  const cells = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const x = 200 + (c - 2) * 56 + (r % 2 ? 28 : 0) - 14;
      const y = 200 + (r - 2) * 54;
      if (Math.hypot(x - 200, y - 200) > 150) continue;
      const fill = rnd() < 0.18 ? "url(#cellD)" : rnd() < 0.35 ? "url(#cellB)" : "url(#cellW)";
      cells.push(el("path", { d: blobPath(x, y, 21 + rnd() * 5, rnd), fill, class: "pc" }, g));
    }
  }
  if (reduceMotion) return;
  setInterval(() => {
    const p = cells[Math.floor(Math.random() * cells.length)];
    const f = p.getAttribute("fill");
    p.setAttribute("fill", f === "url(#cellW)" ? "url(#cellB)" : f === "url(#cellB)" ? "url(#cellD)" : "url(#cellW)");
  }, 450);
})();

/* ---------- door → mindmesh (scroll-driven) ---------- */
const door = $("#sealroom");
function updateDoor() {
  const r = door.getBoundingClientRect();
  const total = door.offsetHeight - innerHeight;
  const p = clamp(-r.top / total);
  door.style.setProperty("--open", range(p, 0.04, 0.34).toFixed(4));
  door.style.setProperty("--zoom", range(p, 0.3, 0.62).toFixed(4));
  door.style.setProperty("--mesh", range(p, 0.44, 0.7).toFixed(4));
}

(function buildMesh() {
  const svg = $("#meshSvg");
  const rnd = seeded(1979);
  const C = { x: 600, y: 430 };
  const placed = [];

  // surrounding cells: agentpeers (blue nuclei) and humans (near-black nuclei)
  for (let tries = 0; tries < 2500 && placed.length < 64; tries++) {
    const r = 20 + rnd() * 30;
    const x = -30 + rnd() * 1260;
    const y = -30 + rnd() * 760;
    if (Math.hypot(x - C.x, y - C.y) < 205 + r) continue;
    if (x > 300 && x < 900 && y < 215) continue; // keep the heading clear
    if (x > 380 && x < 820 && y > 610) continue; // keep the legend clear
    if (placed.some((o) => Math.hypot(o.x - x, o.y - y) < o.r + r + 12)) continue;
    placed.push({ x, y, r });
  }
  placed.forEach(({ x, y, r }) => {
    const g = el("g", { class: "mc" }, svg);
    g.style.setProperty("--d", `${8 + rnd() * 8}s`);
    g.style.setProperty("--delay", `${-rnd() * 10}s`);
    g.style.setProperty("--fx", `${(rnd() - 0.5) * 14}px`);
    g.style.setProperty("--fy", `${(rnd() - 0.5) * 14}px`);
    g.style.setProperty("--fr", `${(rnd() - 0.5) * 10}deg`);
    const tone = rnd();
    el("path", {
      d: blobPath(x, y, r, rnd, 9, 0.2),
      fill: tone < 0.5 ? "#cddcf0" : tone < 0.8 ? "#bfd1ea" : "#d9e4f3",
      stroke: "#a9c0e2", "stroke-width": 1.2,
    }, g);
    const agent = rnd() < 0.55;
    el("path", {
      d: blobPath(x + (rnd() - 0.5) * r * 0.3, y + (rnd() - 0.5) * r * 0.3, r * (0.32 + rnd() * 0.08), rnd, 7, 0.12),
      fill: agent ? "#2f6be0" : "#0b1d45",
    }, g);
  });

  // central sealroom: concentric membrane, spokes, dark core, contents
  const core = el("g", {}, svg);
  el("circle", { cx: C.x, cy: C.y, r: 184, fill: "#c4d6ef", opacity: 0.55 }, core);
  const spokes = el("g", { class: "core-spin", stroke: "#7ea2dc", "stroke-width": 1.4, opacity: 0.8 }, core);
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    const r1 = 158, r2 = 176 + (i % 3) * 4;
    el("line", { x1: C.x + Math.cos(a) * r1, y1: C.y + Math.sin(a) * r1, x2: C.x + Math.cos(a) * r2, y2: C.y + Math.sin(a) * r2 }, spokes);
  }
  el("path", { d: blobPath(C.x, C.y, 156, rnd, 12, 0.03), fill: "#7fa3dc" }, core);
  el("circle", { cx: C.x, cy: C.y, r: 128, fill: "#3f6fc2" }, core);
  el("circle", { cx: C.x, cy: C.y, r: 104, fill: "#1b3a7a" }, core);
  el("circle", { cx: C.x, cy: C.y, r: 84, fill: "#060f26" }, core);
  const inner = el("g", { class: "core-spin" }, core);
  const colors = ["#2f6be0", "#6fa0ff", "#8b9bb8", "#2f6be0", "#c4d6ef"];
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 64;
    el("circle", { cx: C.x + Math.cos(a) * d, cy: C.y + Math.sin(a) * d, r: 2.5 + rnd() * 5, fill: colors[i % colors.length] }, inner);
  }
})();

/* ---------- languages: count, per-category totals, search ---------- */
(function languages() {
  const grid = $("#langGrid");
  const chips = $$("li", grid);
  const unique = new Set(chips.map((c) => c.textContent.trim().toLowerCase()));
  const total = unique.size;
  $$("[data-lang-count]").forEach((n) => (n.textContent = total));
  const stat = $("[data-lang-stat]");
  if (stat) { stat.dataset.count = total; stat.dataset.suffix = ""; stat.textContent = total; }
  $$(".lcat", grid).forEach((cat) => {
    const small = document.createElement("small");
    small.textContent = $$("li", cat).length;
    $("h3", cat).appendChild(small);
  });

  const input = $("#langSearch");
  const hits = $("#langHits");
  const missing = $("#langMissing");
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9+#]/g, "");
  input.addEventListener("input", () => {
    const q = norm(input.value);
    grid.classList.toggle("is-filtering", !!q);
    let count = 0;
    $$(".lcat", grid).forEach((cat) => {
      let any = false;
      $$("li", cat).forEach((li) => {
        const on = !!q && norm(li.textContent).includes(q);
        li.classList.toggle("hit", on);
        if (on) { any = true; count++; }
      });
      cat.classList.toggle("no-hit", !!q && !any);
    });
    hits.textContent = q ? `${count} match${count === 1 ? "" : "es"}` : "";
    missing.hidden = !q || count > 0;
  });
})();

/* ---------- fields marquee: duplicate each row for a seamless loop ---------- */
$$(".marquee__track").forEach((track) => {
  [...track.children].forEach((li) => {
    const copy = li.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    track.appendChild(copy);
  });
});

/* ---------- FAQ: one open at a time ---------- */
$$(".faq details").forEach((d) =>
  d.addEventListener("toggle", () => {
    if (d.open) $$(".faq details[open]").forEach((o) => o !== d && (o.open = false));
  })
);

/* ---------- wiring ---------- */
let ticking = false;
addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { updateNav(); updateDoor(); ticking = false; });
}, { passive: true });
addEventListener("resize", updateDoor);

updateNav();
updateDoor();
