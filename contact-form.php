<?php
declare(strict_types=1);

/**
 * Gestore del form di contatto (vendi-casa.html, compra-casa.html).
 * Invia l'email a info@lecasediluigi.com con Reply-To impostato
 * sull'indirizzo del mittente, cosi' rispondere dall'inbox funziona
 * come su una mail normale.
 */

require_once __DIR__ . '/lib/PHPMailer/Exception.php';
require_once __DIR__ . '/lib/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/lib/PHPMailer/SMTP.php';

use PHPMailer\PHPMailer\Exception as PHPMailerException;
use PHPMailer\PHPMailer\PHPMailer;

$TO_EMAIL = 'info@lecasediluigi.com';
$FROM_EMAIL = 'noreply@lecasediluigi.com';
$REDIRECT_OK = '/grazie.html';

function redirect_back(string $status): void
{
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    $refererHost = parse_url($referer, PHP_URL_HOST);
    if ($refererHost === null || !preg_match('/(^|\.)lecasediluigi\.com$/i', $refererHost)) {
        $referer = '/';
    }

    // Spezza il fragment (es. #contatti) prima di appendere la query,
    // altrimenti finisce dentro al fragment e nessuno lo legge piu'.
    $fragment = '';
    $hashPos = strpos($referer, '#');
    if ($hashPos !== false) {
        $fragment = substr($referer, $hashPos);
        $referer = substr($referer, 0, $hashPos);
    }

    $separator = strpos($referer, '?') !== false ? '&' : '?';
    header('Location: ' . $referer . $separator . 'form=' . $status . $fragment);
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
if (!empty($_POST['hp_riferimento'])) {
    header('Location: ' . $REDIRECT_OK);
    exit;
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
$origineClean = clean_header_value($origine);

$subject = 'Nuovo contatto dal sito - ' . $origineClean;

$body = "Nuova richiesta dal form di contatto del sito.\n\n";
$body .= "Nome: {$nome}\n";
$body .= "Telefono: " . ($telefono !== '' ? $telefono : '(non fornito)') . "\n";
$body .= "Email: {$email}\n";
$body .= "Pagina: {$origine}\n\n";
$body .= "Messaggio:\n{$messaggio}\n";

$configPath = dirname(__DIR__) . '/smtp-config.php';
if (!is_readable($configPath)) {
    error_log('contact-form: smtp-config.php mancante o non leggibile');
    redirect_back('error');
}
$smtp = require $configPath;

if (
    !is_array($smtp)
    || empty($smtp['host'])
    || empty($smtp['port'])
    || empty($smtp['username'])
    || empty($smtp['password'])
) {
    error_log('contact-form: smtp-config.php non contiene tutte le chiavi richieste (host, port, username, password)');
    redirect_back('error');
}

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = $smtp['host'];
    $mail->Port = $smtp['port'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->SMTPAuth = true;
    $mail->Username = $smtp['username'];
    $mail->Password = $smtp['password'];
    $mail->CharSet = 'UTF-8';
    $mail->Timeout = 10;
    $mail->XMailer = ' ';

    $mail->setFrom($FROM_EMAIL, 'Sito lecasediluigi.com');
    $mail->addAddress($TO_EMAIL);
    $mail->addReplyTo($emailClean, $nomeClean);

    $mail->isHTML(false);
    $mail->Subject = $subject;
    $mail->Body = $body;

    $mail->send();

    header('Location: ' . $REDIRECT_OK);
    exit;
} catch (PHPMailerException $e) {
    error_log('contact-form: invio fallito - ' . $mail->ErrorInfo);
    redirect_back('error');
}
