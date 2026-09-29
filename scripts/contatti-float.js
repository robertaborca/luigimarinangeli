(function () {
    "use strict";

    /**
     * Bottoni flottanti WhatsApp, Instagram e Facebook.
     *
     * Su desktop le tre bolle sono sempre visibili e il bottone principale
     * e' nascosto dal CSS. Sotto i 768px le bolle si aprono dal bottone
     * principale. La classe js-pronto la mette solo questo script: senza JS
     * il CSS lascia le bolle visibili anche su mobile, cosi' i contatti non
     * spariscono mai.
     */
    var box = document.querySelector("[data-contatti-float]");
    if (!box) return;

    var toggle = box.querySelector(".contatti-float__toggle");
    var menu = box.querySelector(".contatti-float__menu");
    if (!toggle || !menu) return;

    function aperto() {
        return toggle.getAttribute("aria-expanded") === "true";
    }

    function imposta(apri) {
        toggle.setAttribute("aria-expanded", apri ? "true" : "false");
        box.classList.toggle("is-open", apri);
    }

    toggle.addEventListener("click", function () {
        imposta(!aperto());
    });

    // Dopo la scelta di una bolla il menu si chiude: il link si apre in una
    // nuova scheda e al ritorno la pagina deve essere com'era.
    menu.addEventListener("click", function (evento) {
        if (evento.target.closest && evento.target.closest("a")) imposta(false);
    });

    document.addEventListener("click", function (evento) {
        if (aperto() && !box.contains(evento.target)) imposta(false);
    });

    document.addEventListener("keydown", function (evento) {
        if (evento.key !== "Escape" || !aperto()) return;
        imposta(false);
        toggle.focus();
    });

    box.classList.add("js-pronto");
})();
