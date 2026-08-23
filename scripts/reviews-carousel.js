class ReviewsCarousel {
    constructor() {
        this.currentIndex = 0;
        this.reviewsPerView = this.calculateReviewsPerView();
        this.totalReviews = 8; // Number of review cards
        this.maxIndex = Math.max(0, this.totalReviews - this.reviewsPerView);
        this.autoplayInterval = null;

        this.init();
        this.setupEventListeners();
    }

    calculateReviewsPerView() {
        const width = window.innerWidth;
        if (width >= 1200) return 3;
        if (width >= 768) return 1;
        return 1;
    }

    init() {
        this.measureCardWidth();
        this.renderDots();
        this.updateCarousel();
    }

    measureCardWidth() {
        // Read layout before any of the writes below invalidate it,
        // to avoid forcing a synchronous reflow.
        const card = document.querySelector('.review-card');
        this.cardWidth = card.offsetWidth + 25; // card width + gap
    }

    renderDots() {
        const dotsContainer = document.getElementById('carouselDots');
        const totalDots = this.maxIndex + 1;
        dotsContainer.innerHTML = Array.from({length: totalDots}, (_, i) =>
            `<div class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`
        ).join('');
    }

    updateCarousel() {
        const grid = document.getElementById('reviewsGrid');
        grid.style.transform = `translateX(-${this.currentIndex * this.cardWidth}px)`;

        this.updateDots();
        this.updateButtons();
    }

    updateDots() {
        document.querySelectorAll('#carouselDots .dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }

    updateButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        prevBtn.disabled = this.currentIndex === 0;
        nextBtn.disabled = this.currentIndex === this.maxIndex;
    }

    next() {
        if (this.currentIndex < this.maxIndex) {
            this.currentIndex++;
            this.updateCarousel();
        }
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateCarousel();
        }
    }

    goToSlide(index) {
        this.currentIndex = Math.min(Math.max(0, index), this.maxIndex);
        this.updateCarousel();
    }

    setupEventListeners() {
        document.getElementById('nextBtn').addEventListener('click', () => this.next());
        document.getElementById('prevBtn').addEventListener('click', () => this.prev());

        document.getElementById('carouselDots').addEventListener('click', (e) => {
            if (e.target.classList.contains('dot')) {
                const index = parseInt(e.target.dataset.index);
                this.goToSlide(index);
            }
        });

        window.addEventListener('resize', () => {
            const newReviewsPerView = this.calculateReviewsPerView();
            if (newReviewsPerView !== this.reviewsPerView) {
                this.reviewsPerView = newReviewsPerView;
                this.maxIndex = Math.max(0, this.totalReviews - this.reviewsPerView);
                this.currentIndex = Math.min(this.currentIndex, this.maxIndex);
                this.measureCardWidth();
                this.renderDots();
                this.updateCarousel();
            }
        });

        // Touch/swipe support for mobile
        let startX = 0;
        let isDragging = false;

        const grid = document.getElementById('reviewsGrid');

        grid.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
        });

        grid.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
        });

        grid.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;

            const endX = e.changedTouches[0].clientX;
            const diffX = startX - endX;

            if (Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    this.next();
                } else {
                    this.prev();
                }
            }
        });
    }
}

// Defer construction until the carousel is about to enter the viewport, so
// its setup cost doesn't count against the initial render above the fold.
(function () {
    const grid = document.getElementById('reviewsGrid');
    if (!grid) return;
    function start() {
        new ReviewsCarousel();
    }
    if (typeof IntersectionObserver !== 'undefined') {
        const io = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                io.disconnect();
                start();
            }
        }, { rootMargin: '200px' });
        io.observe(grid);
    } else {
        document.addEventListener('DOMContentLoaded', start);
    }
})();
