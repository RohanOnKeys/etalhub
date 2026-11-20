/* etal — languages page: exact count, per-group totals, live search */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const grid = $("#langGrid");
const groups = $$(".lcat", grid);

// Count unique entries across all groups and fill every [data-lang-count].
const unique = new Set($$("li", grid).map((li) => li.textContent.trim().toLowerCase()));
$$("[data-lang-count]").forEach((n) => (n.textContent = unique.size));

// Entry count under each group name.
groups.forEach((group) => {
  const small = document.createElement("small");
  small.textContent = $$("li", group).length;
  $("h3", group).appendChild(small);
});

// Search: highlight matches, hide groups with none, offer the waitlist if nothing matches.
const input = $("#langSearch");
const hits = $("#langHits");
const missing = $("#langMissing");
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9+#]/g, "");

input.addEventListener("input", () => {
  const q = norm(input.value);
  grid.classList.toggle("is-filtering", !!q);
  let count = 0;
  groups.forEach((group) => {
    let any = false;
    $$("li", group).forEach((li) => {
      const on = !!q && norm(li.textContent).includes(q);
      li.classList.toggle("hit", on);
      if (on) { any = true; count++; }
    });
    group.classList.toggle("no-hit", !!q && !any);
  });
  hits.textContent = q ? `${count} match${count === 1 ? "" : "es"}` : "";
  missing.hidden = !q || count > 0;
});
