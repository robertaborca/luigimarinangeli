const hamburger= document.getElementById("hamburger");
const navigationBar = document.getElementById("navBar");
const link1= document.getElementById("link-1");
const link2= document.getElementById("link-2");
const link3= document.getElementById("link-3");
const link4= document.getElementById("link-4");



function navBar() {
    void(0);
      navigationBar.classList.toggle("responsive");
      hamburger.setAttribute("aria-expanded", navigationBar.classList.contains("responsive"));
}

function links() {
        if(navigationBar.classList.contains("responsive")) {
            navigationBar.classList.remove("responsive");
            hamburger.setAttribute("aria-expanded", "false");
        }
    }

link1.addEventListener("click", links);
link2.addEventListener("click", links);
link3.addEventListener("click", links);
link4.addEventListener("click", links);


hamburger.addEventListener("click", navBar); 





