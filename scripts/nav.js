const hamburger= document.getElementById("hamburger");
const navigationBar = document.getElementById("navBar");
const link1= document.getElementById("link-1");
const link2= document.getElementById("link-2");
const link3= document.getElementById("link-3");



function navBar() {
      navigationBar.classList.toggle("responsive");
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





