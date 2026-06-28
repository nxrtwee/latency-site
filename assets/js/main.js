/* ============================================================
   Latency site — interactions
   Bilingual content lives inline in the HTML as
   [data-lang-ru] / [data-lang-en] elements; CSS toggles which
   set is visible based on <html lang>. This JS just flips the
   attribute (+ persists it) and wires up the rest of the UI.
   ============================================================ */
(function () {
  "use strict";

  var STORE_KEY = "latency-lang";

  /* ---------- Language ---------- */
  function getLang() {
    try {
      var saved = localStorage.getItem(STORE_KEY);
      if (saved === "ru" || saved === "en") return saved;
    } catch (e) {}
    // default to browser preference, fall back to RU
    var nav = (navigator.language || "ru").toLowerCase();
    return nav.indexOf("ru") === 0 ? "ru" : "en";
  }

  function setLang(lang) {
    document.documentElement.setAttribute("lang", lang);
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) {}
    document.querySelectorAll(".lang-toggle button").forEach(function (b) {
      b.classList.toggle("active", b.dataset.lang === lang);
    });
    // swap any element that carries both data-ru / data-en text attributes
    document.querySelectorAll("[data-ru][data-en]").forEach(function (el) {
      var v = el.getAttribute("data-" + lang);
      if (v != null) {
        if (el.hasAttribute("placeholder")) el.setAttribute("placeholder", v);
        else el.textContent = v;
      }
    });
  }

  // apply ASAP to avoid flash
  setLang(getLang());

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".lang-toggle button").forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.dataset.lang); });
    });

    /* ---------- Mobile nav ---------- */
    var nav = document.querySelector(".nav");
    var toggle = document.querySelector(".nav-toggle");
    if (toggle && nav) {
      toggle.addEventListener("click", function () { nav.classList.toggle("open"); });
      nav.querySelectorAll(".nav-links a").forEach(function (a) {
        a.addEventListener("click", function () { nav.classList.remove("open"); });
      });
    }

    /* ---------- Platform detection → highlight relevant download ---------- */
    detectPlatform();

    /* ---------- Lightbox for screenshots ---------- */
    initLightbox();

    /* ---------- Navbar: condense on scroll + active-section spy ---------- */
    initNav();

    /* ---------- Cover-art wall (home hero backdrop) ---------- */
    initCoverWall();

    /* ---------- Animated particle backdrop ---------- */
    initParticles();

    /* ---------- Scroll reveal ---------- */
    initReveal();

    /* ---------- 3D cursor-tilt for desktop screenshots ---------- */
    initTilt();

    /* ---------- Docs scrollspy ---------- */
    initScrollSpy();

    /* ---------- Clean in-page anchors (no #hash in the address bar) ---------- */
    initCleanAnchors();

    /* ---------- Footer year ---------- */
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  });

  function detectPlatform() {
    var ua = navigator.userAgent || "";
    var plat = "win";
    if (/android/i.test(ua)) plat = "android";
    else if (/iphone|ipad|ipod/i.test(ua) || (/Mac/i.test(ua) && "ontouchend" in document)) plat = "ios";
    else if (/win/i.test(ua)) plat = "win";

    var card = document.querySelector('.dl-card[data-plat="' + plat + '"]');
    if (card && !document.querySelector(".dl-card.recommended")) {
      card.classList.add("recommended");
      var badge = card.querySelector(".dl-badge");
      if (badge) {
        badge.setAttribute("data-ru", "Ваша система");
        badge.setAttribute("data-en", "Your system");
        badge.textContent = document.documentElement.lang === "en" ? "Your system" : "Ваша система";
      }
    }

    // hero primary button label hint
    var heroBtn = document.querySelector("[data-hero-dl]");
    if (heroBtn) {
      var labels = {
        win:     { ru: "Скачать для Windows", en: "Download for Windows" },
        android: { ru: "Скачать для Android", en: "Download for Android" },
        ios:     { ru: "Скачать для iOS",     en: "Download for iOS" }
      };
      var span = heroBtn.querySelector("[data-hero-label]");
      if (span && labels[plat]) {
        span.setAttribute("data-ru", labels[plat].ru);
        span.setAttribute("data-en", labels[plat].en);
        span.textContent = document.documentElement.lang === "en" ? labels[plat].en : labels[plat].ru;
      }
    }
  }

  function initLightbox() {
    var shots = document.querySelectorAll("[data-full]");
    if (!shots.length) return;

    var box = document.createElement("div");
    box.className = "lightbox";
    box.innerHTML =
      '<button class="lightbox-close" aria-label="Close">&times;</button><img alt="">';
    document.body.appendChild(box);
    var img = box.querySelector("img");

    shots.forEach(function (s) {
      s.addEventListener("click", function () {
        var full = s.dataset.full || (s.querySelector("img") && s.querySelector("img").src);
        if (!full) return;
        img.src = full;
        box.classList.add("open");
      });
    });
    function close() { box.classList.remove("open"); img.src = ""; }
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target.classList.contains("lightbox-close")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  function initNav() {
    var nav = document.querySelector(".nav");
    if (!nav) return;

    // Dock into the vertical left rail after scrolling past the hero.
    // Disabled on narrow screens (mobile keeps the top bar + dropdown).
    var hero = document.querySelector(".hero");
    function threshold() { return hero ? Math.max(120, hero.offsetHeight - 160) : 90; }
    var th = threshold();
    var onScroll = function () {
      nav.classList.toggle("docked", window.innerWidth > 760 && window.scrollY > th);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () { th = threshold(); onScroll(); });

    // highlight the nav link of the section currently in view (in-page anchors)
    var links = nav.querySelectorAll('.nav-links a[href^="#"]');
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (l) {
      var id = l.getAttribute("href").slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = l;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("active"); });
          if (map[en.target.id]) map[en.target.id].classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  function initCoverWall() {
    var wall = document.getElementById("cover-wall");
    if (!wall || wall.childElementCount) return;   // build once

    var COVERS = ["1.png","2.png","3.png","4.png","5.png","6.png","7.png","8.png","9.png","10.png","11.png","12.png","13.png","14.png","15.png","16.jpg","17.png","18.png","19.png","20.png","21.png","22.png","23.png","24.png","25.jpg","26.jpg","27.png","28.png","29.png","30.png","31.jpg","32.png","33.png","34.png","35.jpg","36.jpg","37.jpg","38.png","39.png","40.png","41.png"];

    var COLS = 7;
    var cols = [];
    for (var c = 0; c < COLS; c++) cols.push([]);
    COVERS.forEach(function (name, i) { cols[i % COLS].push(name); });

    var frag = document.createDocumentFragment();
    cols.forEach(function (list, ci) {
      var col = document.createElement("div");
      col.className = "cover-col" + (ci % 2 ? " rev" : "");
      // duplicate the set so the marquee loops seamlessly at -50%
      list.concat(list).forEach(function (name) {
        var img = document.createElement("img");
        img.src = "assets/img/covers/" + name;
        img.alt = ""; img.loading = "lazy"; img.decoding = "async";
        col.appendChild(img);
      });
      col.style.animationDuration = (62 + ci * 8) + "s";
      col.style.animationDelay = "-" + (ci * 6) + "s";
      frag.appendChild(col);
    });
    wall.appendChild(frag);
  }

  function initParticles() {
    var canvas = document.getElementById("bg-particles");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Neon palette (cyan, magenta, violet) — matches the site accent
    var COLORS = [[54, 214, 255], [255, 43, 214], [181, 75, 255]];

    // Pre-rendered soft glow sprite per colour (cheap to blit each frame)
    var sprites = COLORS.map(function (c) {
      var s = document.createElement("canvas");
      s.width = s.height = 64;
      var g = s.getContext("2d");
      var rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      rg.addColorStop(0, "rgba(" + c[0] + "," + c[1] + "," + c[2] + ",1)");
      rg.addColorStop(0.25, "rgba(" + c[0] + "," + c[1] + "," + c[2] + ",.55)");
      rg.addColorStop(1, "rgba(" + c[0] + "," + c[1] + "," + c[2] + ",0)");
      g.fillStyle = rg;
      g.fillRect(0, 0, 64, 64);
      return s;
    });

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var dots = [], shards = [];

    function rand(a, b) { return a + Math.random() * (b - a); }

    function build() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var area = W * H;
      var nDots = Math.min(80, Math.round(area / 21000));
      var nShards = Math.min(16, Math.round(area / 95000));

      dots = [];
      for (var i = 0; i < nDots; i++) {
        dots.push({
          x: rand(0, W), y: rand(0, H),
          vx: rand(-0.12, 0.12), vy: rand(-0.28, -0.05),
          size: rand(6, 20),
          ci: (Math.random() * COLORS.length) | 0,
          base: rand(0.15, 0.5), amp: rand(0.05, 0.25),
          ph: rand(0, Math.PI * 2), sp: rand(0.4, 1.2)
        });
      }
      shards = [];
      for (var j = 0; j < nShards; j++) {
        shards.push({
          x: rand(0, W), y: rand(0, H),
          vx: rand(-0.1, 0.1), vy: rand(-0.18, 0.05),
          len: rand(16, 46), rot: rand(0, Math.PI * 2), vr: rand(-0.004, 0.004),
          ci: (Math.random() * COLORS.length) | 0, alpha: rand(0.05, 0.16)
        });
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        if (!reduce) {
          d.x += d.vx; d.y += d.vy;
          if (d.y < -30) { d.y = H + 30; d.x = rand(0, W); }
          if (d.x < -30) d.x = W + 30; else if (d.x > W + 30) d.x = -30;
        }
        var a = d.base + d.amp * Math.sin(t * 0.001 * d.sp + d.ph);
        ctx.globalAlpha = a < 0 ? 0 : a;
        ctx.drawImage(sprites[d.ci], d.x - d.size / 2, d.y - d.size / 2, d.size, d.size);
      }

      for (var j = 0; j < shards.length; j++) {
        var s = shards[j];
        if (!reduce) {
          s.x += s.vx; s.y += s.vy; s.rot += s.vr;
          if (s.y < -60) { s.y = H + 60; s.x = rand(0, W); }
          if (s.y > H + 60) s.y = -60;
          if (s.x < -60) s.x = W + 60; else if (s.x > W + 60) s.x = -60;
        }
        var c = COLORS[s.ci];
        ctx.globalAlpha = s.alpha;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.beginPath();
        ctx.moveTo(0, -s.len / 2);
        ctx.lineTo(s.len * 0.16, s.len / 2);
        ctx.lineTo(-s.len * 0.16, s.len / 2);
        ctx.closePath();
        ctx.fillStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + ",.9)";
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    var raf = 0;
    function loop(t) { draw(t); raf = requestAnimationFrame(loop); }
    function start() { if (!raf && !reduce) raf = requestAnimationFrame(loop); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

    build();
    if (reduce) { draw(0); }   // single static frame
    else start();

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { build(); if (reduce) draw(0); }, 200);
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });
  }

  /* Premium parallax: each .win screenshot tilts in 3D toward the cursor and
     a soft glare follows it. Only on fine-pointer, motion-OK devices. The tilt
     is applied as an inline transform (overrides the CSS hover lift) and is
     fully reset on pointerleave — no layout shift, so it can't flicker. */
  function initTilt() {
    if (!window.matchMedia) return;
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var MAX = 6; // degrees at the edges
    document.querySelectorAll(".win").forEach(function (win) {
      var glare = document.createElement("span");
      glare.className = "win-glare";
      win.appendChild(glare);

      var raf = 0, ry = 0, rx = 0;
      function apply() {
        raf = 0;
        win.style.transform =
          "perspective(900px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-6px) scale(1.02)";
      }
      win.addEventListener("mouseenter", function () {
        win.classList.add("tilting");
        win.style.transition = "transform .12s ease-out";
      });
      win.addEventListener("mousemove", function (e) {
        var r = win.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;   // -0.5 … 0.5
        var py = (e.clientY - r.top) / r.height - 0.5;
        ry = px * MAX * 2;     // rotateY follows horizontal
        rx = -py * MAX * 2;    // rotateX follows vertical (inverted)
        glare.style.setProperty("--mx", ((px + 0.5) * 100).toFixed(1) + "%");
        glare.style.setProperty("--my", ((py + 0.5) * 100).toFixed(1) + "%");
        if (!raf) raf = requestAnimationFrame(apply);
      });
      win.addEventListener("mouseleave", function () {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        win.classList.remove("tilting");
        win.style.transition = "transform .5s var(--ease)";
        win.style.transform = "";
      });
    });
  }

  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  function initScrollSpy() {
    var links = document.querySelectorAll(".docs-side a[href^='#']");
    if (!links.length) return;
    var map = {};
    links.forEach(function (l) {
      var id = l.getAttribute("href").slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = l;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("active"); });
          if (map[en.target.id]) map[en.target.id].classList.add("active");
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    Object.keys(map).forEach(function (id) {
      io.observe(document.getElementById(id));
    });
  }

  /* In-page anchors smooth-scroll to their target but never write the #hash
     into the URL — the address bar stays clean (e.g. ".../" not ".../#features").
     Trade-off: section deep-links aren't shareable, which is fine for a landing.
     External links and cross-page #anchors (target id not on this page) are left
     untouched so they navigate normally. */
  function initCleanAnchors() {
    function navOffset() {
      var v = getComputedStyle(document.documentElement).getPropertyValue("--nav-h");
      var n = parseInt(v, 10);
      return (isNaN(n) ? 84 : n) + 16;
    }
    function scrollToId(id, smooth) {
      var el = id && document.getElementById(id);
      if (!el) return false;
      var y = el.getBoundingClientRect().top + window.pageYOffset - navOffset();
      window.scrollTo({ top: y < 0 ? 0 : y, behavior: smooth ? "smooth" : "auto" });
      return true;
    }
    function stripHash() {
      if (window.history && history.replaceState && location.hash) {
        history.replaceState(null, "", location.pathname + location.search);
      }
    }
    document.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var href = a.getAttribute("href");
      if (!href || href === "#") return;
      if (!document.getElementById(href.slice(1))) return;  // unknown target → default behaviour
      e.preventDefault();
      scrollToId(href.slice(1), true);   // smooth on click
      stripHash();
    });
    // opened with a #hash (old shared link / reload): jump there instantly, then clean it
    if (location.hash.length > 1) {
      var id = location.hash.slice(1);
      window.addEventListener("load", function () { if (scrollToId(id, false)) stripHash(); });
    }
  }
})();
