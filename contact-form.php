<?php
declare(strict_types=1);

/**
 * Gestore del form di contatto (vendi-casa.html, compra-casa.html).
 * Invia l'email a info@lecasediluigi.com con Reply-To impostato
 * sull'indirizzo del mittente, cosi' rispondere dall'inbox funziona
 * come su una mail normale.
 */

$TO_EMAIL = 'info@lecasediluigi.com';
$FROM_EMAIL = 'noreply@lecasediluigi.com';
$REDIRECT_OK = '/grazie.html';

function redirect_back(string $status): void
{
    $referer = $_SERVER['HTTP_REFERER'] ?? '/';
    $separator = strpos($referer, '?') !== false ? '&' : '?';
    header('Location: ' . $referer . $separator . 'form=' . $status);
    exit;
}

function clean_header_value(string $value): string
{
    // Rimuove ritorni a capo per prevenire header injection.
    return trim(str_replace(["\r", "\n"], '', $value));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /');
    exit;
}

// Honeypot: campo nascosto che un utente reale non compila mai.
if (!empty($_POST['website'])) {
    exit; // silenzioso, non da' indizi ai bot
}

$nome = trim((string) ($_POST['nome'] ?? ''));
$telefono = trim((string) ($_POST['telefono'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$messaggio = trim((string) ($_POST['messaggio'] ?? ''));
$origine = trim((string) ($_POST['origine'] ?? 'Sito web'));

if ($nome === '' || $email === '' || $messaggio === '') {
    redirect_back('error');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    redirect_back('error');
}

$emailClean = clean_header_value($email);
$nomeClean = clean_header_value($nome);

$subject = 'Nuovo contatto dal sito - ' . $origine;

$body = "Nuova richiesta dal form di contatto del sito.\n\n";
$body .= "Nome: {$nome}\n";
$body .= "Telefono: " . ($telefono !== '' ? $telefono : '(non fornito)') . "\n";
$body .= "Email: {$email}\n";
$body .= "Pagina: {$origine}\n\n";
$body .= "Messaggio:\n{$messaggio}\n";

$headers = [];
$headers[] = 'From: Sito lecasediluigi.com <' . $FROM_EMAIL . '>';
$headers[] = 'Reply-To: ' . $nomeClean . ' <' . $emailClean . '>';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'X-Mailer: PHP/' . phpversion();

$sent = mail($TO_EMAIL, $subject, $body, implode("\r\n", $headers));

if ($sent) {
    header('Location: ' . $REDIRECT_OK);
    exit;
}

redirect_back('error');
