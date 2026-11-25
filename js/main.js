/* =========================================================
   Pandughar Group — motion layer
   GSAP 3.13 (ScrollTrigger, SplitText, DrawSVG) + Lenis
   ========================================================= */
(function () {
  // failsafe: if a CDN script didn't load, show the page without the intro
  if (!window.gsap || !window.ScrollTrigger || !window.SplitText || !window.DrawSVGPlugin || !window.Lenis) {
    document.body.classList.remove("is-loading");
    const pl = document.querySelector(".preloader");
    if (pl) pl.style.display = "none";
    const hc = document.querySelector(".hero__content");
    if (hc) hc.style.visibility = "visible";
    return;
  }
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const video = $(".hero__video");

  /* ---------- Smooth scroll ---------- */
  const lenis = new Lenis({ lerp: reduced ? 1 : 0.09, smoothWheel: !reduced });
  lenis.on("scroll", ScrollTrigger.update);
  // pins add scroll length when ScrollTrigger (re)measures; make Lenis re-measure the page too so its
  // scroll limit is never stale (a stale limit stopped the wheel partway down the page)
  ScrollTrigger.addEventListener("refresh", () => lenis.resize());
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window.scrollTo(0, 0);
  lenis.stop();
  // while the intro plays or the menu is open the page must not move; the paused Lenis blocks the
  // wheel, this blocks the scroll keys (the page isn't set to overflow:hidden, which would hide the
  // scrollbar and shift the layout sideways)
  addEventListener("keydown", (e) => {
    const b = document.body.classList;
    if ((b.contains("is-loading") || b.contains("menu-open")) && [" ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(e.key)
      && !e.target.closest("input, textarea, select")) e.preventDefault();
  });

  let autoScroll = false; // true while a menu/anchor link is gliding the page
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id === "#") return;
      e.preventDefault();
      closeMenu();
      autoScroll = true;
      lenis.start();
      lenis.scrollTo(id === "#top" ? 0 : id, { duration: 1.6, force: true, onComplete: () => (autoScroll = false) });
    })
  );

  // don't let a slow font download hold the intro hostage
  let started = false;
  const start = () => { if (!started) { started = true; init(); } };
  document.fonts.ready.then(start);
  setTimeout(start, 1800);

  /* ---------- clip-path helper ----------
     Browsers shorten inset() strings (e.g. "inset(0% 33% 0% 33%)" -> "inset(0% 33% 0%)"),
     which makes GSAP interpolate mismatched number lists and the mask can vanish mid-tween.
     So we tween plain numbers and write the full string ourselves. */
  const IN0 = { t: 0, r: 0, b: 0, l: 0, a: 0, c: 0 };
  function clipper(el, init, unit = "px") {
    const els = gsap.utils.toArray(el);
    const s = { ...IN0, ...init };
    const apply = () => {
      const v = `inset(${s.t}% ${s.r}% ${s.b}% ${s.l}% round ${s.a}${unit} ${s.a}${unit} ${s.c}${unit} ${s.c}${unit})`;
      els.forEach((e) => (e.style.clipPath = v));
    };
    apply();
    return { s, apply, to: (v) => ({ ...v, onUpdate: apply }) };
  }

  function init() {
    const intro = preloader();
    intro.add(heroIntro(), "-=1.1");
    if (reduced) intro.timeScale(4);

    // pinned sections first, so later triggers account for pin spacing
    numbers();
    business();
    foundation();
    news();
    menu();
    labels();
    titles();
    awards();
    contact();
    footer();
    lang();
    magnetic();
    clock();
    nav();
    toTop();
    footerGrid();
    ScrollTrigger.refresh();
  }

  /* =========================================================
     PRELOADER — frame, drawn rings, sail, logo wipe,
     growing line, then the hero video rises through an arch
     ========================================================= */
  // round window in the middle of the screen; k = 0 (a point) .. 1 (full circle)
  function circ(k) {
    const W = innerWidth, H = innerHeight;
    const D = Math.min(W * (W < 700 ? 0.62 : 0.34), H * 0.72) * k;
    const t = ((H - D) / 2 / H) * 100, l = ((W - D) / 2 / W) * 100;
    return { t, b: t, l, r: l, a: 1000, c: 1000 };
  }
  let heroClip;

  function preloader() {

    const logoClip = clipper(".pl__logo", { r: 100 });
    heroClip = clipper(".hero__media", circ(0));
    const media = $(".hero__media"), iris = { r: 0 };
    const drawIris = () => { media.style.clipPath = `circle(${(iris.r * Math.hypot(innerWidth, innerHeight)) / 2 + (iris.r > 0 ? 2 : 0)}px at 50% 50%)`; };

    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from(".pl__frame", { scale: 1.05, autoAlpha: 0, duration: 1.4 })
      .from(".pl__ornament", { rotate: -50, scale: 0.75, autoAlpha: 0, duration: 2.6, ease: "power3.out" }, 0)
      .to(".pl__ornament", { autoAlpha: 0, duration: 1.4, ease: "power2.inOut" }, 1.6) // rings fade out once the mark is in
      .from(".pl__ring", { scale: 0.6, rotate: -60, autoAlpha: 0, duration: 1.4, ease: "expo.out" }, 0.2)
      .from(".pl__sail", { scale: 0, rotate: -70, duration: 1.3, ease: "back.out(1.7)" }, 1.0)
      .to(logoClip.s, logoClip.to({ r: 0, duration: 1.6, ease: "expo.inOut" }), 0.7)
      .from(".pl__logo img", { xPercent: -6, filter: "blur(10px)", duration: 1.8 }, 0.7)
      .to({}, { duration: 0.1 }, 2.6) // minimum intro length before the exit
      // hold here until the hero video has a frame to show (max 2.5s)
      .call(() => {
        if (video.readyState >= 2) return;
        tl.pause();
        let done = false;
        const go = () => { if (!done) { done = true; tl.resume(); } };
        video.addEventListener("loadeddata", go, { once: true });
        setTimeout(go, 2500);
      })
      // exit
      .to([".pl__mark", ".pl__logo"], { y: -50, autoAlpha: 0, stagger: 0.05, duration: 0.9, ease: "expo.in" }, "+=0.1")
      // one continuous iris: a circle grows from the centre straight past the corners (no hold)
      // fast start, long soft glide; it overshoots the corners so the slow tail happens off-screen
      .to(iris, { r: 1.3, duration: 2.0, ease: "power2.out", onUpdate: drawIris }, "-=0.35")
      .fromTo(".hero__video", { scale: 1.4 }, { scale: 1, duration: 2.4, ease: "power3.out" }, "<")
      .to(".pl__frame, .pl__ornament", { autoAlpha: 0, duration: 0.5 }, "<0.7")
      .set(".preloader", { display: "none" })
      .call(() => {
        document.body.classList.remove("is-loading");
        Object.assign(heroClip.s, IN0);
        heroClip.apply();
        lenis.start();
        heroScroll();
        ScrollTrigger.refresh();
      });

    return tl;
  }

  /* ---------- Hero ---------- */
  function heroIntro() {
    heroLight();
    const SWEEP = [".hero__title em", ".hero__btn:not(.hero__btn--ghost)"]; // the light passes over both
    let heroSweep = null;
    const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.5 } });
    tl.set(".hero__content", { autoAlpha: 1 });
    // each line is wiped in from the left (full inset strings written by hand, see clipper), then a
    // beam of light sweeps "Bangladesh" and the gold button
    $$(".hero__title .line > span").forEach((el, i) => {
      const o = { r: 100 }, set = () => (el.style.clipPath = `inset(0% ${o.r}% 0% 0%)`);
      set();
      tl.to(o, { r: 0, duration: 1.2, ease: "power4.inOut", onUpdate: set, onComplete: () => (el.style.clipPath = "") }, 0.1 + i * 0.22);
    });
    tl.fromTo(SWEEP, { "--sweep": "120%" }, { "--sweep": "-20%", duration: 1.6, ease: "power2.inOut" }, 0.9)
      .from(".hero__lead", { autoAlpha: 0, y: 20, filter: "blur(8px)", duration: 1.4, clearProps: "filter" }, 0.9)
      .from(".hero__btn", { autoAlpha: 0, y: 16, stagger: 0.08, duration: 1.2 }, 1)
      .from(".hero__rays", { autoAlpha: 0, duration: 2.4, ease: "power2.out" }, 0)
      .from(".nav", { yPercent: -100, autoAlpha: 0, duration: 1.2 }, 0.3)
      // then the light passes again every few seconds (paused off screen by ScrollTrigger below)
      .add(() => { if (!reduced) heroSweep = gsap.fromTo(SWEEP, { "--sweep": "120%" }, { "--sweep": "-20%", duration: 2.2, ease: "power2.inOut", repeat: -1, repeatDelay: 4.5, delay: 3 }); });
    ScrollTrigger.create({ trigger: ".hero", start: "top bottom", end: "bottom top", onToggle: (s) => heroSweep && heroSweep.paused(!s.isActive) });
    return tl;
  }

  /* golden light kit: beams breathe and sway, dust drifts upward inside the light */
  function heroLight() {
    if (reduced) return;
    $$(".hero__rays i").forEach((b, k) => {
      const ang = 18 + k * 7 + gsap.utils.random(-3, 3);
      gsap.set(b, { width: gsap.utils.random(60, 180), rotation: ang, opacity: gsap.utils.random(0.35, 0.8) });
      gsap.to(b, { opacity: gsap.utils.random(0.15, 0.45), duration: gsap.utils.random(3, 6), ease: "sine.inOut", repeat: -1, yoyo: true, delay: k * 0.6 });
      gsap.to(b, { rotation: ang + gsap.utils.random(-4, 4), duration: gsap.utils.random(8, 14), ease: "sine.inOut", repeat: -1, yoyo: true });
    });
    gsap.to(".hero__rays", { rotation: 2.5, duration: 12, ease: "sine.inOut", repeat: -1, yoyo: true });
    const hero = $(".hero"), cv = $(".hero__dust"), ctx = cv.getContext("2d");
    let W, H;
    const size = () => { const d = Math.min(devicePixelRatio || 1, 1.5); W = hero.clientWidth; H = hero.clientHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    size(); addEventListener("resize", size);
    const P = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.8, vx: (Math.random() - 0.5) * 0.00012, vy: -0.00004 - Math.random() * 0.00012, a: Math.random() * 6.28, s: 0.4 + Math.random() * 0.6 }));
    gsap.ticker.add(() => {
      const r = hero.getBoundingClientRect(); if (r.bottom < 0) return; // off screen
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#ffdca0";
      for (const p of P) {
        p.x += p.vx; p.y += p.vy; p.a += 0.01;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        const light = Math.max(0, 1 - Math.hypot(p.x - 0.82, p.y - 0.1) * 1.1); // brighter near the light source
        ctx.globalAlpha = (0.15 + light * 0.75) * p.s;
        ctx.beginPath(); ctx.arc((p.x + Math.sin(p.a) * 0.004) * W, p.y * H, p.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
  }

  function heroScroll() {
    if (reduced) return;
    gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } })
      .fromTo(heroClip.s, { ...IN0 }, heroClip.to({ t: 5, r: 3, b: 6, l: 3, a: 32, c: 32, ease: "none" }), 0)
      .fromTo(".hero__video", { scale: 1 }, { scale: 1.18, ease: "none" }, 0)
      .fromTo(".hero__content", { yPercent: 0, autoAlpha: 1 }, { yPercent: -18, autoAlpha: 0, ease: "none" }, 0);

    ScrollTrigger.create({
      trigger: ".hero", start: "top top", end: "bottom top",
      onLeave: () => video.pause(),
      onEnterBack: () => video.play().catch(() => {}),
    });
  }

  /* ---------- Nav: theme swap, hide on scroll down, active link ---------- */
  function nav() {
    const navEl = $(".nav");
    // theme = whichever section is under the nav bar (robust with pinned sections)
    const themed = $$("main [data-theme], footer[data-theme]");
    const probe = () => {
      const y = navEl.offsetHeight / 2;
      for (const sec of themed) {
        const r = sec.getBoundingClientRect();
        if (r.top <= y && r.bottom > y) {
          if (navEl.dataset.theme !== sec.dataset.theme) navEl.dataset.theme = sec.dataset.theme;
          return;
        }
      }
    };
    probe();
    // only when the page actually moves (it measured every section on every frame before)
    lenis.on("scroll", probe);
    addEventListener("scroll", probe, { passive: true });
    ScrollTrigger.addEventListener("refresh", probe);
    lenis.on("scroll", ({ scroll, direction }) => {
      const open = document.body.classList.contains("menu-open") || navEl.classList.contains("drop-open");
      navEl.classList.toggle("is-hidden", !open && direction === 1 && scroll > innerHeight * 0.9);
    });
    navDrop(navEl);
  }

  /* desktop "Drawer": hovering a section drops a full-width green sheet under the bar.
     Left: the sections (hover to switch). Middle: that section's links. Right: its photo, summary and contact. */
  function navDrop(navEl) {
    const dr = $(".nav__drawer", navEl), btns = $$(".nav__item.has", navEl);
    const ps = $$(".nav__ps button", dr), panes = $$(".nav__pane", dr);
    let cur = -1, isOpen = false, closeT;
    dr.inert = true; // not focusable while closed

    // one photo per section (data-img on .nav__pane), in the card above the summary. Two stacked
    // layers cross-fade; the next photo is decoded first so it never flashes in half-loaded.
    const layers = $$(".nav__shot img", dr);
    let front = 0, curSrc = "", preloaded = false;
    const preload = () => {
      if (preloaded) return; preloaded = true;
      panes.forEach((p) => { const im = new Image(); im.decoding = "async"; im.src = p.dataset.img; });
    };
    function setImg(src) {
      if (!src || src === curSrc) return;
      curSrc = src;
      const next = layers[1 - front], prev = layers[front];
      front = 1 - front;
      next.src = src;
      (next.decode ? next.decode().catch(() => {}) : Promise.resolve()).then(() => {
        if (src !== curSrc) return; // a newer photo was asked for meanwhile
        gsap.set(next, { zIndex: 2 }); gsap.set(prev, { zIndex: 1 });
        gsap.fromTo(next, { autoAlpha: 0, scale: 1.06 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "power2.out", overwrite: true });
        gsap.to(prev, { autoAlpha: 0, duration: 0.6, ease: "power2.out", overwrite: true });
      });
    }

    function show(i) {
      if (i === cur) return;
      cur = i;
      setImg(panes[i].dataset.img);
      btns.forEach((b, k) => { b.classList.toggle("open", k === i); b.setAttribute("aria-expanded", k === i); });
      ps.forEach((b, k) => b.classList.toggle("on", k === i));
      panes.forEach((p, k) => p.classList.toggle("on", k === i));
      gsap.fromTo($$("a, h6", panes[i]), { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.025, duration: 0.5, ease: "expo.out", overwrite: true });
    }
    function open(i) {
      clearTimeout(closeT);
      preload();
      show(i);
      if (isOpen) return;
      isOpen = true;
      navEl.classList.add("drop-open");
      dr.inert = false;
      gsap.killTweensOf(dr);
      dr.style.visibility = "visible";
      gsap.fromTo(dr, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "expo.out" });
      gsap.fromTo(ps, { x: -20, autoAlpha: 0 }, { x: 0, autoAlpha: 1, stagger: 0.04, duration: 0.6, ease: "expo.out" });
    }
    function close() {
      if (!isOpen) return;
      isOpen = false; cur = -1;
      dr.inert = true;
      btns.forEach((b) => { b.classList.remove("open"); b.setAttribute("aria-expanded", "false"); });
      gsap.killTweensOf(dr);
      gsap.to(dr, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.45, ease: "power3.in",
        onComplete: () => { if (!isOpen) { dr.style.visibility = "hidden"; navEl.classList.remove("drop-open"); } } });
    }
    const later = () => { clearTimeout(closeT); closeT = setTimeout(close, 180); };
    btns.forEach((b) => {
      b.addEventListener("pointerenter", (e) => e.pointerType !== "touch" && open(+b.dataset.i));
      b.addEventListener("click", () => (isOpen && cur === +b.dataset.i ? close() : open(+b.dataset.i)));
    });
    ps.forEach((b) => { const go = () => show(+b.dataset.i); b.addEventListener("pointerenter", go); b.addEventListener("focus", go); b.addEventListener("click", go); });
    $$(".nav__item:not(.has)", navEl).forEach((n) => n.addEventListener("pointerenter", later));
    navEl.addEventListener("pointerleave", later);
    navEl.addEventListener("pointerenter", () => isOpen && clearTimeout(closeT));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen) { const b = btns[cur]; close(); b && b.focus(); } });
    document.addEventListener("click", (e) => { if (isOpen && !navEl.contains(e.target)) close(); });
    lenis.on("scroll", () => isOpen && close());
  }

  /* ---------- Mobile menu (arch wipe) ---------- */
  let menuTl;
  function menu() {
    const burger = $(".nav__burger");
    const mc = clipper(".menu", { t: 100, a: 50 }, "%");
    menuTl = gsap.timeline({ paused: true, defaults: { ease: "expo.inOut" } })
      .set(".menu", { visibility: "visible" })
      .to(mc.s, mc.to({ t: 0, a: 0, duration: 1.1 }))
      .from(".macc, .macc__solo", { y: 40, autoAlpha: 0, stagger: 0.06, duration: 1, ease: "expo.out" }, 0.45)
      .from(".menu__foot", { autoAlpha: 0, y: 20, duration: 0.8, ease: "expo.out" }, 0.7);
    burger.addEventListener("click", () => (document.body.classList.contains("menu-open") ? closeMenu() : openMenu()));
    // accordion: one section open at a time
    const accs = $$(".macc");
    accs.forEach((acc) => {
      const btn = $(".macc__btn", acc), list = $(".macc__list", acc);
      btn.addEventListener("click", () => {
        const opening = btn.getAttribute("aria-expanded") !== "true";
        accs.forEach((o) => { if (o !== acc && $(".macc__btn", o).getAttribute("aria-expanded") === "true") { $(".macc__btn", o).setAttribute("aria-expanded", "false"); gsap.to($(".macc__list", o), { height: 0, duration: 0.5, ease: "expo.out" }); } });
        btn.setAttribute("aria-expanded", opening);
        gsap.to(list, { height: opening ? "auto" : 0, duration: 0.6, ease: "expo.out" });
      });
    });
    $$(".macc__list a, .macc__solo").forEach((a) => a.addEventListener("click", () => setTimeout(closeMenu, 50)));
  }
  function openMenu() {
    document.body.classList.add("menu-open");
    $(".nav__burger").setAttribute("aria-expanded", "true");
    $(".menu").setAttribute("aria-hidden", "false");
    lenis.stop();
    menuTl.timeScale(1).play();
  }
  function closeMenu() {
    if (!document.body.classList.contains("menu-open")) return;
    document.body.classList.remove("menu-open");
    $(".nav__burger").setAttribute("aria-expanded", "false");
    $(".menu").setAttribute("aria-hidden", "true");
    lenis.start();
    menuTl.timeScale(1.6).reverse();
  }

  /* ---------- Shared reveals ---------- */
  function labels() {
    $$(".label").forEach((el) => {
      if (el.closest(".bloader")) return;
      gsap.timeline({ scrollTrigger: { trigger: el, start: "top 88%" } })
        .fromTo(el, { "--bar": 0 }, { "--bar": 1, duration: 1.2, ease: "expo.inOut" })
        .from(el, { autoAlpha: 0, x: -16, duration: 1, ease: "expo.out" }, 0);
    });
  }

  function titles() {
    $$(".split-title").forEach((el) => {
      const s = SplitText.create(el, { type: "lines", mask: "lines" });
      gsap.from(s.lines, {
        yPercent: 110, stagger: 0.1, duration: 1.4, ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    });
  }

  /* ---------- 2. Numbers ---------- */
  function numbers() {
    const words = SplitText.create(".reveal-words", { type: "words", wordsClass: "w" });
    gsap.to(words.words, {
      opacity: 1, stagger: 0.1, ease: "none",
      scrollTrigger: { trigger: ".numbers__statement", start: "top 82%", end: "bottom 45%", scrub: true },
    });

    const origin = SplitText.create(".numbers__origin", { type: "lines", mask: "lines" });
    gsap.from(origin.lines, {
      yPercent: 100, stagger: 0.06, duration: 1.2, ease: "expo.out",
      onComplete: () => origin.revert(),
      scrollTrigger: { trigger: ".numbers__origin", start: "top 85%" },
    });

    gsap.from(".numbers__ornament .draw", {
      drawSVG: "0%", stagger: 0.12, ease: "none",
      scrollTrigger: { trigger: ".numbers", start: "top 85%", end: "center 40%", scrub: 1 },
    });
    gsap.to(".numbers__ornament", {
      rotate: 60, ease: "none",
      scrollTrigger: { trigger: ".numbers", start: "top bottom", end: "bottom top", scrub: true },
    });

    crowd();
  }

  /* ---------- 2b. The crowd: thousands of dots (the people of Pandughar)
     form a heart, a house, a shirt, an ice-lolly and a globe as you scroll ---------- */
  function crowd() {
    const sec = $(".crowd"), cv = $(".crowd__canvas"), ctx = cv.getContext("2d");
    const fmt = (v) => Math.round(v).toLocaleString("en-US");
    const STATS = [
      { shape: "heart", pre: "A strong family of", n: 18500, sup: "+", cap: "employees", c: "#006c32" },
      { shape: "house", pre: "Every year we support", n: 5000, cap: "families through CSR activities", c: "#ed1c24" },
      { shape: "shirt", pre: "We produce", n: 72, small: "million", cap: "garments every year", c: "#12a0a8" },
      { shape: "brands", pre: "Home to", n: 2, cap: "of the most loved brands of Bangladesh: Polar & Dan Cake", c: "#d99a0b" },
      { shape: "globe", pre: "Exporting to", n: 35, cap: "countries around the world", c: "#e5245b" },
    ];
    const N = innerWidth < 700 ? 1400 : 2800;
    const pal = ["#006c32", "#ed1c24", "#f5b82e", "#12a0a8", "#e5245b", "#3dae49", "#0e1a13"];
    const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.fill(); };
    const knock = (c, txt, x, y, font) => { // cut a word out of the filled shape
      c.globalCompositeOperation = "destination-out"; c.font = font; c.textAlign = "center"; c.textBaseline = "middle";
      c.lineWidth = 10; c.lineJoin = "round"; c.strokeText(txt, x, y); c.fillText(txt, x, y); // padded gap
      c.globalCompositeOperation = "source-over";
    };
    // each shape: [canvas width, canvas height, paint]
    const draw = {
      heart: [200, 200, (c) => { c.beginPath(); c.moveTo(100, 182); c.bezierCurveTo(8, 120, 0, 52, 52, 34); c.bezierCurveTo(82, 26, 100, 48, 100, 62); c.bezierCurveTo(100, 48, 118, 26, 148, 34); c.bezierCurveTo(200, 52, 192, 120, 100, 182); c.fill(); }],
      house: [200, 200, (c) => {
        c.beginPath(); c.moveTo(100, 18); c.lineTo(188, 96); c.lineTo(166, 96); c.lineTo(166, 182); c.lineTo(34, 182); c.lineTo(34, 96); c.lineTo(12, 96); c.closePath(); c.fill();
        c.globalCompositeOperation = "destination-out"; c.fillRect(84, 124, 32, 58); c.fillRect(50, 108, 22, 22); c.fillRect(128, 108, 22, 22); c.globalCompositeOperation = "source-over";
      }],
      shirt: [200, 200, (c) => {
        const p = [[62, 24], [84, 18], [100, 34], [116, 18], [138, 24], [188, 62], [166, 96], [146, 84], [146, 184], [54, 184], [54, 84], [34, 96], [12, 62]];
        c.beginPath(); p.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill();
      }],
      // Polar ice lolly + Dan Cake cake, each with its name cut out of the middle
      brands: [440, 220, (c) => {
        rr(c, 20, 6, 164, 172, 70);            // lolly
        rr(c, 86, 172, 32, 44, 16);            // stick
        knock(c, "Polar", 102, 96, "italic 800 44px Sora, sans-serif");
        rr(c, 214, 116, 218, 96, 16);          // cake base tier
        rr(c, 252, 58, 142, 64, 14);           // top tier
        c.beginPath(); c.arc(323, 36, 17, 0, Math.PI * 2); c.fill(); // cherry
        knock(c, "Dan Cake", 323, 166, "800 34px Sora, sans-serif");
      }],
      globe: [200, 200, (c) => {
        c.lineWidth = 11; const st = (f) => { c.beginPath(); f(); c.stroke(); };
        st(() => c.arc(100, 100, 84, 0, Math.PI * 2));
        st(() => c.ellipse(100, 100, 38, 84, 0, 0, Math.PI * 2));
        st(() => { c.moveTo(16, 100); c.lineTo(184, 100); });
        st(() => c.ellipse(100, 100, 84, 30, 0, 0, Math.PI * 2));
      }],
    };
    const sample = (shape) => {
      const [w, h, paint] = draw[shape];
      const oc = document.createElement("canvas"); oc.width = w; oc.height = h;
      const c = oc.getContext("2d", { willReadFrequently: true }); c.fillStyle = c.strokeStyle = "#000"; paint(c);
      const d = c.getImageData(0, 0, w, h).data, pts = [];
      for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (d[(y * w + x) * 4 + 3] > 128) pts.push([x / w, y / h]);
      gsap.utils.shuffle(pts);
      return { a: w / h, pts: Array.from({ length: N }, (_, i) => pts[i % pts.length]) };
    };
    const shapes = STATS.map((s) => sample(s.shape));
    // the brand names are cut out with Sora: resample once that weight is surely loaded
    document.fonts.load("italic 800 44px Sora").then(() => {
      const i = STATS.findIndex((s) => s.shape === "brands");
      shapes[i] = sample("brands");
      if (cur === i) { cur = -1; setShape(i); }
    }).catch(() => {});

    // canvas pixels are only allocated while the section is on screen (saves GPU memory,
    // avoids the browser blanking the canvas on hi-dpi screens)
    let W, H, sized = false, small = false, layout = { x: 0, gap: 0, s: 0, maxW: 0 };
    const allocate = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sized = true;
    };
    const release = () => { if (sized) { cv.width = cv.height = 1; sized = false; } };
    cv.addEventListener("contextlost", () => (sized = false));
    cv.addEventListener("contextrestored", () => (sized = false));
    // close-knit: text column + shape form one centred group
    const resize = () => {
      W = sec.clientWidth; H = sec.clientHeight;
      sized = false;
      small = W < 760;
      if (small) { sec.style.removeProperty("--tx"); sec.style.removeProperty("--tw"); return; }
      const tw = Math.min(520, W * 0.38), s = Math.min(H * 0.64, W * 0.36), gap = Math.max(16, W * 0.02);
      const x0 = Math.max(32, (W - (tw + gap + s)) / 2);
      sec.style.setProperty("--tx", x0 + "px");
      sec.style.setProperty("--tw", tw + "px");
      layout = { x: x0 + tw + gap, s, maxW: W - (x0 + tw + gap) - 24 };
    };
    // where the current shape sits (wide shapes like the brands grow to the right)
    const boxFor = (a) => {
      if (small) {
        const r = { x: W * 0.07, y: H * 0.08, w: W * 0.86, h: H * 0.46 };
        let w = r.w, h = w / a; if (h > r.h) { h = r.h; w = h * a; }
        return { x: r.x + (r.w - w) / 2, y: r.y + (r.h - h) / 2, w, h };
      }
      let h = layout.s, w = h * a;
      if (w > layout.maxW) { w = layout.maxW; h = w / a; }
      return { x: layout.x, y: (H - h) / 2, w, h };
    };
    resize();
    addEventListener("resize", resize);

    // cursor: the crowd steps aside and closes back in
    const m = { x: -9999, y: -9999 };
    if (finePointer && !reduced) {
      sec.addEventListener("pointermove", (e) => { const b = cv.getBoundingClientRect(); m.x = e.clientX - b.left; m.y = e.clientY - b.top; });
      sec.addEventListener("pointerleave", () => { m.x = m.y = -9999; });
    }
    const P = Array.from({ length: N }, () => ({
      x: Math.random() * W, y: Math.random() * H, tx: 0.5, ty: 0.5, j: Math.random() * 6.28,
      r: 1 + Math.random() * 1.7, c: (Math.random() * pal.length) | 0,
    }));

    const pre = $(".crowd__pre"), num = $(".crowd__num"), cap = $(".crowd__cap");
    const cnt = { v: 0 };
    let cur = -1;
    function setShape(i) {
      if (i === cur) return;
      cur = i;
      const pts = shapes[i].pts;
      P.forEach((p, k) => {
        p.tx = pts[k][0] + (Math.random() - 0.5) * 0.004;
        p.ty = pts[k][1] + (Math.random() - 0.5) * 0.004;
        if (!reduced) { p.x += (Math.random() - 0.5) * 110; p.y += (Math.random() - 0.5) * 110; } // burst
      });
      const s = STATS[i];
      gsap.killTweensOf([pre, num, cap, cnt]);
      gsap.timeline()
        .to([pre, num, cap], { y: -18, autoAlpha: 0, duration: 0.16, stagger: 0.025, ease: "power2.in" })
        .add(() => {
          pre.textContent = s.pre; cap.textContent = s.cap; num.style.color = s.c;
          cnt.v = 0;
          gsap.to(cnt, { v: s.n, duration: 1.1, ease: "power3.out",
            onUpdate: () => (num.innerHTML = fmt(cnt.v) + (s.sup || "") + (s.small ? `<small>${s.small}</small>` : "")) });
        })
        .fromTo([pre, num, cap], { y: 18 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.04, ease: "expo.out" });
    }

    const n = STATS.length;
    const pin = ScrollTrigger.create({
      trigger: sec, pin: true, start: "top top", end: "+=" + n * 85 + "%",
      onUpdate: (st) => {
        const p = st.progress * n;
        if (!locked) setShape(Math.min(n - 1, Math.floor(p * 0.9999))); // while locked, steps drive the shape
      },
      onEnter: () => lock(0),
      onEnterBack: () => lock(n - 1),
      onLeave: () => release2(),
      onLeaveBack: () => release2(),
    });
    // left by other means (scrollbar drag, menu link): hand scrolling back
    // (our own glides never leave the pinned range, so a leave while locked is always external)
    const release2 = () => { if (locked) { locked = false; busy = false; gsap.killTweensOf(sy); observer.disable(); lenis.start(); } };

    /* one scroll gesture = one number: while the section is pinned, wheel/swipe
       moves exactly one step (Lenis is paused so momentum can't skip numbers) */
    const stepY = (k) => pin.start + (pin.end - pin.start) * ((k + 0.5) / n);
    let step = 0, busy = false, locked = false;
    // glides are driven by GSAP on the native scroll position (Lenis is paused meanwhile)
    const sy = { y: 0 };
    const glide = (y) => {
      busy = true;
      sy.y = scrollY;
      gsap.killTweensOf(sy);
      // fast start, soft landing: the response feels immediate
      gsap.to(sy, { y, duration: reduced ? 0.3 : 0.8, ease: "power4.out",
        onUpdate: () => window.scrollTo(0, sy.y),
        onComplete: () => { busy = false; } });
    };
    function lock(k) {
      if (locked || autoScroll) return; // menu links glide straight through
      locked = true; step = k;
      lenis.stop();
      observer.enable();
      setShape(k);
      glide(stepY(k));
    }
    // leaving: hand the glide straight to Lenis, so the exit and any trackpad momentum that
    // follows are one continuous smooth scroll (a native-scroll tween here fought the
    // leftover wheel events and the page jumped when Lenis restarted)
    function unlock(y) {
      locked = false;
      busy = false;
      gsap.killTweensOf(sy);
      observer.disable();
      lenis.start();
      lenis.scrollTo(y, { duration: 1.1, easing: (x) => 1 - Math.pow(1 - x, 4), force: true });
    }
    let stepAt = 0;
    function go(dir) {
      if (!locked) return;
      const now = performance.now();
      if (now - stepAt < 280) return; // guard against double fire
      stepAt = now;
      const next = step + dir;
      if (next < 0) return unlock(pin.start - 4);                 // leave upwards
      if (next >= n) return unlock(pin.end + innerHeight * 0.35); // leave downwards
      step = next;
      setShape(step);       // the number changes the instant you scroll
      glide(stepY(step));   // the page catches up (retargets if already gliding)
    }
    // one gesture = one step: a wheel spin, trackpad fling or swipe is a burst of
    // events; only the first event after a short quiet gap starts a new step
    let lastEvt = 0;
    const onGesture = (self) => {
      const now = performance.now(), gap = now - lastEvt;
      lastEvt = now;
      if (gap < 140) return;
      const dir = Math.sign(self.deltaY) * (self.event.type === "wheel" ? 1 : -1);
      if (dir) go(dir);
    };
    const observer = ScrollTrigger.observe({
      target: window, type: "wheel,touch", wheelSpeed: 1, tolerance: 4, preventDefault: true,
      onChangeY: onGesture,
    });
    observer.disable();
    addEventListener("keydown", (e) => {
      if (!locked) return;
      if (["ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); go(1); }
      if (["ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); go(-1); }
    });

    let t = 0, nameA = 0;
    const ease = reduced ? 1 : 0.11;
    gsap.ticker.add(() => {
      const r = sec.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) { release(); return; } // off screen: free the canvas
      if (!sized) allocate();
      t += 0.016;
      ctx.clearRect(0, 0, W, H);
      const buckets = pal.map(() => []);
      const box = cur < 0 ? null : boxFor(shapes[cur].a);
      const R = 110;
      if (cur >= 0 && STATS[cur].shape !== "brands") nameA = 0;
      for (const p of P) {
        if (!box) { p.x += Math.sin(t + p.j) * 0.3; p.y += Math.cos(t * 0.8 + p.j) * 0.3; }
        else {
          const wob = reduced ? 0 : 1.2;
          const gx = box.x + p.tx * box.w + Math.sin(t * 1.3 + p.j) * wob;
          const gy = box.y + p.ty * box.h + Math.cos(t * 1.1 + p.j) * wob;
          p.x += (gx - p.x) * ease; p.y += (gy - p.y) * ease;
          const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy);
          if (d < R && d > 0.01) { const f = (R - d) / R; p.x += (dx / d) * f * 14; p.y += (dy / d) * f * 14; }
        }
        buckets[p.c].push(p);
      }
      buckets.forEach((b, k) => {
        ctx.fillStyle = pal[k]; ctx.beginPath();
        for (const p of b) { ctx.moveTo(p.x + p.r, p.y); ctx.arc(p.x, p.y, p.r, 0, 6.2832); }
        ctx.fill();
      });
      // brand names written in the empty space the dots leave inside the lolly and the cake
      const onBrands = box && STATS[cur].shape === "brands";
      nameA += ((onBrands ? 1 : 0) - nameA) * 0.06;
      if (onBrands && nameA > 0.02) {
        const k = box.w / 440;
        ctx.save();
        ctx.globalAlpha = nameA; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.font = `italic 800 ${44 * k}px Sora, sans-serif`; ctx.fillStyle = "#ed1c24";
        ctx.fillText("Polar", box.x + 102 * k, box.y + 96 * k);
        ctx.font = `800 ${34 * k}px Sora, sans-serif`; ctx.fillStyle = "#6b3b1f";
        ctx.fillText("Dan Cake", box.x + 323 * k, box.y + 166 * k);
        ctx.restore();
      }
    });
  }
  /* ---------- 3. Business: the teammate's 3D industries disc ----------
     assets/industries/assets.js   — models + Draco decoder as window.__ASSETS (~2.6 MB)
     assets/industries/industries.js — three.js app; mounts itself into #industries (~1.5 MB)
     Both load only when the section comes near, so the rest of the page stays light. */
  function business() {
    const stage = $("#industries");
    if (!stage) return;
    let started = false;
    const load = () => {
      if (started) return;
      started = true;
      const done = new MutationObserver(() => {
        if (!stage.querySelector("canvas")) return;
        done.disconnect();
        setTimeout(() => stage.classList.add("is-loaded"), 900); // give the models a moment to arrive
        ScrollTrigger.refresh();
      });
      done.observe(stage, { childList: true });
      const assets = document.createElement("script");
      assets.src = "assets/industries/assets.js";
      assets.onload = () => {
        const app = document.createElement("script");
        app.type = "module";
        app.src = "assets/industries/industries.js";
        document.body.append(app);
      };
      document.body.append(assets);
    };
    ScrollTrigger.create({ trigger: stage, start: "top bottom+=1400", once: true, onEnter: load });
    // the 3D app renders every frame; pause it whenever the disc is off screen (industries.js checks stage.__paused)
    stage.__paused = true;
    ScrollTrigger.create({
      trigger: stage, start: "top bottom", end: "bottom top",
      onToggle: (s) => (stage.__paused = !s.isActive),
      onRefresh: (s) => (stage.__paused = !s.isActive),
    });
    gsap.from(".business__copy", { y: 30, autoAlpha: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".business__top", start: "top 80%" } });
    // the bundled app mounts with its own camera; switch to the teammate's v3 framing (closer camera,
    // focused industry centred in the left 60% so the card fits on the right), pulled back about 20%.
    // While an industry is selected the podium's bottom ring turns brand red (the card's eyebrow colour) instead of
    // that industry's colour; with nothing selected it keeps the app's own neutral colour.
    const v3Camera = () => {
      const X = stage.scene3d;
      if (!X) return;
      Object.assign(X.n, {
        distance: 23, targetForward: 7.8, targetY: 1.1, elevation: 16, focusDistance: 19.4, focusTargetY: 1.4, focusHorizontal: 0.6, rotateSpeed: 5,
      });
      const red = getComputedStyle(document.documentElement).getPropertyValue("--red").trim() || "#ed1c24";
      (X.h || []).forEach((e) => e.rimColour && e.rimColour.set(red));
    };
    if (stage.scene3d) v3Camera(); else stage.addEventListener("industry:scene", v3Camera, { once: true });
    industryLeader(stage);
  }

  /* A dotted leader line runs from the focused model on the disc to the 3D app's floating card (.ind-modal).
     The model's spot is projected through the 3D camera every frame, so the line stays attached while the
     camera glides between industries. Hidden while the card is closed and on phones (the card is a bottom sheet). */
  function industryLeader(stage) {
    const body = $(".business__body"), svg = $(".leader");
    if (!body || !svg) return;
    const dots = $(".leader__dots", svg), mask = $(".leader__mask", svg);
    const pin = $(".leader__pin", svg), halo = $(".leader__halo", svg), end = $(".leader__end", svg);
    let index = -1, reveal = null;
    const project = (cam, x, y, z, W, H) => {
      const a = cam.matrixWorldInverse.elements, P = cam.projectionMatrix.elements;
      const vx = a[0] * x + a[4] * y + a[8] * z + a[12], vy = a[1] * x + a[5] * y + a[9] * z + a[13], vz = a[2] * x + a[6] * y + a[10] * z + a[14], vw = a[3] * x + a[7] * y + a[11] * z + a[15];
      const px = P[0] * vx + P[4] * vy + P[8] * vz + P[12] * vw, py = P[1] * vx + P[5] * vy + P[9] * vz + P[13] * vw, pw = P[3] * vx + P[7] * vy + P[11] * vz + P[15] * vw;
      return [((px / pw + 1) / 2) * W, ((1 - py / pw) / 2) * H];
    };
    // the focused model's centre in viewport pixels. The canvas is larger than the stage and offset,
    // so project onto the canvas's own box. Falls back to where the camera frames it.
    const modelAt = () => {
      const X = stage.scene3d, cv = $("canvas", stage), g = X && X.h && X.h[index] && X.h[index].group;
      if (g && cv && X.c) {
        const C = cv.getBoundingClientRect(), m = g.matrixWorld.elements, p = project(X.c, m[12], m[13] + 1.2, m[14], C.width, C.height);
        if (p.every(Number.isFinite)) return [C.left + p[0], C.top + p[1]];
      }
      const S = stage.getBoundingClientRect();
      return [S.left + S.width * 0.32, S.top + S.height * 0.48];
    };
    function draw(animate) {
      const card = $(".ind-modal", stage), title = card && $(".ind-modal-title", card);
      if (index < 0 || !title || card.hidden || getComputedStyle(svg).display === "none") { svg.classList.remove("is-on"); return; }
      const B = body.getBoundingClientRect(), R = title.getBoundingClientRect(), C = card.getBoundingClientRect();
      const [mx, my] = modelAt();
      const a = { x: mx - B.left, y: my - B.top };
      const b = { x: C.left - B.left - 12, y: R.top - B.top + R.height / 2 };
      const ex = Math.min(a.x + Math.abs(a.y - b.y) * 0.7, b.x - 40);
      const d = `M${a.x},${a.y} L${ex},${b.y} L${b.x},${b.y}`;
      dots.setAttribute("d", d); mask.setAttribute("d", d);
      [pin, halo].forEach((c) => { c.setAttribute("cx", a.x); c.setAttribute("cy", a.y); });
      end.setAttribute("cx", b.x); end.setAttribute("cy", b.y);
      svg.classList.add("is-on");
      if (!animate) return;
      // the mask path has pathLength="1": the reveal is measured in fractions of the line, so it stays whole
      // even though the line's real length changes every frame while the camera glides
      reveal && reveal.cancel();
      mask.style.strokeDasharray = "1 1";
      reveal = mask.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 1100, delay: 450, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" });
      reveal.onfinish = () => { mask.style.strokeDasharray = "none"; reveal.cancel(); };
      reveal.oncancel = () => { mask.style.strokeDasharray = "none"; };
      end.animate([{ opacity: 0, transform: "scale(0)" }, { opacity: 1, transform: "scale(1)" }], { duration: 500, delay: 1250, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" });
    }
    stage.addEventListener("industry:select", (e) => { index = e.detail.index; requestAnimationFrame(() => draw(true)); });
    stage.addEventListener("industry:close", () => { index = -1; svg.classList.remove("is-on"); });
    // keep it attached while the camera moves and through resizes, only while the section is on screen
    let raf = 0;
    const follow = () => { draw(false); raf = requestAnimationFrame(follow); };
    ScrollTrigger.create({
      trigger: body, start: "top bottom", end: "bottom top",
      onToggle: (s) => { cancelAnimationFrame(raf); raf = s.isActive ? requestAnimationFrame(follow) : 0; },
    });
  }
  /* ---------- 4. Foundation ----------
     A. gallery zoom: tiles scatter, centre photo opens to full bleed, story reveals
     B. impact cards: a pinned deck, each card lifting in tilted and flattening, with count-up */
  function countUp(el) {
    const to = +el.dataset.to;
    const o = { v: 0 };
    gsap.to(o, {
      v: to, duration: 2, ease: "power3.out",
      onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString("en-US")),
    });
  }

  /* Outline of the area our name comes from, traced from the dotted map supplied (356 points in a
     0–1000 box), drawn as a smooth closed line with a faint dotted fill, at ~10% behind the
     Foundation headline. Returns the parts the foundation timeline animates. */
  const FZ_MAP = "515,0 520,10 528,16 539,20 548,25 549,36 557,42 567,43 579,43 590,43 602,43 614,43 626,42 638,42 647,49 655,58 661,67 666,79 668,92 665,103 660,112 657,123 662,131 672,135 683,136 693,138 698,147 698,158 698,168 698,179 695,189 688,198 676,201 665,203 656,209 648,216 640,225 634,233 627,243 622,252 618,262 617,273 621,283 627,292 634,300 641,308 647,318 651,328 653,339 654,350 655,360 658,371 663,380 668,388 676,395 686,400 697,402 707,405 711,411 712,421 709,432 702,441 695,452 689,466 690,477 695,488 703,496 713,500 723,504 730,512 734,522 739,531 743,539 748,549 756,558 766,564 777,568 788,566 798,562 809,558 819,553 829,548 838,543 849,542 854,550 855,561 852,570 844,578 835,587 829,597 826,609 823,621 823,633 825,643 830,653 839,661 854,665 863,667 872,674 876,683 873,694 869,704 869,716 873,727 880,735 890,742 900,748 912,752 923,754 934,756 939,764 938,773 938,785 938,798 938,811 936,822 931,832 922,839 911,839 900,835 889,831 878,832 869,838 862,847 856,858 850,867 840,874 830,879 819,881 807,883 796,880 786,872 786,861 791,850 796,839 802,828 807,816 811,804 808,792 802,781 796,772 793,759 789,748 784,738 776,730 765,725 754,723 744,723 733,725 722,723 713,715 711,703 713,692 714,680 706,673 696,673 686,677 676,680 666,683 656,687 653,697 659,707 666,714 673,722 677,732 676,743 672,753 663,760 653,764 642,766 630,766 619,765 608,764 598,761 587,757 577,753 565,748 555,743 543,742 532,744 521,747 509,750 498,754 487,757 476,761 465,764 454,768 442,772 431,777 420,782 409,787 398,791 387,796 376,800 365,802 353,803 343,804 332,805 322,805 311,805 300,806 292,811 288,821 288,832 288,844 287,855 281,865 273,874 267,884 265,895 269,905 276,914 282,922 289,931 296,939 303,947 306,957 304,968 299,978 294,988 290,995 282,1000 274,996 273,987 270,978 269,968 268,957 267,945 262,935 257,925 253,917 249,907 246,897 244,887 243,876 242,865 242,854 242,843 243,833 243,822 246,811 249,801 254,791 256,781 247,776 236,772 228,765 222,757 217,747 216,736 214,724 207,714 199,706 187,703 176,700 165,694 157,685 152,675 152,665 154,654 158,643 167,636 176,631 185,624 188,614 179,608 169,602 161,593 156,575 151,556 144,547 135,541 124,539 112,538 101,538 89,537 78,536 68,533 57,528 48,522 40,514 34,506 27,497 17,492 6,487 0,479 3,468 7,458 13,448 27,433 42,421 49,416 58,411 68,407 77,404 86,402 97,400 109,399 121,398 132,397 144,397 155,396 167,396 178,396 189,395 200,394 210,390 218,382 222,373 223,362 222,352 220,342 218,331 219,320 220,310 221,300 221,289 221,277 223,266 227,255 231,245 238,235 246,228 257,223 267,219 278,216 289,213 299,210 310,206 320,201 328,193 335,184 340,174 344,164 347,153 351,143 360,137 372,135 384,133 393,126 400,118 405,109 411,100 416,91 421,82 421,71 420,60 425,51 431,42 439,33 447,25 460,17 471,12 481,8 492,4 503,0";
  function foundationMap() {
    const story = $(".fz__story");
    if (!story) return null;
    const p = FZ_MAP.split(" ").map((s) => s.split(",").map(Number)), n = p.length, at = (i) => p[(i + n) % n];
    // smooth closed curve through the points (Catmull–Rom → cubic Béziers)
    let d = `M${p[0][0]} ${p[0][1]}`;
    for (let i = 0; i < n; i++) {
      const a = at(i - 1), b = at(i), c = at(i + 1), e = at(i + 2);
      d += ` C${(b[0] + (c[0] - a[0]) / 6).toFixed(1)} ${(b[1] + (c[1] - a[1]) / 6).toFixed(1)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(1)} ${(c[1] - (e[1] - b[1]) / 6).toFixed(1)} ${c[0]} ${c[1]}`;
    }
    d += "Z";
    const wrap = document.createElement("div");
    wrap.className = "fz-map";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = `<svg viewBox="-10 -10 960 1020"><defs><pattern id="fz-dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="2.2" fill="currentColor" opacity=".55"/></pattern></defs><path class="fz-map__fill" d="${d}"/><path class="fz-map__line" d="${d}"/></svg>`;
    story.prepend(wrap);
    const line = $(".fz-map__line", wrap), length = line.getTotalLength();
    line.style.strokeDasharray = length;
    return { line, fill: $(".fz-map__fill", wrap), length };
  }

  function foundation() {
    const fz = $(".fz");
    const small = innerWidth < 700;
    const mainClip = clipper(".fz__main",
      small ? { t: 46, r: 22, b: 22, l: 22, a: 16, c: 16 } : { t: 50, r: 33, b: 10, l: 33, a: 20, c: 20 });
    const quote = SplitText.create(".fz__quote", { type: "lines", mask: "lines" });
    const setTheme = (dark) => (fz.dataset.theme = dark ? "dark" : "light");
    const map = foundationMap();

    const tl = gsap.timeline({ defaults: { ease: "none" } });
    tl.to(".fz__head", { yPercent: -70, autoAlpha: 0, duration: 0.35 }, 0);
    $$(".fz__tile").forEach((tile) => {
      const dx = tile.offsetLeft + tile.offsetWidth / 2 - fz.clientWidth / 2;
      const dy = tile.offsetTop + tile.offsetHeight / 2 - fz.clientHeight / 2;
      tl.to(tile, { x: dx * 0.9, y: dy * 0.9, scale: 1.25, autoAlpha: 0, duration: 0.55, ease: "power1.in" }, 0.02);
    });
    tl.to(mainClip.s, mainClip.to({ t: 0, r: 0, b: 0, l: 0, a: 0, c: 0, duration: 0.6, ease: "power2.inOut" }), 0.05)
      // start framed on the faces (photo shifted down into the small window), settle to full frame
      .fromTo(".fz__main img", { scale: 1.35, yPercent: small ? 8 : 34 }, { scale: 1, yPercent: 0, duration: 0.75 }, 0.05)
      .to(".fz__shade", { opacity: 1, duration: 0.25 }, 0.45)
      .call(() => setTheme(tl.scrollTrigger ? tl.scrollTrigger.direction > 0 : true), null, 0.5)
      .set(".fz__story", { visibility: "visible" }, 0.55)
      .from(".fz__kicker", { autoAlpha: 0, y: 20, duration: 0.15 }, 0.55)
      .from(quote.lines, { yPercent: 105, stagger: 0.05, duration: 0.25, ease: "power2.out" }, 0.58)
      .from(".fz__intro", { autoAlpha: 0, y: 24, duration: 0.2 }, 0.75);
    if (map) {
      // the area's outline draws itself in behind the headline, then its dotted fill appears
      tl.fromTo(map.line, { strokeDashoffset: map.length }, { strokeDashoffset: 0, duration: 0.4, ease: "power1.inOut" }, 0.58)
        .fromTo(map.fill, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.82);
    }
    tl.to({}, { duration: 0.25 }); // hold the finished frame before releasing the pin

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      ScrollTrigger.create({
        animation: tl, trigger: fz, pin: true,
        start: "top top", end: "+=240%", scrub: 1,
      });
      gsap.from(".fz__head .fz__title .line > span", {
        yPercent: 110, stagger: 0.1, duration: 1.4, ease: "expo.out",
        scrollTrigger: { trigger: fz, start: "top 70%" },
      });
      // side photos start further out and draw in toward the centre as the section scrolls into view
      // (a CSS variable feeds the `translate` property, so this never fights the pinned timeline's transform)
      $$(".fz__tile").forEach((tile) => {
        const left = tile.offsetLeft + tile.offsetWidth / 2 < fz.clientWidth / 2;
        gsap.fromTo(tile, { "--in": (left ? -1 : 1) * innerWidth * 0.35 + "px" }, { "--in": "0px", ease: "power2.out",
          scrollTrigger: { trigger: fz, start: "top bottom", end: "top top", scrub: 1 } });
      });

      /* "Where the support goes": the deck is pinned and one smoothed timeline lifts each card in,
         tilted back in 3D, flattening as it lands, while the cards behind tip away, shrink and dim
         (their tops peek out). No snapping — it fought the smooth scroller. Created here, before
         news(), so the pins are measured in page order. */
      const deck = $(".fdeck"), cards = $$(".fcard", deck), n = cards.length;
      const imgs = cards.map((c) => $(".fcard__media img", c));
      const bodies = cards.map((c) => $$(".fcard__body > *", c));
      const LEAD = 0.25, HOLD = 0.45, PEEK = 16;           // rest on the first card, rest on the last, px each card behind peeks
      cards.forEach((c, i) => gsap.set(c, { zIndex: i + 1, yPercent: i ? 115 : 0 }));
      bodies.forEach((b, i) => i && gsap.set(b, { y: 40, autoAlpha: 0 }));
      gsap.from(bodies[0], { y: 40, autoAlpha: 0, stagger: 0.07, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: deck, start: "top 75%" } });
      const stack = gsap.timeline();
      stack.to({}, { duration: LEAD }, 0);
      for (let i = 1; i < n; i++) {
        const at = LEAD + i - 1;
        stack.fromTo(cards[i], { yPercent: 105, rotationX: -22, scale: 0.92 }, { yPercent: 0, rotationX: 0, scale: 1, duration: 1, ease: "power3.out" }, at)
          .fromTo(imgs[i], { scale: 1.15 }, { scale: 1, duration: 1, ease: "power2.out" }, at);
        for (let j = 0; j < i; j++) {
          const depth = i - j;
          stack.to(cards[j], { rotationX: 6 + depth * 2, scale: 1 - depth * 0.06, y: -depth * PEEK, "--dim": Math.min(0.15 + depth * 0.13, 0.5), transformOrigin: "50% 0%", duration: 1, ease: "power2.inOut" }, at);
        }
        stack.to(bodies[i], { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.35, ease: "power2.out" }, at + 0.6);
      }
      stack.to({}, { duration: HOLD });
      // numbers count up as their card lands (the first one as the deck comes into view)
      const counted = new Set();
      const count = (i) => { const el = $(".count", cards[i]); if (el && !counted.has(el)) { counted.add(el); countUp(el); } };
      ScrollTrigger.create({ trigger: deck, start: "top 70%", once: true, onEnter: () => count(0) });
      ScrollTrigger.create({
        trigger: deck, pin: true, animation: stack, scrub: 1, invalidateOnRefresh: true,
        start: () => "top " + Math.round(84 + Math.min(innerHeight * 0.11, 110)) + "px",
        end: () => "+=" + (n - 1 + LEAD + HOLD) * innerHeight * 0.8,
        onUpdate: () => { for (let i = 1; i < n; i++) if (stack.time() >= LEAD + i - 1 + 0.6) count(i); },
      });
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      tl.progress(1);
      setTheme(true);
      $$(".count").forEach((n) => (n.textContent = (+n.dataset.to).toLocaleString("en-US")));
    });
  }

  /* ---------- 5. News: "Scatter" ----------
     Polaroids scattered on a table; the current story sits centred at full size, the rest lie around it
     at half size. Next / previous (buttons, ← → while the deck has focus or the pointer) lifts the next one
     to the front and drops the last back to its spot; the story details beside the deck roll over to match.
     Every polaroid is a link to its story (new tab); on mouse devices a "Read" badge follows the pointer. */
  function news() {
    const deck = $(".news__deck");
    if (!deck) return;
    const pile = $(".news__pile", deck), shots = $$(".nshot", pile), info = $(".news__info", deck), badge = $(".news__badge", pile);
    const dateEl = $(".news__date", info), hEl = $(".news__h", info), pEl = $(".news__p", info), read = $(".news__read", info), dots = $$(".news__dots i", pile);
    const story = (el) => ({ t: $(".sr-only", el).textContent, d: el.dataset.date, dt: el.dataset.dt, ex: el.dataset.ex, href: el.href });
    // resting spots: % of the pile from its centre, and a tilt (kept inside the pile)
    const SPOT = [[-22, -20, -9], [21, -22, 7], [-24, 19, 6], [22, 20, -6], [-2, -27, 3], [1, 25, -4]];
    let order = shots.map((_, i) => i), busy = false;
    const pose = (depth, i) => depth === 0
      ? { xPercent: -50, yPercent: -50, x: 0, y: 0, rotate: 0, scale: 1 }
      : { xPercent: -50, yPercent: -50, x: (SPOT[i][0] / 100) * pile.offsetWidth, y: (SPOT[i][1] / 100) * pile.offsetHeight, rotate: SPOT[i][2], scale: 0.52 };
    const place = (animate) => order.forEach((i, depth) => {
      const v = { ...pose(depth, i), zIndex: 20 - depth };
      animate ? gsap.to(shots[i], { ...v, duration: reduced ? 0.01 : 0.75, ease: "expo.out", overwrite: "auto" }) : gsap.set(shots[i], v);
    });
    const show = () => {
      const s = story(shots[order[0]]);
      const swap = () => { dateEl.textContent = s.d; dateEl.setAttribute("datetime", s.dt); hEl.textContent = s.t; pEl.textContent = s.ex; read.href = s.href; };
      dots.forEach((d, k) => d.classList.toggle("on", k === order[0]));
      if (reduced) return swap();
      // date, title and excerpt change together (no stagger): a quick fade out with a tiny lift, then a soft fade in rising into place
      const els = [dateEl, hEl, pEl];
      gsap.killTweensOf(els);
      gsap.timeline()
        .to(els, { autoAlpha: 0, y: -6, duration: 0.22, ease: "power2.in" })
        .add(swap)
        .fromTo(els, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: "power2.out", clearProps: "transform", immediateRender: false }); // don't jump to the "in" state before the old text has left
    };
    const step = (dir) => {
      if (busy) return;
      busy = true;
      if (dir > 0) order.push(order.shift()); else order.unshift(order.pop());
      place(true); show();
      gsap.delayedCall(reduced ? 0 : 0.6, () => (busy = false));
    };
    place(false);
    addEventListener("resize", () => place(false));
    $(".news__next", info).addEventListener("click", () => step(1));
    $(".news__prev", info).addEventListener("click", () => step(-1));
    // arrow keys only while the deck has the pointer or keyboard focus (they still scroll the page elsewhere)
    let near = false;
    deck.addEventListener("pointerenter", () => (near = true));
    deck.addEventListener("pointerleave", () => (near = false));
    addEventListener("keydown", (e) => {
      if (!(near || deck.contains(document.activeElement))) return;
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    });

    if (finePointer) {
      const bx = gsap.quickTo(badge, "x", { duration: 0.4, ease: "power3" }), by = gsap.quickTo(badge, "y", { duration: 0.4, ease: "power3" });
      pile.addEventListener("pointermove", (e) => { const r = pile.getBoundingClientRect(); bx(e.clientX - r.left); by(e.clientY - r.top); });
      shots.forEach((s) => {
        s.addEventListener("pointerenter", () => gsap.to(badge, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }));
        s.addEventListener("pointerleave", () => gsap.to(badge, { opacity: 0, scale: 0.3, duration: 0.3 }));
      });
    }
    if (reduced) return;
    const st = { trigger: deck, start: "top 80%" };
    gsap.from(shots, { y: "+=80", rotate: (i) => (i % 2 ? 8 : -8), autoAlpha: 0, stagger: 0.06, duration: 1.1, ease: "expo.out", scrollTrigger: st, onComplete: () => place(false) });
    gsap.from([...$$(".news__mask > *", info), $(".news__ctrl", info), $(".news__dots", pile)], { y: 24, autoAlpha: 0, stagger: 0.07, duration: 0.9, ease: "expo.out", scrollTrigger: st });
    gsap.from(".news__head > *", { y: 24, autoAlpha: 0, stagger: 0.08, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".news__head", start: "top 85%" } });
  }

  /* ---------- 6. Awards: certification seals stamped in on scroll ---------- */
  function awards() {
    const items = $$(".award");
    // click (or Enter / Space) opens the certificate full size; on touch the first tap turns the seal over
    const view = $(".certview"), vCap = $(".certview__cap");
    const vImg = Object.assign(document.createElement("img"), { className: "certview__img", decoding: "async" });
    vCap.before(vImg);
    const closeView = () => view.open && view.close();
    view.addEventListener("close", () => lenis.start());
    view.addEventListener("click", (e) => { if (e.target === view || e.target.closest(".certview__close")) closeView(); });
    items.forEach((it) => {
      const seal = $(".award__seal", it), cert = $(".award__back img", it), title = $("h3", it).textContent;
      const open = () => {
        vImg.src = cert.currentSrc || cert.src; vImg.alt = cert.alt; vCap.textContent = title;
        lenis.stop(); view.showModal();
        if (!reduced) gsap.fromTo(".certview__frame", { y: 24, scale: 0.96, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.5, ease: "expo.out" });
      };
      seal.addEventListener("click", () => {
        if (!matchMedia("(hover: hover)").matches && !seal.classList.contains("is-flipped")) {
          $$(".award__seal.is-flipped").forEach((o) => o.classList.remove("is-flipped"));
          seal.classList.add("is-flipped");
          return;
        }
        open();
      });
      seal.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
    if (reduced) return;
    const parts = (it) => [$("h3", it), $("p", it), $(".award__note", it)].filter(Boolean);
    gsap.set(items.map((it) => [$(".award__img", it), ...parts(it)]).flat(), { autoAlpha: 0 });
    // the stamp: pressed down from above, settles with a small bounce, sends a golden ripple
    ScrollTrigger.batch(items, {
      start: "top 85%", once: true,
      onEnter: (batch) => batch.forEach((it, k) => {
        const svg = $(".award__img", it), wave = $(".award__wave", it);
        gsap.timeline({ delay: k * 0.14 })
          .fromTo(svg, { scale: 1.9, rotation: -25, autoAlpha: 0, filter: "blur(6px)" }, { scale: 1, rotation: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.55, ease: "power4.in", clearProps: "filter" })
          .fromTo(svg, { scale: 0.94 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.45)" })
          .fromTo(wave, { scale: 0.9, autoAlpha: 0.9 }, { scale: 1.6, autoAlpha: 0, duration: 0.9, ease: "power2.out" }, "<")
          .fromTo(parts(it), { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.8, ease: "expo.out" }, "<0.1");
      }),
    });
  }

  /* ---------- 7. Contact ---------- */
  /* Contact map: the camera drift is drawn frame by frame onto a canvas as the page scrolls.
     Frames are whole images (assets/contact/scrub, or scrub-sm on phones), so scrubbing never shows
     the half-decoded flicker a seeking <video> does. Nothing moves unless the page is scrolled.
     Smoothing: the position is fractional and eased toward the scroll, and the next frame is
     cross-faded over the current one by that fraction, so the frames read as continuous motion. */
  function mapScrub() {
    const sec = $(".contact"), canvas = $(".contact__canvas");
    if (!sec || !canvas || reduced) return;
    const N = 96, small = innerWidth <= 960; // every frame of the scroll sweep (3d/contact-map/frames.py, step 1)
    const dir = small ? "assets/contact/scrub-sm/" : "assets/contact/scrub/";
    const focusX = small ? 0.38 : 0.4; // same framing as the still (object-position)
    const ctx = canvas.getContext("2d");
    const frames = new Array(N), ready = new Array(N).fill(false);
    let shown = "", want = 0, cur = -1, started = false, raf = 0;

    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2), r = canvas.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
      shown = ""; draw();
    }
    function nearestReady(i) {
      for (let d = 0; d < N; d++) { if (ready[i - d]) return i - d; if (ready[i + d]) return i + d; }
      return -1;
    }
    function paint(img, alpha) {
      const cw = canvas.width, ch = canvas.height;
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight); // object-fit: cover
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (cw - w) * focusX, (ch - h) / 2, w, h);
    }
    function draw() {
      raf = 0;
      if (cur < 0) cur = want;
      cur += (want - cur) * 0.16;                       // ease toward the scroll position
      if (Math.abs(want - cur) < 0.002) cur = want;
      const base = Math.floor(cur), frac = cur - base;
      const a = nearestReady(base);
      if (a < 0) return;
      const b = frac > 0.01 && base + 1 < N && ready[base + 1] && a === base ? base + 1 : -1;
      const key = b < 0 ? `${a}` : `${a}:${b}:${frac.toFixed(3)}`;
      if (key !== shown) {
        paint(frames[a], 1);
        if (b >= 0) paint(frames[b], frac);             // cross-fade the next frame in
        ctx.globalAlpha = 1;
        shown = key;
        canvas.classList.add("is-ready");
      }
      if (cur !== want) raf = requestAnimationFrame(draw);  // keep gliding until it settles
    }
    function progress() {
      const r = sec.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
      want = p * (N - 1);                                 // fractional: blended between frames
      if (!raf) raf = requestAnimationFrame(draw);
    }
    function load() {
      if (started) return; started = true;
      // first, last and middle first so any scroll position has a close frame early, then the rest in order
      const order = [0, N - 1, N >> 1, ...Array.from({ length: N }, (_, k) => k)].filter((v, k, a) => a.indexOf(v) === k);
      order.forEach((k) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => { ready[k] = true; shown = ""; if (!raf) raf = requestAnimationFrame(draw); };
        img.src = `${dir}f${String(k).padStart(3, "0")}.webp`;
        frames[k] = img;
      });
    }
    ScrollTrigger.create({ trigger: sec, start: "top bottom+=1500", once: true, onEnter: load });
    lenis.on("scroll", progress);
    new ResizeObserver(size).observe(canvas);
    progress();
  }

  /* Contact focus mode: starting to write (clicking or tabbing into the card) glides the card to the
     centre of the screen and enlarges it over a dim scrim; the heading and details step back, a close
     button rises from the bottom. Esc, the scrim, the close button or leaving the card brings it home.
     Straight moves only (no tilt). Desktop only: on phones the keyboard takes the screen anyway. */
  function contactFocus() {
    const sec = $(".contact"), card = $(".contact__card"), scrim = $(".contact__scrim"), close = $(".contact__close");
    const others = $$(".contact__head, .contact__credit");
    const wide = matchMedia("(min-width: 961px)");
    const D = reduced ? 0 : 1;
    let open = false;

    function enter() {
      if (open || !wide.matches) return;
      open = true;
      lenis.stop();
      gsap.killTweensOf(card);
      gsap.set(card, { x: 0, y: 0, scale: 1 });
      const r = card.getBoundingClientRect();
      const s = Math.max(0.85, Math.min(1.3, (innerWidth * 0.7) / r.width, (innerHeight * 0.78) / r.height));
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      card.classList.add("is-focused");
      sec.style.zIndex = "60"; // lift the whole section (it isolates its own layers) above the footer and nav
      gsap.to(card, { x: innerWidth / 2 - cx, y: innerHeight / 2 - cy, scale: s, duration: 0.8 * D, ease: "expo.out" });
      // everything else is pushed straight away from the card and recedes a touch
      others.forEach((el) => {
        const o = el.getBoundingClientRect();
        const dx = o.left + o.width / 2 - cx, dy = o.top + o.height / 2 - cy, d = Math.hypot(dx, dy) || 1, k = Math.min(220, d * 0.4);
        gsap.to(el, { x: (dx / d) * k, y: (dy / d) * k * 0.6, scale: 0.965, duration: 0.8 * D, ease: "expo.out" });
      });
      scrim.hidden = false;
      gsap.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.5 * D, ease: "power2.out" });
      close.hidden = false;
      gsap.fromTo(close, { y: 96 }, { y: 0, duration: 0.7 * D, ease: "expo.out" });
    }

    function leave() {
      if (!open) return;
      open = false;
      gsap.to(card, { x: 0, y: 0, scale: 1, duration: 0.7 * D, ease: "expo.out", onComplete: () => {
        if (!open) { card.classList.remove("is-focused"); sec.style.zIndex = ""; }
        if (!open && D) gsap.fromTo(card, { scale: 0.988 }, { scale: 1, duration: 0.55, ease: "elastic.out(1, 0.55)" });
      } });
      gsap.to(others, { x: 0, y: 0, scale: 1, duration: 0.7 * D, ease: "expo.out" });
      gsap.to(scrim, { opacity: 0, duration: 0.3 * D, ease: "power2.out", onComplete: () => { if (!open) scrim.hidden = true; } });
      gsap.to(close, { y: 96, duration: 0.32 * D, ease: "power2.in", onComplete: () => { if (!open) close.hidden = true; } });
      lenis.start();
    }

    card.addEventListener("focusin", enter);
    card.addEventListener("pointerdown", enter);
    scrim.addEventListener("click", leave);
    close.addEventListener("click", leave);
    addEventListener("keydown", (e) => { if (e.key === "Escape" && open) { leave(); document.activeElement?.blur(); } });
    // tabbing out of the card (anywhere but the close button) puts it back
    document.addEventListener("focusin", (e) => { if (open && !card.contains(e.target) && e.target !== close) leave(); });
    wide.addEventListener("change", leave);
    addEventListener("resize", () => open && leave());
  }

  function contact() {
    // blanks grow with what is typed
    $$(".blank input").forEach((inp) => inp.addEventListener("input", () => (inp.size = Math.max(inp.placeholder.length - 2, inp.value.length + 1))));

    const form = $(".talk"), note = $(".form__note"), go = $(".talk__go");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        note.textContent = "Please add your name and a valid email address.";
        const bad = form.querySelector(":invalid");
        if (bad) bad.focus();
        return;
      }
      gsap.timeline().to(go, { scale: 0.85, duration: 0.12 }).to(go, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.4)" });
      // TODO: connect to the real endpoint (email service / CRM)
      note.textContent = "Thank you. This form isn't connected yet — please email info@pandughar.com.";
    });

    mapScrub();
    contactFocus();

    if (reduced) return;
    gsap.from(".contact__card", { y: 60, autoAlpha: 0, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: ".contact", start: "top 60%" } });
    if (finePointer) {
      const gx = gsap.quickTo(go, "x", { duration: 0.5, ease: "power3" }), gy = gsap.quickTo(go, "y", { duration: 0.5, ease: "power3" });
      go.addEventListener("pointermove", (e) => { const r = go.getBoundingClientRect(); gx((e.clientX - r.left - r.width / 2) * 0.35); gy((e.clientY - r.top - r.height / 2) * 0.35); });
      go.addEventListener("pointerleave", () => { gx(0); gy(0); });
    }
    gsap.from([".contact__head .contact__ptitle", ".contact__addr", ".contact__more"], { y: 30, autoAlpha: 0, stagger: 0.1, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".contact", start: "top 75%" } });
    gsap.from(".talk__sentence", { y: 40, autoAlpha: 0, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: ".contact__write", start: "top 80%" } });
    gsap.from(".blank", { scaleX: 0, transformOrigin: "left", stagger: 0.1, duration: 1, delay: 0.3, ease: "expo.out", scrollTrigger: { trigger: ".contact__write", start: "top 80%" } });
  }

  /* ---------- 8. Footer ---------- */
  function footer() {
    const big = $(".footer__big");
    const fit = () => {
      big.style.fontSize = "100px";
      big.style.display = "inline-block";
      const w = big.getBoundingClientRect().width;
      big.style.display = "";
      const avail = big.parentElement.clientWidth -
        parseFloat(getComputedStyle(big.parentElement).paddingLeft) * 2;
      big.style.fontSize = (98 * avail) / w + "px";
    };
    fit();
    addEventListener("resize", fit);
    const s = SplitText.create(big, { type: "chars", mask: "chars" });
    gsap.from(s.chars, {
      yPercent: 100, stagger: 0.03, ease: "none",
      scrollTrigger: { trigger: big, start: "top bottom", end: "bottom 95%", scrub: true },
    });
    const fc = clipper(".footer__logo", { r: 100 });
    gsap.to(fc.s, fc.to({ r: 0, duration: 1.6, ease: "expo.inOut",
      scrollTrigger: { trigger: ".footer", start: "top 75%" } }));
    gsap.from([".footer__tagline", ".fcol"], {
      y: 40, autoAlpha: 0, stagger: 0.07, duration: 1.2, ease: "expo.out",
      scrollTrigger: { trigger: ".footer", start: "top 70%" },
    });
    gsap.to(".footer__orn", {
      rotate: -60, ease: "none",
      scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true },
    });
  }

  /* ---------- Language toggle (Bangla content pending) ---------- */
  function lang() {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.append(toast);
    let t;
    // the soft indicator sits under the active language
    const ind = $(".lang__ind"), active = $(".lang button.is-active");
    if (ind && active) document.fonts.ready.then(() => gsap.set(ind, { x: active.offsetLeft, width: active.offsetWidth }));
    $$('.lang button[lang="bn"]').forEach((b) =>
      b.addEventListener("click", () => {
        toast.innerHTML = '<span class="bn">বাংলা সংস্করণ শীঘ্রই আসছে</span> · Bangla version coming soon';
        toast.classList.add("is-on");
        clearTimeout(t);
        t = setTimeout(() => toast.classList.remove("is-on"), 2600);
      })
    );
  }

  /* ---------- Magnetic buttons ---------- */
  function magnetic() {
    if (!finePointer) return;
    $$("[data-magnetic]").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- Footer grid lens ----------
     a fine grid that's invisible except in a soft circle around the cursor; the cell under the
     cursor fills lightly and fades behind it; a click sends a faint ring outward.
     Canvas 2D behind the footer content, mouse devices only, runs only while the footer is on
     screen and something is still moving. */
  function footerGrid() {
    const foot = $(".footer");
    if (!foot || !finePointer || reduced) return;
    const cv = document.createElement("canvas");
    cv.className = "fgrid";
    cv.setAttribute("aria-hidden", "true");
    foot.prepend(cv);
    const ctx = cv.getContext("2d");
    const CREAM = "244,241,232";
    const C = 24;        // cell size
    const R = 200;       // lens radius
    const A = { line: 0.128, lineMid: 0.048, fill: 0.04, ring: 0.056 }; // strengths (kept very faint)
    let W = 0, H = 0, dpr = 1, cols = 0, rows = 0, offX = 0, offY = 0, val, tgt, held;
    const m = { x: 0, y: 0, sx: 0, sy: 0, inside: false, p: 0 };
    const rings = [];
    let t = 0, last = 0, raf = 0, visible = false;

    function size() {
      const r = foot.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cols = Math.ceil(W / C) + 1; rows = Math.ceil(H / C) + 1;
      offX = (W - (cols - 1) * C) / 2 - C / 2; offY = (H - (rows - 1) * C) / 2 - C / 2;
      val = new Float32Array(cols * rows); tgt = new Float32Array(cols * rows); held = new Float32Array(cols * rows);
      kick();
    }
    function stamp(x, y) {
      const x0 = Math.max(0, Math.floor((x - 60 - offX) / C)), x1 = Math.min(cols - 1, Math.floor((x + 60 - offX) / C));
      const y0 = Math.max(0, Math.floor((y - 60 - offY) / C)), y1 = Math.min(rows - 1, Math.floor((y + 60 - offY) / C));
      for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
        const d = Math.hypot(offX + i * C + C / 2 - x, offY + j * C + C / 2 - y);
        if (d < 60) { const n = j * cols + i, k = Math.pow(1 - d / 60, 1.6); if (k > tgt[n]) tgt[n] = k; held[n] = t; }
      }
    }
    function frame(now) {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now; t += dt;
      const k = 1 - Math.exp(-dt / 0.08);
      m.sx += (m.x - m.sx) * k; m.sy += (m.y - m.sy) * k;
      m.p += ((m.inside ? 1 : 0) - m.p) * (1 - Math.exp(-dt / 0.3));
      let busy = (m.p > 0.002 && m.p < 0.998) || Math.abs(m.x - m.sx) + Math.abs(m.y - m.sy) > 0.3 || rings.length > 0;
      for (let i = 0; i < val.length; i++) {
        if (tgt[i] > 0 && t - held[i] > 0.18) tgt[i] = Math.max(0, tgt[i] - dt / 0.9);
        const nv = val[i] + (tgt[i] - val[i]) * (1 - Math.exp(-dt / 0.06));
        val[i] = nv < 0.003 ? 0 : nv;
        if (val[i] > 0 || tgt[i] > 0) busy = true;
      }
      draw();
      if (busy && visible) raf = requestAnimationFrame(frame);
    }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (let n = rings.length - 1; n >= 0; n--) {
        const g = rings[n], rr = (t - g.t0) * 420, life = 1 - rr / 900;
        if (life <= 0) { rings.splice(n, 1); continue; }
        ctx.strokeStyle = `rgba(${CREAM},${A.ring * life})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(g.x, g.y, rr, 0, Math.PI * 2); ctx.stroke();
      }
      if (m.p > 0.002) {
        const g = ctx.createRadialGradient(m.sx, m.sy, 0, m.sx, m.sy, R);
        g.addColorStop(0, `rgba(${CREAM},${A.line * m.p})`);
        g.addColorStop(0.55, `rgba(${CREAM},${A.lineMid * m.p})`);
        g.addColorStop(1, `rgba(${CREAM},0)`);
        ctx.strokeStyle = g; ctx.lineWidth = 1; ctx.beginPath();
        const x0 = Math.max(0, Math.floor((m.sx - R - offX) / C)), x1 = Math.min(cols, Math.ceil((m.sx + R - offX) / C));
        const y0 = Math.max(0, Math.floor((m.sy - R - offY) / C)), y1 = Math.min(rows, Math.ceil((m.sy + R - offY) / C));
        for (let i = x0; i <= x1; i++) { const x = Math.round(offX + i * C) + 0.5; ctx.moveTo(x, offY + y0 * C); ctx.lineTo(x, offY + y1 * C); }
        for (let j = y0; j <= y1; j++) { const y = Math.round(offY + j * C) + 0.5; ctx.moveTo(offX + x0 * C, y); ctx.lineTo(offX + x1 * C, y); }
        ctx.stroke();
      }
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const a = val[j * cols + i];
        if (!a) continue;
        ctx.fillStyle = `rgba(${CREAM},${A.fill * a})`;
        ctx.fillRect(offX + i * C + 1, offY + j * C + 1, C - 1, C - 1);
      }
    }
    const kick = () => { if (!raf && visible) { last = 0; raf = requestAnimationFrame(frame); } };
    const local = (e) => { const r = foot.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; return { x, y, inside: x >= 0 && y >= 0 && x <= r.width && y <= r.height }; };
    addEventListener("pointermove", (e) => {
      if (!visible) return;
      const { x, y, inside } = local(e);
      if (inside && !m.inside) { m.sx = x; m.sy = y; }
      m.inside = inside;
      if (inside) { m.x = x; m.y = y; stamp(x, y); }
      kick();
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", () => { m.inside = false; kick(); });
    addEventListener("pointerdown", (e) => {
      if (!visible) return;
      const { x, y, inside } = local(e);
      if (inside) { rings.push({ x, y, t0: t }); kick(); }
    });
    new ResizeObserver(size).observe(foot);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(foot);
    size();
  }

  /* ---------- Floating back-to-top ----------
     visible from the first section after the hero to the very end; the click glides up through
     the anchor-link handler (which lets it pass straight through the pinned sections) */
  function toTop() {
    const btn = $(".totop"), hero = $(".hero");
    if (!btn || !hero) return;
    ScrollTrigger.create({
      trigger: hero, start: "bottom 60%", end: () => "+=" + document.documentElement.scrollHeight,
      onToggle: (s) => btn.classList.toggle("is-on", s.isActive),
    });
  }

  /* ---------- Dhaka clock ---------- */
  function clock() {
    const el = $(".clock");
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka" });
    const tick = () => (el.textContent = fmt.format(new Date()) + " GMT+6");
    tick();
    setInterval(tick, 30000);
  }
})();
