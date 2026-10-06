/* ==========================================================
   SSB Soft — interactions & animation (vanilla JS, no deps)
   ========================================================== */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  $("#year").textContent = new Date().getFullYear();

  /* ---------- Hero headline: line-by-line mask reveal ---------- */
  $$(".hero__title .line").forEach((l, i) => l.style.setProperty("--ld", `${.15 + i * .12}s`));
  setTimeout(() => $(".hero__title")?.classList.add("is-in"), 60);

  /* ---------- Rotating hero word ---------- */
  const rotator = $(".rotator");
  if (rotator) {
    const words = ["launch", "scale", "modernize", "grow"];
    let wi = 0;
    const wordEl = $(".rotator__word", rotator);
    wordEl.classList.add("in");
    if (!reduceMotion) {
      setInterval(() => {
        wordEl.classList.remove("in");
        wordEl.classList.add("out");
        setTimeout(() => {
          wi = (wi + 1) % words.length;
          wordEl.textContent = words[wi];
          wordEl.classList.remove("out");
          void wordEl.offsetWidth;
          wordEl.classList.add("in");
        }, 420);
      }, 2600);
    }
  }

  /* ---------- Hero: flowing contour lines ---------- */
  const heroCanvas = $(".hero__canvas");
  if (heroCanvas) {
    const ctx = heroCanvas.getContext("2d");
    const hero = heroCanvas.parentElement;
    const target = { x: .7, y: .5 }, pointer = { x: .7, y: .5 };
    let W, H, dpr, t = 0, running = true;
    const born = performance.now();
    const LINES = 34, STEP = 6;

    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = hero.clientWidth; H = hero.clientHeight;
      heroCanvas.width = W * dpr; heroCanvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Smooth pseudo-noise from layered sines (cheap, deterministic, no deps)
    const field = (x, k, time) =>
      Math.sin(x * .0021 + time * .9 + k * .23) * .55 +
      Math.sin(x * .0047 - time * .6 + k * .41) * .3 +
      Math.sin(x * .0009 + time * .35 + k * .07) * .8;

    const draw = () => {
      // lines flow faster while the page is moving, then settle
      if (!reduceMotion) t += .0045 + Math.min(Math.abs(window.ssbFlow?.velocity || 0) * .0009, .02);
      pointer.x += (target.x - pointer.x) * .04;
      pointer.y += (target.y - pointer.y) * .04;
      ctx.clearRect(0, 0, W, H);

      // on arrival the lines start folded tight around the mark, then unfold
      const u = reduceMotion ? 1 : Math.min((performance.now() - born) / 2200, 1);
      const unfold = .06 + .94 * (1 - Math.pow(1 - u, 4));
      const spread = H * .62 * unfold, top = H * .5 - spread / 2 + H * .12 * unfold - H * .2 * (1 - unfold);
      const px = pointer.x * W, py = pointer.y * H;
      const amp = Math.max(28, H * .07);

      for (let k = 0; k < LINES; k++) {
        const f = k / (LINES - 1);
        const base = top + f * spread;
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        const a = .05 + Math.sin(f * Math.PI) * .22;
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(.35, `rgba(248,113,113,${a * .6})`);
        grad.addColorStop(.7, `rgba(239,68,68,${a})`);
        grad.addColorStop(1, `rgba(255,255,255,${a * .5})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = k % 6 === 0 ? 1.2 : .8;
        ctx.beginPath();
        for (let x = -STEP; x <= W + STEP; x += STEP) {
          // amplitude grows left → right so the headline area stays calm
          const ramp = Math.pow(clamp(x / W, 0, 1), 1.4);
          let y = base + field(x, k, t) * amp * (.25 + ramp);
          // soft lens: lines part gently around the pointer
          const dx = x - px, dy = y - py, d2 = dx * dx + dy * dy;
          y += dy * .55 * Math.exp(-d2 / 30000);
          x === -STEP ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      if (running && !reduceMotion) requestAnimationFrame(draw);
    };

    size(); draw();
    let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { size(); if (reduceMotion) draw(); }, 150); });

    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width;
      target.y = (e.clientY - r.top) / r.height;
    });
    hero.addEventListener("pointerleave", () => { target.x = .7; target.y = .5; });

    new IntersectionObserver(([e]) => {
      const was = running; running = e.isIntersecting;
      if (running && !was && !reduceMotion) requestAnimationFrame(draw);
    }).observe(hero);
  }

  /* ---------- Marquee: duplicate for seamless loop ---------- */
  const track = $(".marquee__track");
  if (track && !reduceMotion) {
    [...track.children].forEach((n) => { const c = n.cloneNode(true); c.alt = ""; c.setAttribute("aria-hidden", "true"); track.append(c); });
  }

  /* ---------- Reveal on scroll + counters ---------- */
  const formatNum = (n) => n.toLocaleString("en-US");
  const runCounter = (el) => {
    const target = +el.dataset.count, pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = pre + formatNum(target) + suf; return; }
    const dur = 1800, start = performance.now();
    const tick = (now) => {
      const p = clamp((now - start) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = pre + formatNum(Math.round(target * e)) + suf;
      if (p < 1) requestAnimationFrame(tick);
      else el.classList.add("settled");
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      $$("[data-count]", e.target).forEach(runCounter);
      if (e.target.matches("[data-count]")) runCounter(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: .15, rootMargin: "0px 0px -8% 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- Nav: scrolled state, hide on scroll down, progress ---------- */
  const nav = $("#nav");
  const heroLogo = $(".hero__logo");
  const progress = $(".scroll-progress");
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle("is-scrolled", y > 40);
    // the big hero logo is on screen: keep the nav logo out of the way until it scrolls off
    nav.classList.toggle("at-hero", !!heroLogo && heroLogo.getBoundingClientRect().bottom > 70);
    lastY = y;
    updateProcess();
    ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ---------- Nav: hover pill glides between links; a dot marks the current section ---------- */
  const links = $$(".nav__links a");
  const indicator = $(".nav__indicator");
  const dot = document.createElement("span");
  dot.className = "nav__dot";
  dot.setAttribute("aria-hidden", "true");
  indicator.after(dot);
  let pillShown = false;
  const showPill = (a) => {
    if (!pillShown) {
      // appear in place rather than sliding in from the last position
      indicator.style.transition = "none";
      indicator.style.width = a.offsetWidth + "px";
      indicator.style.transform = `translateX(${a.offsetLeft}px)`;
      void indicator.offsetWidth;
      indicator.style.transition = "";
    }
    indicator.style.width = a.offsetWidth + "px";
    indicator.style.transform = `translateX(${a.offsetLeft}px)`;
    indicator.style.opacity = 1;
    pillShown = true;
  };
  const hidePill = () => { indicator.style.opacity = 0; pillShown = false; };
  const placeDot = (a) => {
    if (!a) { dot.style.opacity = 0; return; }
    dot.style.opacity = 1;
    dot.style.transform = `translateX(${a.offsetLeft + a.offsetWidth / 2 - 2}px)`;
  };
  let current = null;
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      current = links.find((a) => a.getAttribute("href") === "#" + e.target.id) || null;
      links.forEach((a) => a.classList.toggle("is-active", a === current));
      placeDot(current);
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => sectionIO.observe(s));
  links.forEach((a) => a.addEventListener("mouseenter", () => showPill(a)));
  $(".nav__links").addEventListener("mouseleave", hidePill);
  addEventListener("resize", () => placeDot(current));

  /* ---------- Mobile menu ---------- */
  const toggle = $(".nav__toggle");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  $$(".nav__mobile a").forEach((a) => a.addEventListener("click", () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }));

  /* ---------- Services tabs ---------- */
  const tabs = $$(".services__tab");
  const bar = $(".services__bar");
  const placeBar = () => {
    const a = tabs.find((t) => t.classList.contains("is-active"));
    if (!a) return;
    bar.style.width = a.offsetWidth + "px";
    bar.style.height = a.offsetHeight + "px";
    bar.style.transform = `translate(${a.offsetLeft}px, ${a.offsetTop}px)`;
  };
  const panelsWrap = $(".services__panels");
  const activate = (tab, focus) => {
    const from = panelsWrap?.offsetHeight;
    tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      const panel = $("#" + t.getAttribute("aria-controls"));
      panel.hidden = !on;
      panel.classList.toggle("is-active", on);
    });
    if (focus) tab.focus();
    placeBar();
    // glide between panel heights instead of jumping
    const to = panelsWrap?.offsetHeight;
    if (from && to && from !== to && !reduceMotion) {
      panelsWrap.animate([{ height: from + "px" }, { height: to + "px" }], { duration: 450, easing: "cubic-bezier(.2,.7,.2,1)" });
    }
  };
  tabs.forEach((t, i) => {
    t.tabIndex = t.classList.contains("is-active") ? 0 : -1;
    t.addEventListener("click", () => activate(t));
    t.addEventListener("keydown", (e) => {
      const k = e.key;
      if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(k)) return;
      e.preventDefault();
      const d = k === "ArrowDown" || k === "ArrowRight" ? 1 : -1;
      activate(tabs[(i + d + tabs.length) % tabs.length], true);
    });
  });
  activate(tabs.find((t) => t.classList.contains("is-active")) || tabs[0]);
  addEventListener("resize", placeBar);
  document.fonts?.ready.then(placeBar);

  /* ---------- Process line draws with scroll ---------- */
  const process = $(".process");
  const steps = $$(".step");
  function updateProcess() {
    if (!process) return;
    const r = process.getBoundingClientRect();
    const p = clamp((innerHeight * .75 - r.top) / (r.height * .9), 0, 1);
    process.style.setProperty("--p", p.toFixed(3));
    steps.forEach((s, i) => s.classList.toggle("is-lit", p >= i / (steps.length - 1) - .02));
  }
  updateProcess();

  /* ---------- Testimonial slider ---------- */
  const slider = $(".slider");
  if (slider) {
    const slides = $$(".slide", slider);
    const dotsWrap = $(".slider__dots", slider);
    const DUR = 7000, SHIFT = 40;
    slider.style.setProperty("--dur", DUR + "ms");
    let idx = 0, timer = null, remaining = DUR, startedAt = 0;
    let hovering = false, visible = false;

    const dots = slides.map((_, i) => {
      const d = document.createElement("button");
      d.type = "button";
      d.className = "slider__dot";
      d.setAttribute("aria-label", `Show testimonial ${i + 1}`);
      d.innerHTML = "<i></i>";
      d.addEventListener("click", () => go(i, i > idx ? 1 : -1));
      dotsWrap.append(d);
      return d;
    });

    // Autoplay only while the slider is on screen and not hovered
    const canPlay = () => visible && !hovering && !reduceMotion && !document.hidden;
    const stop = () => { if (timer) { clearTimeout(timer); timer = null; remaining = Math.max(remaining - (Date.now() - startedAt), 300); } };
    const play = () => {
      clearTimeout(timer); timer = null;
      slider.classList.toggle("is-paused", !canPlay());
      if (!canPlay()) return;
      startedAt = Date.now();
      timer = setTimeout(() => { remaining = DUR; go(idx + 1, 1); }, remaining);
    };

    function go(n, dir = 1, instant = false) {
      const next = (n + slides.length) % slides.length;
      const prev = slides[idx], incoming = slides[next];
      if (next !== idx) {
        // place the incoming slide on the side it enters from, without animating
        incoming.style.transition = "none";
        incoming.style.transform = `translateX(${dir * SHIFT}px)`;
        void incoming.offsetWidth;
        incoming.style.transition = "";
        // send the outgoing slide the opposite way
        prev.style.transform = `translateX(${-dir * SHIFT}px)`;
        prev.classList.remove("is-active");
      }
      idx = next;
      incoming.style.transform = "";
      if (instant) incoming.style.transition = "none";
      incoming.classList.add("is-active");
      if (instant) { void incoming.offsetWidth; incoming.style.transition = ""; }
      slides.forEach((s, i) => s.setAttribute("aria-hidden", i !== idx));
      dots.forEach((d, i) => {
        d.classList.remove("is-active");
        d.setAttribute("aria-current", i === idx ? "true" : "false");
        if (i === idx) { void d.offsetWidth; d.classList.add("is-active"); }
      });
      remaining = DUR;
      play();
    }

    $$(".slider__btn", slider).forEach((b) => b.addEventListener("click", () => { const d = +b.dataset.dir; go(idx + d, d); }));
    slider.addEventListener("mouseenter", () => { hovering = true; stop(); slider.classList.add("is-paused"); });
    slider.addEventListener("mouseleave", () => { hovering = false; play(); });
    slider.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") go(idx + 1, 1);
      if (e.key === "ArrowLeft") go(idx - 1, -1);
    });
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : play()));
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) play(); else { stop(); slider.classList.add("is-paused"); }
    }, { threshold: .4 }).observe(slider);

    // swipe
    let sx = null;
    slider.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener("touchend", (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      sx = null;
    });

    slides.forEach((s) => s.classList.remove("is-active"));
    idx = 0;
    go(0, 1, true);
  }

  /* ---------- FAQ: animated accordion ---------- */
  $$(".faq details").forEach((d) => {
    const summary = $("summary", d), body = $(".faq__body", d);
    summary.addEventListener("click", (e) => {
      if (reduceMotion) return;
      e.preventDefault();
      if (d.open) {
        const h = body.offsetHeight;
        body.animate([{ height: h + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 320, easing: "cubic-bezier(.2,.7,.2,1)" })
          .onfinish = () => { d.open = false; };
      } else {
        // close siblings
        $$(".faq details[open]").forEach((o) => { if (o !== d) $("summary", o).click(); });
        d.open = true;
        const h = body.offsetHeight;
        body.animate([{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }], { duration: 380, easing: "cubic-bezier(.2,.7,.2,1)" });
      }
    });
  });

  /* ---------- Contact form ---------- */
  const form = $(".form");
  if (form) {
    const status = $(".form__status", form);
    const btn = $("button[type=submit]", form);
    // Set data-endpoint on the <form> to POST to a backend (e.g. Formspree, your API).
    // Without one, the form falls back to opening the visitor's email client.
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.textContent = ""; status.className = "form__status";
      let ok = true;
      $$(".field", form).forEach((f) => {
        const input = $("input, textarea", f);
        const bad = !input.checkValidity() || (input.required && !input.value.trim());
        f.classList.toggle("is-invalid", bad);
        if (bad) ok = false;
      });
      if (!ok) {
        status.textContent = "Please add a valid email and a short note about your project.";
        status.classList.add("err");
        $(".is-invalid input, .is-invalid textarea", form)?.focus();
        return;
      }
      const data = Object.fromEntries(new FormData(form));
      const endpoint = form.dataset.endpoint;
      const celebrate = (msg) => {
        btn.classList.add("is-done");
        $(".btn__label", btn).textContent = msg;
        window.ssbDelight?.burst(btn);
        setTimeout(() => { btn.classList.remove("is-done"); $(".btn__label", btn).textContent = "Send message"; }, 4000);
      };
      if (!endpoint) {
        const body = `${data.message}\n\nEmail: ${data.email}\nPhone: ${data.phone || "-"}`;
        celebrate("Opening your email…");
        setTimeout(() => {
          location.href = `mailto:contact@ssbsoft.com?subject=${encodeURIComponent("Project enquiry")}&body=${encodeURIComponent(body)}`;
        }, 650);
        return;
      }
      btn.classList.add("is-loading"); btn.disabled = true;
      try {
        const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
        if (!res.ok) throw new Error(res.status);
        form.reset();
        $$(".field", form).forEach((f) => f.classList.remove("is-valid"));
        celebrate("Message sent");
        status.textContent = "Got it — thank you. Someone from our team will get back to you shortly.";
        status.classList.add("ok");
      } catch {
        status.textContent = "Something went wrong. Please email contact@ssbsoft.com.";
        status.classList.add("err");
      } finally {
        btn.classList.remove("is-loading"); btn.disabled = false;
      }
    });
    $$(".field input, .field textarea", form).forEach((i) => i.addEventListener("input", () => i.parentElement.classList.remove("is-invalid")));
  }

  /* ---------- Theme: light / dark, remembered, with a circular reveal ---------- */
  const themeBtn = $(".theme");
  if (themeBtn) {
    const root = document.documentElement;
    const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    const label = () => themeBtn.setAttribute("aria-label", isDark() ? "Switch to light theme" : "Switch to dark theme");
    label();
    themeBtn.addEventListener("click", (e) => {
      const next = isDark() ? "light" : "dark";
      const apply = () => { root.dataset.theme = next; try { localStorage.setItem("theme", next); } catch {} label(); };
      if (!document.startViewTransition || reduceMotion) { apply(); return; }
      const r = Math.hypot(Math.max(e.clientX, innerWidth - e.clientX), Math.max(e.clientY, innerHeight - e.clientY));
      const vt = document.startViewTransition(apply);
      vt.finished.catch(() => {}); // aborted when the tab is hidden; the theme still applies
      vt.ready.then(() => {
        root.animate({ clipPath: [`circle(0 at ${e.clientX}px ${e.clientY}px)`, `circle(${r}px at ${e.clientX}px ${e.clientY}px)`] },
          { duration: 650, easing: "cubic-bezier(.6,0,.2,1)", pseudoElement: "::view-transition-new(root)" });
      }).catch(() => {});
    });
  }

  /* ---------- Mobile: booking button appears after the hero, steps aside at the form ---------- */
  const dock = $(".dock");
  if (dock) {
    const heroEl = $(".hero"), contactEl = $("#contact");
    let pastHero = false, atContact = false;
    const set = () => {
      const on = pastHero && !atContact;
      dock.classList.toggle("is-shown", on);
      dock.setAttribute("aria-hidden", !on);
      dock.tabIndex = on ? 0 : -1;
    };
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; set(); }).observe(heroEl);
    new IntersectionObserver(([e]) => { atContact = e.isIntersecting; set(); }, { threshold: .05 }).observe(contactEl);
  }

  /* ---------- Print: show everything ---------- */
  addEventListener("beforeprint", () => {
    $$(".faq details").forEach((d) => { d.dataset.wasOpen = d.open; d.open = true; });
    $$(".services__panel").forEach((p) => { p.hidden = false; });
  });
  addEventListener("afterprint", () => {
    $$(".faq details").forEach((d) => { d.open = d.dataset.wasOpen === "true"; });
    activate(tabs.find((t) => t.classList.contains("is-active")) || tabs[0]);
  });
})();
