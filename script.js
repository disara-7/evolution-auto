/* =========================================================
   EVOLUTION AUTO — Homepage interactions (vanilla JS)
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desktopStory = matchMedia("(min-width: 901px)");

  /* ---------------------------------------------------------
     Vehicle data — rendered into the showcase and explorer
     --------------------------------------------------------- */
  const VEHICLES = [
    { brand: "IM Motors", model: "IM6", desc: "Intelligent electric mobility.", img: "im-im6", tags: ["suv", "performance"] },
    { brand: "IM Motors", model: "L7", desc: "A flagship saloon, quietly confident.", img: "im-l7", tags: ["sedan", "luxury"] },
    { brand: "XPENG", model: "G6", desc: "The ultra-smart coupé SUV for every day.", img: "xpeng-g6", tags: ["suv"] },
    { brand: "XPENG", model: "P7", desc: "Sleek, sporty and software-defined.", img: "xpeng-p7", tags: ["sedan", "performance"] },
    { brand: "XPENG", model: "G9", desc: "Flagship space, intelligently refined.", img: "xpeng-g9", tags: ["suv", "luxury"] },
    { brand: "RIDDARA", model: "RD6", desc: "The all-electric pickup for work and weekends.", img: "riddara-rd6", tags: ["pickup"] },
    { brand: "AION", model: "Y Plus", desc: "Spacious, efficient electric for the city.", img: "aion-y", tags: ["suv"] },
    { brand: "AION", model: "S", desc: "The effortless everyday electric sedan.", img: "aion-s", tags: ["sedan"] },
    { brand: "HYPTEC", model: "SSR", desc: "Electric hypercar performance.", img: "hyptec-ssr", tags: ["performance", "luxury"] },
  ];
  const TAG_LABEL = { suv: "SUV", sedan: "Sedan", pickup: "Pickup", luxury: "Luxury", performance: "Performance" };

  const cardHTML = (v, cursor) => `
    <article class="vcard" data-tilt data-cursor="${cursor}">
      <a href="#explorer" class="vcard__link" aria-label="Explore ${v.brand} ${v.model}">
        <div class="vcard__media">
          <span class="vcard__badge">${TAG_LABEL[v.tags[0]]}</span>
          <img src="assets/vehicles/${v.img}.jpg" alt="${v.brand} ${v.model}" loading="lazy" draggable="false">
        </div>
        <div class="vcard__body">
          <span class="vcard__brand">${v.brand}</span>
          <h3 class="vcard__model">${v.model}</h3>
          <p class="vcard__desc">${v.desc}</p>
          <span class="vcard__cta">Explore <svg class="i"><use href="#i-arrow"/></svg></span>
        </div>
        <span class="vcard__line"></span>
      </a>
    </article>`;

  const galleryTrack = $("#galleryTrack");
  const explorerGrid = $("#explorerGrid");
  galleryTrack.innerHTML = VEHICLES.map((v) => `<div class="gallery__item">${cardHTML(v, "drag")}</div>`).join("");
  explorerGrid.innerHTML = VEHICLES.map(
    (v) => `<div class="explorer__item" data-tags="${v.tags.join(" ")}" data-brand="${v.brand}" data-model="${v.model}">${cardHTML(v, "explore")}</div>`
  ).join("");

  /* ---------------------------------------------------------
     Split headings into masked words for line-by-line reveal
     --------------------------------------------------------- */
  $$("[data-split]").forEach((el) => {
    let i = 0;
    const frag = document.createDocumentFragment();
    [...el.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.append(" ");
          const w = document.createElement("span");
          w.className = "w";
          w.innerHTML = `<span style="--i:${i++}">${part}</span>`;
          frag.append(w);
        });
      } else {
        frag.append(node.cloneNode(true));
      }
    });
    el.textContent = "";
    el.append(frag);
  });

  /* ---------------------------------------------------------
     Reveal on enter
     --------------------------------------------------------- */
  const revealIO = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        revealIO.unobserve(e.target);
      }),
    { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
  );
  $$(".reveal, [data-split], [data-reveal-line], .energy-line").forEach((el) => revealIO.observe(el));

  /* ---------------------------------------------------------
     Header: glass state, hide on scroll down, mobile menu
     --------------------------------------------------------- */
  const header = $("#header");
  const burger = $("#burger");
  let lastY = scrollY;

  const setNav = (open) => {
    document.body.classList.toggle("nav-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  burger.addEventListener("click", () => setNav(!document.body.classList.contains("nav-open")));
  $$("#nav a").forEach((a) => a.addEventListener("click", () => setNav(false)));
  addEventListener("keydown", (e) => e.key === "Escape" && setNav(false));

  // Scrollspy — thin green line under the active section's link
  const navLinks = $$(".nav__link");
  const spyMap = { about: "about", story: "about", showcase: "showcase", explorer: "showcase", brands: "brands", partners: "brands", ecosystem: "ecosystem", technology: "ecosystem", sustainability: "sustainability", news: "news", contact: "contact" };
  const spyIO = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const target = spyMap[e.target.id];
        navLinks.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === `#${target}`));
      }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  Object.keys(spyMap).forEach((id) => { const s = document.getElementById(id); if (s) spyIO.observe(s); });
  new IntersectionObserver(([e]) => e.isIntersecting && navLinks.forEach((l) => l.classList.remove("is-active")), { threshold: 0.6 }).observe($("#hero"));

  /* ---------------------------------------------------------
     Hero: entrance + cursor-driven parallax / lighting
     --------------------------------------------------------- */
  const hero = $("#hero");
  requestAnimationFrame(() => setTimeout(() => hero.classList.add("is-in"), 120));

  if (finePointer.matches && !reducedMotion) {
    let tx = 0, ty = 0, cx = 0, cy = 0, running = false;
    const tick = () => {
      cx = lerp(cx, tx, 0.06);
      cy = lerp(cy, ty, 0.06);
      hero.style.setProperty("--mx", cx.toFixed(4));
      hero.style.setProperty("--my", cy.toFixed(4));
      if (Math.abs(cx - tx) > 0.001 || Math.abs(cy - ty) > 0.001) requestAnimationFrame(tick);
      else running = false;
    };
    const kick = () => { if (!running) { running = true; requestAnimationFrame(tick); } };
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      kick();
    });
    hero.addEventListener("mouseleave", () => { tx = 0; ty = 0; kick(); });
  }

  /* ---------------------------------------------------------
     Story (sticky storytelling)
     --------------------------------------------------------- */
  const story = $("#story");
  const storySteps = $$(".story__step");
  const storyImgs = $$(".story__img");
  const storyBars = $$(".story__progress i");
  const storyCounter = $(".story__counter b");
  let storyIndex = -1;

  const setStory = (idx) => {
    if (idx === storyIndex) return;
    storyIndex = idx;
    storySteps.forEach((s, i) => {
      s.classList.toggle("is-active", i === idx);
      s.classList.toggle("is-past", i < idx);
    });
    storyImgs.forEach((img, i) => img.classList.toggle("is-shown", i <= idx));
    storyCounter.textContent = String(idx + 1).padStart(2, "0");
  };
  setStory(0);

  // Mobile/tablet: the step in the middle of the viewport is active
  const storyIO = new IntersectionObserver(
    (entries) => {
      if (desktopStory.matches) return;
      entries.forEach((e) => e.isIntersecting && setStory(+e.target.dataset.step));
    },
    { rootMargin: "-50% 0px -40% 0px" }
  );
  storySteps.forEach((s) => storyIO.observe(s));

  /* ---------------------------------------------------------
     Ecosystem progression
     --------------------------------------------------------- */
  const ecoSteps = $$(".eco-step");
  const ecoImgs = $$(".eco-img");
  const ecoList = $(".ecosystem__steps");
  const ecoIO = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const idx = +e.target.dataset.eco;
        ecoSteps.forEach((s, i) => s.classList.toggle("is-active", i === idx));
        ecoImgs.forEach((img, i) => img.classList.toggle("is-active", i === idx));
      }),
    { rootMargin: "-48% 0px -48% 0px" }
  );
  ecoSteps.forEach((s) => ecoIO.observe(s));

  /* ---------------------------------------------------------
     Scroll-linked engine (single rAF per frame)
     --------------------------------------------------------- */
  const featured = $("#featured");
  const featuredContent = $(".featured__content");
  const sustain = $("#sustainability");
  const cta = $("#contact");

  // progress through a tall sticky section: 0 at top, 1 when it ends
  const stickyProgress = (el) => {
    const r = el.getBoundingClientRect();
    return clamp(-r.top / (r.height - innerHeight));
  };
  // progress of an element travelling through the viewport: 0 entering, 1 leaving
  const passProgress = (el) => {
    const r = el.getBoundingClientRect();
    return clamp((innerHeight - r.top) / (innerHeight + r.height));
  };
  // 0 when the element's top hits the viewport bottom → 1 when its top reaches the viewport top
  const enterProgress = (el) => clamp((innerHeight - el.getBoundingClientRect().top) / innerHeight);

  let ticking = false;
  const update = () => {
    ticking = false;
    const y = scrollY;

    // header
    header.classList.toggle("is-scrolled", y > 40);
    const navOpen = document.body.classList.contains("nav-open");
    header.classList.toggle("is-hidden", !navOpen && y > 700 && y > lastY + 4);
    if (y < lastY - 4 || y < 700) header.classList.remove("is-hidden");
    lastY = y;

    // hero
    if (!reducedMotion) hero.style.setProperty("--hp", clamp(y / innerHeight).toFixed(4));

    // story
    const sp = stickyProgress(story);
    if (!reducedMotion) story.style.setProperty("--sp", sp.toFixed(4));
    if (desktopStory.matches) {
      setStory(Math.min(3, Math.floor(sp * 4)));
      storyBars.forEach((b, i) => b.style.setProperty("--f", clamp(sp * 4 - i).toFixed(3)));
    }

    // ecosystem rail
    const er = ecoList.getBoundingClientRect();
    ecoList.style.setProperty("--eco-fill", clamp((innerHeight * 0.5 - er.top) / er.height).toFixed(4));

    // featured
    const fp = stickyProgress(featured);
    const f = reducedMotion ? 1 : fp;
    featured.style.setProperty("--fp", f.toFixed(4));
    featured.style.setProperty("--fe", clamp(f * 1.6).toFixed(4)); // car settles in the first ~60%
    if (fp > 0.2 || reducedMotion) featuredContent.classList.add("is-in");
    else if (fp < 0.05) featuredContent.classList.remove("is-in");

    // sustainability + CTA: small framed image expands to full-width, then scales slowly
    if (!reducedMotion) {
      sustain.style.setProperty("--ex", (1 - enterProgress(sustain)).toFixed(4));
      sustain.style.setProperty("--ss", passProgress(sustain).toFixed(4));
      cta.style.setProperty("--ex", (1 - enterProgress(cta)).toFixed(4));
      cta.style.setProperty("--cs", passProgress(cta).toFixed(4));
    } else {
      sustain.style.setProperty("--ex", 0);
      cta.style.setProperty("--ex", 0);
    }
  };
  const requestUpdate = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener("scroll", requestUpdate, { passive: true });
  addEventListener("resize", requestUpdate);
  update();

  /* ---------------------------------------------------------
     Horizontal gallery: drag, buttons, progress
     --------------------------------------------------------- */
  const gallery = $("#gallery");
  const galleryBar = $("#galleryBar");
  const prevBtn = $("[data-gallery-prev]");
  const nextBtn = $("[data-gallery-next]");

  const galleryStep = () => {
    const item = $(".gallery__item", gallery);
    return item ? item.getBoundingClientRect().width + parseFloat(getComputedStyle(galleryTrack).columnGap || 24) : 400;
  };
  const updateGallery = () => {
    const max = gallery.scrollWidth - gallery.clientWidth;
    const ratio = gallery.clientWidth / gallery.scrollWidth;
    const p = max > 0 ? gallery.scrollLeft / max : 0;
    galleryBar.style.transform = `scaleX(${(ratio + (1 - ratio) * p).toFixed(4)})`;
    prevBtn.disabled = gallery.scrollLeft < 4;
    nextBtn.disabled = gallery.scrollLeft > max - 4;
  };
  gallery.addEventListener("scroll", updateGallery, { passive: true });
  addEventListener("resize", updateGallery);
  updateGallery();
  prevBtn.addEventListener("click", () => gallery.scrollBy({ left: -galleryStep(), behavior: "smooth" }));
  nextBtn.addEventListener("click", () => gallery.scrollBy({ left: galleryStep(), behavior: "smooth" }));
  gallery.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); nextBtn.click(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); prevBtn.click(); }
  });

  // mouse drag (touch uses native scrolling)
  let drag = null;
  gallery.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    drag = { x: e.clientX, left: gallery.scrollLeft, moved: false, id: e.pointerId };
  });
  gallery.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 6) {
      drag.moved = true;
      gallery.classList.add("is-dragging");
      gallery.setPointerCapture(drag.id);
    }
    if (drag.moved) gallery.scrollLeft = drag.left - dx;
  });
  const endDrag = () => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    if (!moved) return;
    // snap to the nearest card once the drag ends
    const step = galleryStep();
    const target = Math.round(gallery.scrollLeft / step) * step;
    gallery.classList.remove("is-dragging");
    gallery.scrollTo({ left: target, behavior: "smooth" });
    // swallow the click that follows a drag
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
  };
  let suppressClick = false;
  gallery.addEventListener("click", (ev) => {
    if (!suppressClick) return;
    ev.preventDefault();
    ev.stopPropagation();
  }, true);
  gallery.addEventListener("pointerup", endDrag);
  gallery.addEventListener("pointercancel", endDrag);

  /* ---------------------------------------------------------
     Subtle 3D tilt on vehicle cards (desktop only)
     --------------------------------------------------------- */
  if (finePointer.matches && !reducedMotion) {
    document.addEventListener("pointermove", (e) => {
      const card = e.target.closest?.("[data-tilt]");
      if (!card || gallery.classList.contains("is-dragging")) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.classList.add("is-tilting");
      card.style.setProperty("--rx", `${(-py * 5).toFixed(2)}deg`);
      card.style.setProperty("--ry", `${(px * 7).toFixed(2)}deg`);
      card.style.setProperty("--ix", `${(px * -12).toFixed(1)}px`);
      card.style.setProperty("--iy", `${(py * -8).toFixed(1)}px`);
      card.style.setProperty("--gx", `${((px + 0.5) * 100).toFixed(1)}%`);
      card.style.setProperty("--gy", `${((py + 0.5) * 100).toFixed(1)}%`);
    });
    $$("[data-tilt]").forEach((card) =>
      card.addEventListener("pointerleave", () => {
        card.classList.remove("is-tilting");
        ["--rx", "--ry", "--ix", "--iy"].forEach((p) => card.style.removeProperty(p));
      })
    );
  }

  /* ---------------------------------------------------------
     Vehicle explorer filtering (FLIP animation)
     --------------------------------------------------------- */
  const filters = $$(".filter");
  const filterBar = $(".filters");
  const indicator = $(".filters__indicator");
  const countEl = $("#explorerCount");
  const items = $$(".explorer__item", explorerGrid);
  const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  let filtering = false;
  let narrowed = false; // explorer is narrowed by the hero finder's brand/model

  const moveIndicator = (btn) => {
    indicator.style.setProperty("--x", `${btn.offsetLeft}px`);
    indicator.style.setProperty("--w", `${btn.offsetWidth}px`);
  };
  const activeFilter = () => $(".filter.is-active");
  moveIndicator(activeFilter());
  addEventListener("resize", () => moveIndicator(activeFilter()));
  document.fonts?.ready.then(() => moveIndicator(activeFilter()));

  // `query` narrows by brand/model (set by the hero finder); category tabs clear it
  const applyFilter = async (key, query = {}) => {
    if (filtering) return;
    filtering = true;
    const match = (el) =>
      (key === "all" || el.dataset.tags.split(" ").includes(key)) &&
      (!query.brand || el.dataset.brand === query.brand) &&
      (!query.model || el.dataset.model === query.model);
    const visible = items.filter((el) => !el.classList.contains("is-hidden"));
    const leaving = visible.filter((el) => !match(el));

    // 1. fade out cards that are leaving
    if (!reducedMotion && leaving.length) {
      await Promise.all(
        leaving.map((el) =>
          el.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(0.96)" }], { duration: 280, easing: "ease-in", fill: "forwards" }).finished
        )
      );
    }

    // 2. record positions, change layout
    const first = new Map(items.map((el) => [el, el.getBoundingClientRect()]));
    items.forEach((el) => {
      el.getAnimations().forEach((a) => a.cancel());
      el.classList.toggle("is-hidden", !match(el));
    });
    const count = items.filter(match).length;
    countEl.textContent = count;
    countEl.nextSibling.textContent = count === 1 ? " vehicle" : " vehicles";

    // 3. play: move remaining cards, bring new ones in
    if (!reducedMotion) {
      let n = 0;
      items.forEach((el) => {
        if (el.classList.contains("is-hidden")) return;
        const a = first.get(el);
        const b = el.getBoundingClientRect();
        if (a.width === 0) {
          el.animate(
            [{ opacity: 0, transform: "translateY(40px) scale(0.97)" }, { opacity: 1, transform: "none" }],
            { duration: 750, easing: EASE, delay: 60 + n++ * 70, fill: "backwards" }
          );
        } else if (a.left !== b.left || a.top !== b.top) {
          el.animate(
            [{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px)` }, { transform: "none" }],
            { duration: 750, easing: EASE }
          );
        }
      });
    }
    filtering = false;
  };

  filters.forEach((btn) =>
    btn.addEventListener("click", () => {
      if ((btn.classList.contains("is-active") && !narrowed) || filtering) return;
      narrowed = false;
      filters.forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-selected", String(b === btn));
      });
      moveIndicator(btn);
      btn.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      applyFilter(btn.dataset.filter);
    })
  );
  // keep scrollable filter bar in sync
  filterBar.addEventListener("scroll", () => moveIndicator(activeFilter()), { passive: true });

  /* ---------------------------------------------------------
     Hero quick finder — Brand / Model / Body type
     --------------------------------------------------------- */
  const finder = $("#finder");
  const fMake = $("#finderMake");
  const fModel = $("#finderModel");
  const fType = $("#finderType");
  const fCount = $("#finderCount");
  const fNoun = $("#finderNoun");
  const addOptions = (sel, values, label = (v) => v) =>
    values.forEach((v) => sel.add(new Option(label(v), v)));

  addOptions(fMake, [...new Set(VEHICLES.map((v) => v.brand))]);
  addOptions(fType, Object.keys(TAG_LABEL), (k) => TAG_LABEL[k]);

  const updateFinder = () => {
    const n = VEHICLES.filter(
      (v) =>
        (!fMake.value || v.brand === fMake.value) &&
        (!fModel.value || v.model === fModel.value) &&
        (!fType.value || v.tags.includes(fType.value))
    ).length;
    fCount.textContent = n;
    fNoun.textContent = n === 1 ? "vehicle" : "vehicles";
  };

  fMake.addEventListener("change", () => {
    fModel.length = 1;
    fModel.disabled = !fMake.value;
    addOptions(fModel, VEHICLES.filter((v) => v.brand === fMake.value).map((v) => v.model));
    updateFinder();
  });
  fModel.addEventListener("change", updateFinder);
  fType.addEventListener("change", updateFinder);
  updateFinder();

  finder.addEventListener("submit", (e) => {
    e.preventDefault();
    const key = fType.value || "all";
    const tab = filters.find((b) => b.dataset.filter === key);
    filters.forEach((b) => {
      b.classList.toggle("is-active", b === tab);
      b.setAttribute("aria-selected", String(b === tab));
    });
    moveIndicator(tab);
    narrowed = !!fMake.value;
    applyFilter(key, { brand: fMake.value, model: fModel.value });
    $("#explorer").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  });

  /* ---------------------------------------------------------
     Brands catalogue
     --------------------------------------------------------- */
  const brandsSection = $("#brands");
  const brandTabs = $$(".brand-tab");
  const brandSlides = $$(".brand-slide");
  const brandInfos = $$(".brand-info__item");
  const setBrand = (idx) => {
    brandsSection.dataset.brand = idx;
    brandTabs.forEach((t, i) => {
      t.classList.toggle("is-active", i === idx);
      t.setAttribute("aria-selected", String(i === idx));
    });
    brandSlides.forEach((s, i) => s.classList.toggle("is-active", i === idx));
    brandInfos.forEach((s, i) => s.classList.toggle("is-active", i === idx));
  };
  brandTabs.forEach((tab, i) => {
    tab.addEventListener("click", () => setBrand(i));
    if (finePointer.matches) tab.addEventListener("mouseenter", () => setBrand(i));
  });

  /* ---------------------------------------------------------
     Contextual cursor (desktop only)
     --------------------------------------------------------- */
  if (finePointer.matches) {
    const cursor = $(".cursor");
    const label = $(".cursor__label");
    const LABELS = { explore: "EXPLORE", drag: "DRAG", view: "VIEW" };
    let x = -100, y = -100, cx = -100, cy = -100;
    addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
    const loop = () => {
      cx = lerp(cx, x, 0.2);
      cy = lerp(cy, y, 0.2);
      cursor.style.setProperty("--cx", `${cx.toFixed(1)}px`);
      cursor.style.setProperty("--cy", `${cy.toFixed(1)}px`);
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener("mouseover", (e) => {
      const t = e.target.closest("[data-cursor]");
      const onButton = e.target.closest("button, .round-btn");
      if (t && !onButton) {
        label.textContent = LABELS[t.dataset.cursor] || "";
        cursor.classList.add("is-active");
        cursor.classList.toggle("is-light", !!t.closest(".section--dark, .featured"));
      } else {
        cursor.classList.remove("is-active");
      }
    });
    document.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
  }

  /* ---------------------------------------------------------
     Newsletter (front-end validation — connect to your ESP)
     --------------------------------------------------------- */
  const form = $("#newsletter");
  const msg = $("#newsletterMsg");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    msg.className = `newsletter__msg ${ok ? "is-ok" : "is-error"}`;
    msg.textContent = ok ? "Thank you — you're on the list." : "Please enter a valid email address.";
    if (ok) form.reset();
  });

  $("#year").textContent = new Date().getFullYear();
})();
