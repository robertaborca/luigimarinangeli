// READ MORE BTN CHISONO
var buttons1 = document.getElementById("read-more");
buttons1.addEventListener("click", readMore);
function readMore() {
  var content1 = document.getElementById("more");
 content1.classList.toggle("show");
  var buttonText1 = content1.classList.contains("show") ? "Mostra meno -" : "Mostra di più +";
  buttons1.innerHTML = buttonText1;

  dots1();
}

function dots1() {
  var dots1 = document.getElementById("dots");
  dots1.classList.toggle("hidden-dots");
}





// READ MORE BTNS SERVIZI
document.querySelectorAll("button.read-more").forEach(function(button) {
button.addEventListener( 'click' , changeClass);
});

function dots() {
  var dots = document.getElementsByClassName("dots");
  for (var i = 0; i < dots.length; i++) {
    dots[i].classList.toggle("hidden-dots");
  }
}

            
function changeClass() {
  var content = document.getElementsByClassName("more");
  var buttons = document.querySelectorAll("button.read-more");

  for (var i = 0; i < content.length; i++) {
    content[i].classList.toggle("show");
    var buttonText = content[i].classList.contains("show") ? "Mostra meno -" : "Mostra di più +";
    buttons.forEach(function(button) {
      button.innerHTML = buttonText;
    });
  }

  dots();
}

// SWIPER IMMOBILI
window.addEventListener("load", () => {
var swiper = new Swiper(".slide-content", {
  slidesPerView: 3,
  spaceBetween: 25,
  centerSlide: 'true',
  fade: 'true',
  grabCursor: 'true',
  //pagination: {
   // el: ".swiper-pagination",
   // clickable: true,
    //dynamicBullets: true,
  //},
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },

  breakpoints:{
      0: {
          slidesPerView: 1,
      },
      650: {
          slidesPerView: 2,
      },
      950: {
          slidesPerView: 3,
      },
  }
  
});
});

// // REVIEWS
// class ReviewsCarousel {
//             constructor() {
//                 this.currentIndex = 0;
//                 this.reviewsPerView = this.calculateReviewsPerView();
//                 this.totalReviews = 8; // Number of review cards
//                 this.maxIndex = Math.max(0, this.totalReviews - this.reviewsPerView);
//                 this.autoplayInterval = null;
                
//                 this.init();
//                 this.setupEventListeners();
//                 this.startAutoplay();
//             }

//             calculateReviewsPerView() {
//                 const width = window.innerWidth;
//                 if (width >= 1200) return 3;
//                 if (width >= 768) return 2;
//                 return 1;
//             }

//             init() {
//                 this.renderDots();
//                 this.updateCarousel();
//             }

//             renderDots() {
//                 const dotsContainer = document.getElementById('carouselDots');
//                 const totalDots = this.maxIndex + 1;
//                 dotsContainer.innerHTML = Array.from({length: totalDots}, (_, i) => 
//                     `<div class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`
//                 ).join('');
//             }

//             updateCarousel() {
//                 const grid = document.getElementById('reviewsGrid');
//                 const cardWidth = 350 + 25; // card width + gap
//                 grid.style.transform = `translateX(-${this.currentIndex * cardWidth}px)`;
                
//                 this.updateDots();
//                 this.updateButtons();
//             }

//             updateDots() {
//                 document.querySelectorAll('.dot').forEach((dot, index) => {
//                     dot.classList.toggle('active', index === this.currentIndex);
//                 });
//             }

//             updateButtons() {
//                 const prevBtn = document.getElementById('prevBtn');
//                 const nextBtn = document.getElementById('nextBtn');
                
//                 prevBtn.disabled = this.currentIndex === 0;
//                 nextBtn.disabled = this.currentIndex === this.maxIndex;
//             }

//             next() {
//                 if (this.currentIndex < this.maxIndex) {
//                     this.currentIndex++;
//                     this.updateCarousel();
//                     this.resetAutoplay();
//                 }
//             }

//             prev() {
//                 if (this.currentIndex > 0) {
//                     this.currentIndex--;
//                     this.updateCarousel();
//                     this.resetAutoplay();
//                 }
//             }

//             goToSlide(index) {
//                 this.currentIndex = Math.min(Math.max(0, index), this.maxIndex);
//                 this.updateCarousel();
//                 this.resetAutoplay();
//             }

//             setupEventListeners() {
//                 document.getElementById('nextBtn').addEventListener('click', () => this.next());
//                 document.getElementById('prevBtn').addEventListener('click', () => this.prev());
                
//                 document.getElementById('carouselDots').addEventListener('click', (e) => {
//                     if (e.target.classList.contains('dot')) {
//                         const index = parseInt(e.target.dataset.index);
//                         this.goToSlide(index);
//                     }
//                 });

//                 window.addEventListener('resize', () => {
//                     const newReviewsPerView = this.calculateReviewsPerView();
//                     if (newReviewsPerView !== this.reviewsPerView) {
//                         this.reviewsPerView = newReviewsPerView;
//                         this.maxIndex = Math.max(0, this.totalReviews - this.reviewsPerView);
//                         this.currentIndex = Math.min(this.currentIndex, this.maxIndex);
//                         this.renderDots();
//                         this.updateCarousel();
//                     }
//                 });

//                 // Touch/swipe support for mobile
//                 let startX = 0;
//                 let isDragging = false;

//                 const grid = document.getElementById('reviewsGrid');
                
//                 grid.addEventListener('touchstart', (e) => {
//                     startX = e.touches[0].clientX;
//                     isDragging = true;
//                 });

//                 grid.addEventListener('touchmove', (e) => {
//                     if (!isDragging) return;
//                     e.preventDefault();
//                 });

//                 grid.addEventListener('touchend', (e) => {
//                     if (!isDragging) return;
//                     isDragging = false;
                    
//                     const endX = e.changedTouches[0].clientX;
//                     const diffX = startX - endX;
                    
//                     if (Math.abs(diffX) > 50) {
//                         if (diffX > 0) {
//                             this.next();
//                         } else {
//                             this.prev();
//                         }
//                     }
//                 });
//             }

//             startAutoplay() {
//                 this.autoplayInterval = setInterval(() => {
//                     if (this.currentIndex >= this.maxIndex) {
//                         this.currentIndex = 0;
//                     } else {
//                         this.currentIndex++;
//                     }
//                     this.updateCarousel();
//                 }, 5000); // Change slide every 5 seconds
//             }

//             resetAutoplay() {
//                 if (this.autoplayInterval) {
//                     clearInterval(this.autoplayInterval);
//                     this.startAutoplay();
//                 }
//             }
//         }

//         // Initialize carousel when DOM is loaded
//         document.addEventListener('DOMContentLoaded', () => {
//             new ReviewsCarousel();
//         });

