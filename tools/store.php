<?php
declare(strict_types=1);
function link_database(): PDO {
    // Keep persistent data outside public_html, including on shared hosting.
    $directory = getenv('NR_LINK_DATA') ?: dirname(__DIR__, 2) . '/nr-link-data';
    if (!is_dir($directory) && !mkdir($directory,0700,true) && !is_dir($directory)) throw new RuntimeException('Cannot create private storage.');
    $db=new PDO('sqlite:'.$directory.'/links.sqlite',null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    $db->exec('PRAGMA busy_timeout=5000');
    $db->exec('CREATE TABLE IF NOT EXISTS links(code TEXT PRIMARY KEY,url TEXT NOT NULL,created INTEGER NOT NULL,expires INTEGER NOT NULL,client TEXT NOT NULL)');
    $db->exec('CREATE INDEX IF NOT EXISTS links_client ON links(client,created)');
    $db->exec('CREATE INDEX IF NOT EXISTS links_created ON links(created)');
    $db->exec('CREATE TABLE IF NOT EXISTS settings(name TEXT PRIMARY KEY,value TEXT NOT NULL)');
    $db->prepare('INSERT OR IGNORE INTO settings(name,value) VALUES(?,?)')->execute(['salt',bin2hex(random_bytes(32))]);
    return $db;
}
