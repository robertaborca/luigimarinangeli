document.addEventListener("DOMContentLoaded", function () {
    var hamburger = document.querySelector(".nav-hamburger--landing");
    var menu = document.querySelector(".nav-menu");
    if (!hamburger || !menu) return;

    hamburger.addEventListener("click", function () {
        var isOpen = menu.classList.toggle("nav-menu--open");
        hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    menu.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            menu.classList.remove("nav-menu--open");
            hamburger.setAttribute("aria-expanded", "false");
        });
    });
});
