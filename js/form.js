/* ==========================================================
   SSB Soft — contact form personality
   Focus lines, a greeting from the email domain, tidy phone
   numbers, quick-start chips, an encouraging message box and
   a send button that wakes up when the form is ready.
   ========================================================== */
(() => {
  "use strict";

  const form = document.querySelector(".form");
  if (!form) return;
  const $ = (s, c = form) => c.querySelector(s);
  const $$ = (s, c = form) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const email = $("#f-email"), phone = $("#f-phone"), msg = $("#f-msg");
  const send = $("button[type=submit]");

  /* 1. Fields wake up: a thin line draws around the box on focus */
  $$(".field").forEach((f) => {
    f.insertAdjacentHTML("beforeend",
      '<svg class="field__line" aria-hidden="true"><rect x="1" y="1" rx="14" ry="14" pathLength="1"/></svg>');
  });

  /* 2. The email field recognises the company behind the address */
  const FREE = /^(gmail|googlemail|yahoo|ymail|outlook|hotmail|live|msn|icloud|me|mac|aol|proton|protonmail|pm|zohomail|yandex|gmx|mail|rediffmail|rocketmail|hey|fastmail|tutanota|qq|163)$/i;
  const noteWrap = $(".field__note"), note = $("#f-email-note");
  const companyFrom = (value) => {
    const m = /^[^@\s]+@([a-z0-9-]+)(\.[a-z0-9-]+)+$/i.exec(value.trim());
    if (!m) return null;
    const name = m[1];
    if (FREE.test(name) || name.length < 2) return null;
    return name.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };
  let noteTimer;
  const updateNote = () => {
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => {
      const company = email.checkValidity() ? companyFrom(email.value) : null;
      if (company) note.textContent = `Nice to meet you, ${company} 👋`;
      noteWrap.classList.toggle("is-on", !!company);
    }, 350);
  };
  email.addEventListener("input", updateNote);
  email.addEventListener("blur", updateNote);

  /* 3. Phone numbers tidy themselves as you type */
  const group = (digits, sizes) => {
    const out = []; let i = 0;
    for (const n of sizes) { if (i >= digits.length) break; out.push(digits.slice(i, i + n)); i += n; }
    if (i < digits.length) out.push(digits.slice(i));
    return out.join(" ");
  };
  const formatPhone = (raw) => {
    const plus = raw.trim().startsWith("+");
    const d = raw.replace(/\D/g, "").slice(0, 15);
    if (!plus) return d.length > 10 ? group(d, [5, 5]) : group(d, [5, 5]);
    const codes = [["971", [2, 3, 4]], ["91", [5, 5]], ["44", [4, 6]], ["65", [4, 4]], ["1", [3, 3, 4]]];
    for (const [cc, sizes] of codes) {
      if (d.startsWith(cc)) return ("+" + cc + " " + group(d.slice(cc.length), sizes)).trim();
    }
    return "+" + group(d, [2, 3, 3, 4]);
  };
  phone.addEventListener("input", () => {
    const atEnd = phone.selectionStart === phone.value.length;
    const next = formatPhone(phone.value);
    if (next !== phone.value) {
      phone.value = next;
      if (atEnd) phone.setSelectionRange(next.length, next.length);
    }
  });

  /* 4. Quick-start chips write the first line for you */
  const starters = $$(".chip").map((c) => c.dataset.start);
  $$(".chip").forEach((chip) => chip.addEventListener("click", () => {
    const current = msg.value.trim();
    const onlyStarter = !current || starters.some((s) => s.trim() === current);
    msg.value = onlyStarter ? chip.dataset.start : msg.value.replace(/\s*$/, "") + "\n" + chip.dataset.start;
    $$(".chip").forEach((c) => c.classList.toggle("is-on", c === chip));
    msg.focus();
    msg.setSelectionRange(msg.value.length, msg.value.length);
    msg.dispatchEvent(new Event("input", { bubbles: true }));
  }));

  /* 5a. Encouraging note that grows with the message */
  const hint = $("#f-msg-hint");
  const lines = [
    [0, "A sentence or two is plenty."],
    [1, "Keep going — what are you building?"],
    [8, "That’s helpful."],
    [25, "Perfect — that’s all we need to start."],
  ];
  let lastLine = "";
  const updateHint = () => {
    const words = msg.value.trim() ? msg.value.trim().split(/\s+/).length : 0;
    const text = lines.filter(([n]) => words >= n).pop()[1];
    if (text === lastLine) return;
    lastLine = text;
    hint.classList.add("is-swapping");
    setTimeout(() => {
      hint.textContent = text;
      hint.classList.toggle("is-good", words >= 8);
      hint.classList.remove("is-swapping");
    }, reduceMotion ? 0 : 160);
  };
  msg.addEventListener("input", updateHint);

  /* 5b. While the message box is empty and focused, examples type themselves out */
  const ghost = $(".field__ghost");
  const EXAMPLES = [
    "We need three React engineers by March…",
    "An MVP for a clinic booking app, live in a month…",
    "Our 10-year-old billing system needs to move to the cloud…",
    "We’re raising a seed round and need a tech partner…",
  ];
  let typing = 0, ex = 0;
  const stopTyping = () => { clearTimeout(typing); typing = 0; ghost.textContent = ""; };
  const typeExample = () => {
    if (reduceMotion) { ghost.textContent = EXAMPLES[0]; return; }
    const text = EXAMPLES[ex % EXAMPLES.length];
    let i = 0, deleting = false;
    const step = () => {
      if (msg.value || document.activeElement !== msg) { stopTyping(); return; }
      if (!deleting) {
        ghost.textContent = text.slice(0, ++i);
        if (i === text.length) { deleting = true; typing = setTimeout(step, 1700); return; }
        typing = setTimeout(step, 34 + Math.random() * 40);
      } else {
        ghost.textContent = text.slice(0, --i);
        if (i === 0) { ex++; typing = setTimeout(typeExample, 350); return; }
        typing = setTimeout(step, 14);
      }
    };
    step();
  };
  msg.addEventListener("focus", () => { if (!msg.value) { stopTyping(); typing = setTimeout(typeExample, 450); } });
  msg.addEventListener("blur", stopTyping);
  msg.addEventListener("input", () => { if (msg.value) stopTyping(); else if (!typing) typeExample(); });

  /* 6. The send button wakes up when the form is ready */
  let wasReady = false;
  const updateReady = () => {
    const ready = email.checkValidity() && !!email.value.trim() && !!msg.value.trim();
    send.classList.toggle("is-sleepy", !ready);
    if (ready && !wasReady && !reduceMotion) {
      send.classList.remove("wake"); void send.offsetWidth; send.classList.add("wake");
    }
    wasReady = ready;
  };
  [email, msg].forEach((el) => el.addEventListener("input", updateReady));
  updateReady();

  // reset helpers when the form is cleared after sending
  form.addEventListener("reset", () => setTimeout(() => {
    noteWrap.classList.remove("is-on");
    $$(".chip").forEach((c) => c.classList.remove("is-on"));
    lastLine = ""; updateHint(); updateReady();
  }, 0));
})();
