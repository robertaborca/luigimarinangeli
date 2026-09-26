(function () {
    "use strict";

    /**
     * Eventi GA4 di conversione, in un unico file incluso su tutte le pagine.
     *
     * Il tag GA4 non e' inline nelle pagine: lo carica cookie-consent.js solo
     * dopo il consenso. Quindi window.gtag puo' non esistere, e in quel caso
     * l'evento va scartato senza fallback: tracciare senza consenso e'
     * esattamente cio' che il banner promette di non fare.
     */

    var CONSENT_READY_EVENT = "lecasediluigi:analytics-ready";

    function gtagPronto() {
        return typeof window.gtag === "function";
    }

    function track(nome, parametri) {
        if (!gtagPronto()) return false;
        window.gtag("event", nome, parametri);
        return true;
    }

    function pagePath() {
        return window.location.pathname + window.location.search;
    }

    /**
     * Nome dell'immobile, solo sulle schede /CASE/. Letto dall'h1 della
     * scheda, con og:title come riserva. Se non si trova, il parametro non
     * viene inviato: meglio assente che inventato.
     *
     * GA4 scarta i valori di parametro oltre i 100 caratteri: gli h1 piu'
     * lunghi delle schede sfiorano gli 85, quindi si taglia per sicurezza.
     */
    var LUNGHEZZA_MAX_PARAMETRO = 100;

    function nomeImmobile() {
        if (window.location.pathname.indexOf("/CASE/") === -1) return null;
        var nome = null;
        var h1 = document.querySelector("h1");
        if (h1) {
            var testo = h1.textContent.replace(/\s+/g, " ").trim();
            if (testo) nome = testo;
        }
        if (!nome) {
            var og = document.querySelector('meta[property="og:title"]');
            if (og && og.content) nome = og.content.trim();
        }
        return nome ? nome.slice(0, LUNGHEZZA_MAX_PARAMETRO) : null;
    }

    function parametriBase() {
        var p = { page_path: pagePath() };
        var immobile = nomeImmobile();
        if (immobile) p.nome_immobile = immobile;
        return p;
    }

    /**
     * Mappa href -> nome evento. Nessun match = nessun evento.
     *
     * Su WhatsApp si filtra per wa.me e api.whatsapp.com/send: il link
     * whatsapp.com/legal/privacy-policy nel footer della privacy policy non
     * e' un contatto e non deve contare come tale.
     */
    function eventoPerHref(href) {
        if (/^tel:/i.test(href)) return "click_telefono";
        if (/^https?:\/\/(wa\.me|api\.whatsapp\.com\/send)/i.test(href)) return "click_whatsapp";
        if (/^https?:\/\/([a-z0-9-]+\.)*calendly\.com(\/|$)/i.test(href)) return "click_calendly";
        if (/^https?:\/\/([a-z0-9-]+\.)*paypal\.(com|me)(\/|$)/i.test(href)) return "click_paypal";
        return null;
    }

    /**
     * Un solo listener in capture sul document: intercetta anche i link
     * aggiunti dopo il caricamento (galleria immobili, carousel, banner
     * cookie) senza doverli ri-agganciare.
     */
    document.addEventListener("click", function (evento) {
        var nodo = evento.target;
        if (!nodo || typeof nodo.closest !== "function") return;

        // Aggancio esplicito per bottoni che non sono link (es. un bottone
        // PayPal generato da uno script esterno): data-analytics-event="..."
        var esplicito = nodo.closest("[data-analytics-event]");
        if (esplicito) {
            track(esplicito.getAttribute("data-analytics-event"), parametriBase());
            return;
        }

        var link = nodo.closest("a[href]");
        if (!link) return;

        var evt = eventoPerHref(link.getAttribute("href") || "");
        if (evt) track(evt, parametriBase());
    }, true);

    /**
     * generate_lead: solo sulla conferma di invio riuscito, non al click su
     * "invia". contact-form.php redirige su /grazie.html soltanto dopo che
     * PHPMailer ha accettato il messaggio; in caso di errore torna alla
     * pagina di partenza con ?form=error. Quindi il caricamento di
     * grazie.html e' la conferma di successo.
     */
    function inviaGenerateLead() {
        var parametri = parametriBase();

        // Da quale pagina e' partito il form: utile per capire se converte
        // piu' vendi-casa o compra-casa. Solo se il referrer e' interno.
        try {
            if (document.referrer) {
                var ref = new URL(document.referrer);
                if (ref.host === window.location.host) parametri.form_origine = ref.pathname;
            }
        } catch (e) {
            /* referrer non parsabile: si invia l'evento senza il parametro */
        }

        return track("generate_lead", parametri);
    }

    function avvia() {
        if (!/\/grazie\.html$/.test(window.location.pathname)) return;
        if (inviaGenerateLead()) return;

        // Consenso non ancora dato: se l'utente accetta proprio su questa
        // pagina, cookie-consent.js segnala che gtag e' disponibile e
        // l'evento parte allora, una volta sola.
        document.addEventListener(CONSENT_READY_EVENT, function inviaUnaVolta() {
            document.removeEventListener(CONSENT_READY_EVENT, inviaUnaVolta);
            inviaGenerateLead();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", avvia);
    } else {
        avvia();
    }
})();
