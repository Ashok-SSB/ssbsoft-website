/* ==========================================================
   SSB Soft — delight layer
   Small, purposeful reactions at every interaction point.
   Rules: respond to the visitor, never perform at them;
   one gesture per element; everything off for reduced motion.
   ========================================================== */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Particle burst (used for moments of success) ---------- */
  const COLORS = ["#ef4444", "#fca5a5", "#b91c1c", "#111827", "#f87171"];
  function burst(el, count = 16) {
    if (reduceMotion || !el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "burst";
      const size = 4 + Math.random() * 5;
      p.style.cssText = `left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;background:${COLORS[i % COLORS.length]};border-radius:${Math.random() > .5 ? "50%" : "2px"}`;
      document.body.append(p);
      const a = (Math.PI * 2 * i) / count + Math.random() * .4;
      const d = 50 + Math.random() * 70;
      p.animate([
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d + 30}px)) rotate(${Math.random() * 360}deg) scale(.4)`, opacity: 0 },
      ], { duration: 800 + Math.random() * 400, easing: "cubic-bezier(.16,1,.3,1)" }).onfinish = () => p.remove();
    }
  }
  window.ssbDelight = { burst };

  /* ---------- Buttons: a soft light follows the pointer ---------- */
  if (finePointer) {
    document.addEventListener("pointermove", (e) => {
      const b = e.target.closest?.(".btn");
      if (!b) return;
      const r = b.getBoundingClientRect();
      b.style.setProperty("--bx", `${e.clientX - r.left}px`);
      b.style.setProperty("--by", `${e.clientY - r.top}px`);
    }, { passive: true });
  }

  /* ---------- Cards: border catches the light under the cursor ---------- */
  const glowCards = $$(".case, .feature");
  glowCards.forEach((c) => c.classList.add("glow"));
  if (finePointer) {
    glowCards.forEach((c) => c.addEventListener("pointermove", (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty("--gx", `${e.clientX - r.left}px`);
      c.style.setProperty("--gy", `${e.clientY - r.top}px`);
    }));
  }

  /* ---------- Hero logo: on hover, light traces the ribbon's edges once ---------- */
  const logoWrap = $(".hero__logo-wrap");
  if (logoWrap) {
    if (reduceMotion) {
      // show the finished mark straight away
      $(".mark__fill", logoWrap)?.removeAttribute("mask");
    } else {
      let busy = false;
      logoWrap.addEventListener("mouseenter", () => {
        if (busy) return;
        busy = true;
        logoWrap.classList.remove("trace"); void logoWrap.offsetWidth; logoWrap.classList.add("trace");
        setTimeout(() => { busy = false; }, 1400);
      });
    }
  }

  /* ---------- Rotating word: underline draws with each new word ---------- */
  const rotator = $(".rotator"), word = $(".rotator__word");
  if (rotator && word && !reduceMotion) {
    const draw = () => { rotator.classList.remove("draw"); void rotator.offsetWidth; rotator.classList.add("draw"); };
    new MutationObserver(() => { if (word.classList.contains("in")) draw(); }).observe(word, { attributes: true, attributeFilter: ["class"] });
    setTimeout(draw, 700);
  }

  /* ---------- Services: checkmarks draw themselves in ---------- */
  $$(".checks").forEach((list) => {
    list.classList.add("has-ticks");
    $$("li", list).forEach((li, i) => {
      li.style.setProperty("--td", `${.2 + i * .09}s`);
      li.insertAdjacentHTML("afterbegin", '<svg class="tick" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11"/><path d="M7 12.5l3.2 3.2L17 9"/></svg>');
    });
  });

  /* ---------- Testimonials: the quote mark nods at each new voice ---------- */
  const quote = $(".slider__quote");
  if (quote && !reduceMotion) {
    const nod = () => { quote.classList.remove("nod"); void quote.getBoundingClientRect(); quote.classList.add("nod"); };
    $$(".slide").forEach((s) => new MutationObserver(() => { if (s.classList.contains("is-active")) nod(); })
      .observe(s, { attributes: true, attributeFilter: ["class"] }));
  }

  /* ---------- Founder photo: gentle depth on scroll ---------- */
  const frame = $(".about__frame");
  if (frame && !reduceMotion) {
    const img = $("img", frame);
    let ticking = false;
    const update = () => {
      const r = frame.getBoundingClientRect();
      const off = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; // -1 … 1 around centre
      img.style.setProperty("--py", `${(off * -28).toFixed(1)}px`);
      ticking = false;
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- Contact: email field confirms when it looks right ---------- */
  const email = $("#f-email");
  if (email) {
    email.parentElement.insertAdjacentHTML("beforeend", '<svg class="field__ok" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4L18 8"/></svg>');
    const check = () => email.parentElement.classList.toggle("is-valid", email.value.includes("@") && email.checkValidity());
    email.addEventListener("input", check);
    email.addEventListener("blur", check);
  }

  /* ---------- Copy email with a friendly confirmation ---------- */
  $$("a[href^='mailto:contact@']").forEach((a) => {
    if (a.closest(".btn")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy";
    btn.setAttribute("aria-label", "Copy email address");
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg><span class="copy__tip" role="status"></span>';
    a.after(btn);
    btn.addEventListener("click", async () => {
      const text = a.getAttribute("href").replace("mailto:", "");
      try { await navigator.clipboard.writeText(text); }
      catch {
        const t = document.createElement("textarea"); t.value = text; document.body.append(t); t.select();
        try { document.execCommand("copy"); } catch {} t.remove();
      }
      $(".copy__tip", btn).textContent = "Copied ✓";
      btn.classList.remove("is-copied"); void btn.offsetWidth; btn.classList.add("is-copied");
      clearTimeout(btn._t);
      btn._t = setTimeout(() => btn.classList.remove("is-copied"), 1600);
    });
  });

  /* ---------- "Ready to build": a calendar card that picks a slot ---------- */
  const slotcard = $(".slotcard");
  if (slotcard) {
    const slots = $$(".slot", slotcard);
    const open = slots.filter((el) => !el.classList.contains("is-taken"));
    const clear = () => slots.forEach((el) => el.classList.remove("is-hover", "is-picked"));
    if (reduceMotion) {
      slotcard.classList.add("is-live", "is-done");
      open[Math.min(5, open.length - 1)]?.classList.add("is-picked");
    } else {
      let timers = [], visible = false, running = false;
      const later = (fn, ms) => timers.push(setTimeout(fn, ms));
      const stop = () => { timers.forEach(clearTimeout); timers = []; running = false; };
      const cycle = (again = false) => {
        running = true;
        clear();
        slotcard.classList.remove("is-done");
        slotcard.classList.add("is-live");
        // the eye wanders over a few open slots, then settles on one
        const picks = [...open].sort(() => Math.random() - .5).slice(0, 4);
        let t = again ? 300 : 1100;
        picks.slice(0, 3).forEach((el, i) => {
          later(() => { clear(); el.classList.add("is-hover"); }, t + i * 520);
        });
        t += 3 * 520;
        later(() => { clear(); picks[3].classList.add("is-picked"); slotcard.classList.add("is-done"); }, t);
        // let go of the pick and wander again; the slots stay on the card
        later(() => {
          slotcard.classList.remove("is-done"); clear();
          later(() => (visible ? cycle(true) : (running = false)), 600);
        }, t + 3600);
      };
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible && !running) cycle();
        if (!visible) { stop(); slotcard.classList.remove("is-live", "is-done"); clear(); }
      }, { threshold: .4 }).observe(slotcard);
    }
  }

  /* ---------- A hello for the curious ---------- */
  console.log(
    "%cSSB Soft%c\nCurious how this page was built? We like people who look under the hood.\nSay hello: contact@ssbsoft.com",
    "font: 800 22px 'Plus Jakarta Sans', sans-serif; color: #dc2626;",
    "font: 13px/1.6 Inter, sans-serif; color: #5b6474;"
  );
})();
