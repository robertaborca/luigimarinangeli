
// SCROLLING SHADOW
var navBar = document.getElementById("navBar");
            window.onscroll = function() {
              if (window.scrollY > 22) {
                navBar.classList.add("scrolled");
              } else {
                navBar.classList.remove("scrolled");
              }
            };

// READ MORE BTNS
document.querySelectorAll("button.read-more").forEach(function(button) {
button.addEventListener( 'click' , changeClass);
});
            
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
}


 
var swiper = new Swiper(".slide-content", {
  slidesPerView: 3,
  spaceBetween: 25,
  loop: true,
  centerSlide: 'true',
  fade: 'true',
  grabCursor: 'true',
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
    dynamicBullets: true,
  },
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },

  breakpoints:{
      0: {
          slidesPerView: 1,
      },
      520: {
          slidesPerView: 2,
      },
      950: {
          slidesPerView: 3,
      },
  },
});
