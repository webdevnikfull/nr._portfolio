<?php
declare(strict_types=1);
header('Cache-Control: no-store');
header('Referrer-Policy: no-referrer');
header('X-Content-Type-Options: nosniff');
$code=$_GET['c'] ?? '';
$status=404;
if (is_string($code) && preg_match('/^[A-Za-z0-9_-]{8}$/D',$code)) {
    try {
        require __DIR__.'/tools/store.php';
        $db=link_database();
        $query=$db->prepare('SELECT url,expires FROM links WHERE code=?');
        $query->execute([$code]);
        $link=$query->fetch(PDO::FETCH_ASSOC);
        if ($link && (int)$link['expires'] >= time()) {
            header('Location: '.$link['url'],true,302); exit;
        }
        if ($link) $status=410;
    } catch (Throwable $e) { $status=503; error_log('NR redirect: '.$e->getMessage()); }
}
http_response_code($status);
header('Content-Type: text/html; charset=utf-8');
$title=$status===503?'Chwilowa przerwa / Temporarily unavailable':'Link niedostępny / Link unavailable';
?>
<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title><?= $title ?></title><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="tools/tools.css"><main class="tool-main"><p class="eyebrow">NR. LINKS / <?= $status ?></p><h1><?= $title ?></h1><p>Sprawdź adres lub spróbuj ponownie później.</p><p>Check the address or try again later.</p><a class="button button-primary" href="tools/short.html">Skróć nowy link / Create a link ↗</a></main></html>
