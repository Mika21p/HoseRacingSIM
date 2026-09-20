(function () {
  // Register before the homepage is rendered, including when an image fails from cache.
  document.addEventListener("error", (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.matches(".home-banner-art[data-fallback-src]")) return;

    const fallback = image.dataset.fallbackSrc;
    if (image.dataset.fallbackAttempted || image.currentSrc === new URL(fallback, document.baseURI).href) {
      // Keep the banner background, title and controls usable if both formats fail.
      image.hidden = true;
      return;
    }

    image.dataset.fallbackAttempted = "true";
    const picture = image.closest("picture");
    if (picture) picture.replaceWith(image);
    image.removeAttribute("srcset");
    image.removeAttribute("sizes");
    image.src = fallback;
  }, true);
})();
