/* etal waitlist form
   Signups are emailed through FormSubmit (formsubmit.co), no account needed.
   The very first submission sends an activation email to the address below;
   click the link in it once and every signup after that arrives in the inbox.
   After activating, FormSubmit also emails you a random alias: paste it in place
   of the address here so the email isn't visible in the page source. */
const WAITLIST_ENDPOINT = "https://formsubmit.co/ajax/robinxander@gmail.com";

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
  if (data.get("_honey")) return; // bot filled the hidden field

  if (!WAITLIST_ENDPOINT) {
    setStatus("The waitlist isn’t connected yet. Please check back soon.");
    console.warn("etal waitlist: set WAITLIST_ENDPOINT in waitlist.js");
    return;
  }

  button.disabled = true;
  button.textContent = "Joining…";
  setStatus("", false);
  try {
    const payload = {
      name: data.get("name").trim(),
      email: data.get("email").trim(),
      role: data.get("role"),
      field: data.get("field").trim() || "-",
      languages: data.getAll("languages").join(", ") || "-",
      _subject: "New Mindmesh waitlist signup",
      _template: "table",
      _captcha: "false",
    };
    const res = await fetch(WAITLIST_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json", Accept: "application/json" },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || String(json.success) === "false") throw new Error(json.message || res.status);
    form.hidden = true;
    done.hidden = false;
    done.querySelector("h2").focus?.();
  } catch {
    setStatus("Something went wrong. Please try again in a moment.");
    button.disabled = false;
    button.textContent = "Join the Mindmesh";
  }
});
