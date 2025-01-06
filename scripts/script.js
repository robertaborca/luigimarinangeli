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

