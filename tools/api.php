<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function reply(int $status, array $body): never {
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_SLASHES);
    exit;
}
$configuration = require __DIR__ . '/server-config.php';
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$scheme = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http';
$sameOrigin = $scheme . '://' . ($_SERVER['HTTP_HOST'] ?? '');
$allowed = $origin !== '' && ($origin === $sameOrigin || in_array($origin, $configuration['allowed_origins'], true));
header('Vary: Origin');
if ($origin !== '' && !$allowed) reply(403, ['error'=>'origin']);
if ($allowed) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if (!$allowed) reply(403, ['error'=>'origin']);
    http_response_code(204); exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    reply(405, ['error'=>'method']);
}
// JSON requests cannot be submitted by a cross-origin HTML form.
if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') reply(415, ['error'=>'format']);
if (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site' && !$allowed) reply(403, ['error'=>'origin']);
$raw = file_get_contents('php://input', false, null, 0, 8193);
if (strlen($raw) > 8192) reply(413, ['error'=>'invalid']);
$input = json_decode($raw, true);
$url = is_array($input) && is_string($input['url'] ?? null) ? trim($input['url']) : '';
$parts = parse_url($url);
if (strlen($url) > 2048 || preg_match('/[\x00-\x20\x7f]/', $url) || !filter_var($url, FILTER_VALIDATE_URL) || !in_array(strtolower($parts['scheme'] ?? ''), ['http','https'], true) || isset($parts['user']) || isset($parts['pass'])) reply(422, ['error'=>'invalid']);
$host = strtolower($parts['host'] ?? '');
if (!str_contains($host,'.') || $host === 'localhost' || str_ends_with($host,'.local') || (filter_var(trim($host,'[]'), FILTER_VALIDATE_IP) && !filter_var(trim($host,'[]'), FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE))) reply(422, ['error'=>'invalid']);
try {
    require __DIR__ . '/store.php';
    $db = link_database();
    $db->exec('BEGIN IMMEDIATE');
    $now=time();
    $db->prepare('DELETE FROM links WHERE expires < ?')->execute([$now]);
    $salt=$db->query("SELECT value FROM settings WHERE name='salt'")->fetchColumn();
    $client=hash_hmac('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown', $salt);
    $count=$db->prepare('SELECT COUNT(*) FROM links WHERE client=? AND created>?');
    $count->execute([$client,$now-3600]);
    $daily=$db->prepare('SELECT COUNT(*) FROM links WHERE created>?');
    $daily->execute([$now-86400]);
    if ((int)$count->fetchColumn() >= 20 || (int)$daily->fetchColumn() >= 500) {
        $db->exec('ROLLBACK'); header('Retry-After: 3600'); reply(429,['error'=>'limit']);
    }
    if ((int)$db->query('SELECT COUNT(*) FROM links')->fetchColumn() >= 10000) {
        $db->exec('ROLLBACK'); reply(503,['error'=>'capacity']);
    }
    $code=rtrim(strtr(base64_encode(random_bytes(6)), '+/', '-_'), '=');
    $insert=$db->prepare('INSERT INTO links(code,url,created,expires,client) VALUES(?,?,?,?,?)');
    $expires=$now+365*86400;
    $insert->execute([$code,$url,$now,$expires,$client]);
    $db->exec('COMMIT');
    reply(201,['code'=>$code,'expires'=>gmdate('Y-m-d',$expires)]);
} catch (Throwable $e) {
    error_log('NR shortener: '.$e->getMessage());
    reply(503,['error'=>'unavailable']);
}
