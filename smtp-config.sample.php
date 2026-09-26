<?php
// Copia questo file come smtp-config.php UN LIVELLO SOPRA la web root
// (accanto alla cartella pubblica, mai dentro), poi valorizza le
// credenziali reali. smtp-config.php non va mai committato.

return [
    'host' => 'smtp.hostinger.com',
    'port' => 465,
    'username' => 'noreply@lecasediluigi.com',
    'password' => 'INSERISCI_QUI_LA_PASSWORD',

    // Chiave con cui form-token.php firma il token temporale del form
    // contatti. Stringa casuale lunga, diversa dalla password SMTP.
    // Per generarla:  php -r "echo bin2hex(random_bytes(32));"
    'form_token_key' => 'INSERISCI_QUI_UNA_CHIAVE_CASUALE_LUNGA',
];
