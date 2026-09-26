<?php
declare(strict_types=1);

/**
 * Emette un token temporale firmato per il form di contatto.
 *
 * Le pagine del sito sono HTML statico, quindi il timestamp non puo' essere
 * stampato nel markup: lo chiede il browser al caricamento della pagina e lo
 * rimanda insieme al POST. contact-form.php verifica firma e finestra
 * temporale e scarta gli invii istantanei o troppo vecchi, cioe' i bot che
 * postano direttamente sull'endpoint senza aver mai aperto il form.
 *
 * Nella risposta esce solo il timestamp e il suo HMAC: la chiave non lascia
 * mai il server.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');

function fallisci(string $motivo): void
{
    error_log('form-token: ' . $motivo);
    http_response_code(500);
    echo json_encode(['error' => 'unavailable']);
    exit;
}

$configPath = dirname(__DIR__) . '/smtp-config.php';
if (!is_readable($configPath)) {
    fallisci('smtp-config.php mancante o non leggibile');
}

$config = require $configPath;
if (!is_array($config) || empty($config['form_token_key'])) {
    fallisci('smtp-config.php non contiene form_token_key');
}

$ts = time();
echo json_encode([
    'ts' => $ts,
    'sig' => hash_hmac('sha256', (string) $ts, (string) $config['form_token_key']),
], JSON_THROW_ON_ERROR);
