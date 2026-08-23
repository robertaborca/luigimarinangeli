(function () {
    const viewport = document.getElementById("propertyCarouselViewport");
    const list = document.getElementById("propertyCarouselList");
    if (!viewport || !list) return;

    function init() {
        const slides = Array.from(list.children);
        const prevBtn = document.getElementById("propertyPrevBtn");
        const nextBtn = document.getElementById("propertyNextBtn");
        const dotsContainer = document.getElementById("propertyDots");

        function perView() {
            const w = window.innerWidth;
            if (w >= 950) return 3;
            if (w >= 650) return 2;
            return 1;
        }

        function renderDots() {
            const maxIndex = Math.max(0, slides.length - perView());
            dotsContainer.innerHTML = Array.from({ length: maxIndex + 1 }, (_, i) =>
                `<div class="dot${i === 0 ? " active" : ""}" data-index="${i}"></div>`
            ).join("");
            dotsContainer.querySelectorAll(".dot").forEach((dot) => {
                dot.addEventListener("click", () => {
                    const i = parseInt(dot.dataset.index, 10);
                    if (slides[i]) {
                        viewport.scrollTo({ left: slides[i].offsetLeft, behavior: "smooth" });
                    }
                });
            });
        }

        function updateActiveState() {
            let closest = 0;
            let closestDist = Infinity;
            slides.forEach((slide, i) => {
                const dist = Math.abs(slide.offsetLeft - viewport.scrollLeft);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = i;
                }
            });
            dotsContainer.querySelectorAll(".dot").forEach((dot, i) => {
                dot.classList.toggle("active", i === closest);
            });
            prevBtn.disabled = viewport.scrollLeft <= 1;
            nextBtn.disabled = viewport.scrollLeft >= viewport.scrollWidth - viewport.clientWidth - 1;
        }

        function stepWidth() {
            if (slides.length > 1) {
                return slides[1].offsetLeft - slides[0].offsetLeft;
            }
            return slides[0] ? slides[0].getBoundingClientRect().width : 0;
        }

        function scrollByCards(direction) {
            viewport.scrollBy({ left: direction * stepWidth(), behavior: "smooth" });
        }

        prevBtn.addEventListener("click", () => scrollByCards(-1));
        nextBtn.addEventListener("click", () => scrollByCards(1));

        let scrollTimer;
        viewport.addEventListener("scroll", () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(updateActiveState, 100);
        }, { passive: true });

        let resizeTimer;
        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                updateActiveState();
                renderDots();
            }, 150);
        });

        updateActiveState();
        renderDots();

        // Guard against layout shifting after this point (images finishing
        // load, fonts swapping in, etc.), which would otherwise leave the
        // prev/next buttons stuck in a stale disabled state.
        if (typeof ResizeObserver !== "undefined") {
            const resizeObserver = new ResizeObserver(() => updateActiveState());
            resizeObserver.observe(list);
            resizeObserver.observe(viewport);
        }
        window.addEventListener("load", updateActiveState);
    }

    // Defer setup until the carousel is about to enter the viewport, so its
    // cost doesn't count against the initial render of the page above the fold.
    if (typeof IntersectionObserver !== "undefined") {
        const io = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                io.disconnect();
                init();
            }
        }, { rootMargin: "200px" });
        io.observe(viewport);
    } else {
        init();
    }
})();
