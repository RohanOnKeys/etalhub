// Tabs under the device switch the panel shown inside the mockup.
const captions = {
  sealroom: "Your manuscript stays locked in one encrypted room. Reviewers come in. Nothing goes out.",
  agentpeers: "Named AI reviewers flag gaps and ghostcites. Each comment is signed with a reasonprint, and a human countersigns the verdict.",
  claimtrace: "Every claim connects to the Python cell or MRL block that proves it, and the Replaybench reruns that code.",
};

const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");
const caption = document.getElementById("tabCaption");
const order = [...tabs].map((t) => t.dataset.tab);
let auto;

function show(name) {
  tabs.forEach((t) => {
    const on = t.dataset.tab === name;
    t.classList.toggle("is-active", on);
    t.setAttribute("aria-selected", on);
  });
  panels.forEach((p) => p.classList.toggle("is-active", p.dataset.panel === name));
  caption.textContent = captions[name];
}

tabs.forEach((t) =>
  t.addEventListener("click", () => {
    clearInterval(auto); // stop auto-cycling once someone picks a tab
    show(t.dataset.tab);
  })
);

// Gently cycle the tabs until someone clicks one (skipped for reduced motion).
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let i = 0;
  auto = setInterval(() => {
    i = (i + 1) % order.length;
    show(order[i]);
  }, 5000);
}

// Keep only one FAQ answer open at a time.
document.querySelectorAll(".faq details").forEach((d) =>
  d.addEventListener("toggle", () => {
    if (!d.open) return;
    document.querySelectorAll(".faq details[open]").forEach((o) => o !== d && (o.open = false));
  })
);
