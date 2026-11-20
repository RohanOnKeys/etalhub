/* etal waitlist form
   Paste your form endpoint below (Formspree, Getform, Basin, or your own API).
   Example: "https://formspree.io/f/abcdwxyz"
   While it is empty, the form will not pretend to work: it shows an error instead. */
const WAITLIST_ENDPOINT = "";

const form = document.getElementById("waitlist");
const statusEl = document.getElementById("status");
const done = document.getElementById("done");
const button = form.querySelector("button[type=submit]");

function setStatus(msg, isError = true) {
  statusEl.textContent = msg;
  statusEl.classList.toggle("is-error", isError);
}

function validate(data) {
  if (!data.get("name").trim()) return ["name", "Please add your name."];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.get("email").trim())) return ["email", "That email doesn’t look right."];
  if (!data.get("role")) return ["role", "Pick how you’re joining."];
  return null;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = new FormData(form);
  form.querySelectorAll("[aria-invalid]").forEach((n) => n.removeAttribute("aria-invalid"));

  const problem = validate(data);
  if (problem) {
    const [name, msg] = problem;
    const input = form.querySelector(`[name="${name}"]`);
    input.setAttribute("aria-invalid", "true");
    input.focus();
    setStatus(msg);
    return;
  }
  if (data.get("_gotcha")) return; // bot filled the hidden field

  if (!WAITLIST_ENDPOINT) {
    setStatus("The waitlist isn’t connected yet. Please check back soon.");
    console.warn("etal waitlist: set WAITLIST_ENDPOINT in waitlist.js");
    return;
  }

  button.disabled = true;
  button.textContent = "Joining…";
  setStatus("", false);
  try {
    const res = await fetch(WAITLIST_ENDPOINT, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(res.status);
    form.hidden = true;
    done.hidden = false;
    done.querySelector("h2").focus?.();
  } catch {
    setStatus("Something went wrong. Please try again in a moment.");
    button.disabled = false;
    button.textContent = "Join the Mindmesh";
  }
});
