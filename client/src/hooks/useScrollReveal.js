import { useEffect } from "react";

/**
 * Adds `.is-visible` to every `.reveal` element as it scrolls into view.
 *
 * A MutationObserver keeps picking up elements that mount later (API data,
 * route changes), so pages do not need to wire up individual observers.
 */
export default function useScrollReveal() {
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const showAll = () => {
      document
        .querySelectorAll(".reveal")
        .forEach((el) => el.classList.add("is-visible"));
    };

    if (reduceMotion || !("IntersectionObserver" in window)) {
      showAll();
      return undefined;
    }

    const observed = new WeakSet();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    const observeNew = () => {
      const viewportHeight = window.innerHeight || 0;

      document.querySelectorAll(".reveal").forEach((el) => {
        if (observed.has(el) || el.classList.contains("is-visible")) return;
        observed.add(el);

        // Content already in (or above) the first viewport is shown right
        // away. This also keeps the page usable when observers are throttled
        // in background tabs.
        const rect = el.getBoundingClientRect();
        if (rect.top < viewportHeight * 0.92) {
          el.classList.add("is-visible");
          return;
        }

        observer.observe(el);
      });
    };

    observeNew();

    const mutations = new MutationObserver(observeNew);
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);
}
