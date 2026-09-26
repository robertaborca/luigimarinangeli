(function () {
    "use strict";

    /**
     * Inietta nel form contatti il token temporale firmato da form-token.php.
     *
     * Le pagine sono statiche, quindi il timestamp non puo' essere nel markup:
     * va chiesto al server. contact-form.php rifiuta gli invii senza token
     * valido, che sono quelli dei bot che postano diretti sull'endpoint.
     */

    var ENDPOINT = "/form-token.php";
    var CAMPO_TS = "form_ts";
    var CAMPO_SIG = "form_sig";

    function forms() {
        return document.querySelectorAll("form.contact-form");
    }

    function campoNascosto(form, nome) {
        var esistente = form.querySelector('input[name="' + nome + '"]');
        if (esistente) return esistente;
        var input = document.createElement("input");
        input.type = "hidden";
        input.name = nome;
        form.appendChild(input);
        return input;
    }

    function applica(token) {
        var elenco = forms();
        for (var i = 0; i < elenco.length; i++) {
            campoNascosto(elenco[i], CAMPO_TS).value = String(token.ts);
            campoNascosto(elenco[i], CAMPO_SIG).value = String(token.sig);
        }
    }

    function richiedi() {
        if (!forms().length) return;
        fetch(ENDPOINT, { cache: "no-store", credentials: "omit" })
            .then(function (r) {
                if (!r.ok) throw new Error("HTTP " + r.status);
                return r.json();
            })
            .then(function (token) {
                if (token && token.ts && token.sig) applica(token);
            })
            .catch(function () {
                /* Token non ottenuto: il POST verrà rifiutato con il messaggio
                   "ricarica la pagina", che è il comportamento voluto. */
            });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", richiedi);
    } else {
        richiedi();
    }

    // La finestra di validità è di 2 ore. Chi lascia la scheda aperta a lungo e
    // torna dopo troverebbe un token scaduto: se ne prende uno nuovo quando la
    // pagina torna visibile.
    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") richiedi();
    });
})();
