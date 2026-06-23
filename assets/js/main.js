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

    /* ---------- Scroll reveal ---------- */
    initReveal();

    /* ---------- Docs scrollspy ---------- */
    initScrollSpy();

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
})();
