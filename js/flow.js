/* ==========================================================
   SSB Soft — flow
   Makes the page feel continuous: momentum scrolling, motion
   that follows scroll position, and nothing that snaps.
   ========================================================== */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // shared with main.js (hero lines) — how fast the page is moving right now
  const flow = (window.ssbFlow = { velocity: 0, lenis: null });

  /* ---------- Momentum scrolling (wheel / trackpad; touch stays native) ---------- */
  if (!reduceMotion && window.Lenis) {
    const lenis = new Lenis({
      lerp: .09,
      wheelMultiplier: .9,
      autoRaf: true,
      anchors: { offset: -80, duration: 1.2 },
    });
    flow.lenis = lenis;
    lenis.on("scroll", (e) => { flow.velocity = e.velocity; });
    // keep the "skip to content" link and in-page focus working
    $(".skip")?.addEventListener("click", () => lenis.scrollTo("#main", { immediate: true }));
  } else {
    let last = scrollY, lastT = performance.now();
    addEventListener("scroll", () => {
      const now = performance.now();
      flow.velocity = (scrollY - last) / Math.max(now - lastT, 1) * 16;
      last = scrollY; lastT = now;
    }, { passive: true });
  }

  /* ---------- Logo strip: drifts on its own, speeds up with the scroll ---------- */
  const track = $(".marquee__track");
  if (track && !reduceMotion) {
    track.style.animation = "none";
    let x = 0, speed = .45, hover = false, prev = performance.now();
    track.parentElement.addEventListener("mouseenter", () => { hover = true; });
    track.parentElement.addEventListener("mouseleave", () => { hover = false; });
    const loop = (now) => {
      const dt = Math.min(now - prev, 50) / 16.67; prev = now;
      const target = hover ? .08 : .45 + Math.min(Math.abs(flow.velocity) * .35, 9);
      speed += (target - speed) * .08;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const half = (track.scrollWidth + gap) / 2;
      x = (x - speed * dt) % half;
      track.style.transform = `translate3d(${x}px,0,0)`;
      flow.velocity *= .92; // ease the shared value back down between scroll events
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ---------- Hero hands over to the page: content drifts up and softens ---------- */
  const hero = $(".hero"), heroContent = $(".hero__content"), heroScroll = $(".hero__scroll");
  if (hero && heroContent && !reduceMotion) {
    let ticking = false;
    const update = () => {
      const p = clamp(scrollY / (hero.offsetHeight * .85), 0, 1);
      heroContent.style.transform = `translate3d(0, ${p * 90}px, 0) scale(${1 - p * .05})`;
      heroContent.style.opacity = String(1 - Math.max(0, p - .2) * 1.3);
      if (heroScroll) heroScroll.style.opacity = String(1 - p * 4);
      ticking = false;
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- Images arrive softly instead of popping in ---------- */
  // One listener for every image, including ones added later (e.g. the logo strip's
  // duplicated set), so nothing can be left invisible.
  const markLoaded = (e) => { if (e.target.tagName === "IMG") e.target.classList.add("is-loaded"); };
  document.addEventListener("load", markLoaded, true);
  document.addEventListener("error", markLoaded, true);
  const sweep = () => $$("img[loading='lazy']").forEach((img) => { if (img.complete) img.classList.add("is-loaded"); });
  sweep();
  document.addEventListener("DOMContentLoaded", sweep);

  /* ---------- Text that flows like a breeze ----------
     Headings: words drift up and come into focus one after another.
     Paragraphs: words stay put and brighten as you read down the page.
     Both are tied to scroll position, so scrolling back rewinds them. */
  const HEADINGS = ".section__head h2, .about__text h2, .contact__form-wrap h2";
  const PARAGRAPHS = ".section__head .section__lede, .about__text > p:not(.kicker), .about__story > p, .note p, .contact__form-wrap > .section__lede";

  const splitWords = (el) => {
    const words = [];
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/( +)/).forEach((part) => {
            if (!part) return;
            if (/^ +$/.test(part)) { frag.append(part); return; }
            const w = document.createElement("span");
            w.className = "w";
            w.textContent = part;
            frag.append(w);
            words.push(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && !child.matches("svg, .w")) {
          walk(child);
        }
      });
    };
    walk(el);
    words.forEach((w, i) => w.style.setProperty("--p", (i / Math.max(words.length - 1, 1)).toFixed(3)));
    return words.length;
  };

  if (!reduceMotion) {
    $$(HEADINGS).forEach((el) => { el.classList.add("breeze", "breeze--head"); el.classList.remove("reveal"); splitWords(el); });
    $$(PARAGRAPHS).forEach((el) => { el.classList.add("breeze", "breeze--text"); el.classList.remove("reveal"); splitWords(el); });

    // browsers without scroll timelines: play the same motion once, when the text arrives
    if (!CSS.supports("animation-timeline: view()")) {
      const io = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      }), { rootMargin: "0px 0px -12% 0px" });
      $$(".breeze").forEach((el) => io.observe(el));
    }
  }
})();
