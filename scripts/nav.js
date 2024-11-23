const hamburger= document.getElementById("hamburger");
const navigationBar = document.getElementById("navBar");
const navLogo1 = document.getElementById("logo-1");
const navLogo2 = document.getElementById("logo-2");
const link1= document.getElementById("link-1");
const link2= document.getElementById("link-2");
const link3= document.getElementById("link-3");



function navBar() {
    void(0);
      navigationBar.classList.toggle("responsive");
      navLogo1.classList.toggle("hide");
      navLogo2.classList.toggle("hide");
}

function links() {
        if(navigationBar.classList.contains("responsive")) {
            navigationBar.classList.remove("responsive");
        }
    }

link1.addEventListener("click", links);
link2.addEventListener("click", links);
link3.addEventListener("click", links);


hamburger.addEventListener("click", navBar); 





