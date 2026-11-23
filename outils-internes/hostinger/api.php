<?php
// QG des associés : stockage partagé sur Hostinger (aucun service externe, aucun compte).
// Chaque requête doit porter la clé du lien d'invitation (définie dans config.php).
// Les données sont dans data/qg.json, avec une copie de secours par jour (14 jours gardés).
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

function out(int $status, $body): void { http_response_code($status); echo json_encode($body, JSON_UNESCAPED_UNICODE); exit; }

$config = __DIR__ . '/config.php';
if (!is_file($config)) out(500, ['code' => 'not_configured']);
require $config;
if (!defined('QG_KEY') || strlen(QG_KEY) < 24) out(500, ['code' => 'not_configured']);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, ['code' => 'method_not_allowed']);

$given = $_SERVER['HTTP_X_QG_KEY'] ?? '';
if (!is_string($given) || !hash_equals(QG_KEY, $given)) { usleep(800000); out(401, ['code' => 'bad_key']); }

$raw = file_get_contents('php://input', false, null, 0, 600000);
$req = json_decode((string)$raw, true);
if (!is_array($req)) out(400, ['code' => 'invalid_argument']);
$op = $req['op'] ?? '';

$dir = __DIR__ . '/data';
$file = $dir . '/qg.json';
if (!is_dir($dir) && !mkdir($dir, 0750, true)) out(500, ['code' => 'storage']);
if (!is_file($dir . '/.htaccess')) @file_put_contents($dir . '/.htaccess', "Require all denied\n");

$fh = fopen($dir . '/qg.lock', 'c');
if (!$fh) out(500, ['code' => 'storage']);
flock($fh, $op === 'list' || $op === 'ping' ? LOCK_SH : LOCK_EX);

$items = [];
if (is_file($file)) {
  $items = json_decode((string)file_get_contents($file), true);
  if (!is_array($items)) out(500, ['code' => 'storage', 'message' => 'Fichier de données illisible : restaure une copie de data/.']);
}

function save_items(array $items, string $dir, string $file): void {
  $day = $dir . '/copie-' . date('Y-m-d') . '.json';
  if (is_file($file) && !is_file($day)) {
    @copy($file, $day);
    $copies = glob($dir . '/copie-*.json') ?: [];
    sort($copies);
    foreach (array_slice($copies, 0, max(0, count($copies) - 14)) as $old) @unlink($old);
  }
  $tmp = $file . '.tmp';
  $json = json_encode((object)$items, JSON_UNESCAPED_UNICODE);
  if ($json === false || file_put_contents($tmp, $json) === false || !rename($tmp, $file)) out(500, ['code' => 'storage']);
}

$cols = ['tasks', 'calls', 'ideas', 'comments', 'goals', 'config'];
if ($op === 'ping') out(200, ['ok' => true]);
if ($op === 'list') {
  $rows = [];
  foreach ($items as $k => $data) { [$c, $i] = explode('/', $k, 2); $rows[] = ['col' => $c, 'id' => $i, 'data' => $data]; }
  out(200, $rows);
}
$col = $req['col'] ?? ''; $id = $req['id'] ?? '';
if (!in_array($col, $cols, true) || !is_string($id) || !preg_match('/^[A-Za-z0-9_.~:@+-]{1,200}$/', $id)) out(400, ['code' => 'invalid_argument']);
$key = $col . '/' . $id;
if ($op === 'delete') { unset($items[$key]); save_items($items, $dir, $file); out(200, ['ok' => true]); }
$data = $req['data'] ?? null;
if (!is_array($data) || ($data !== [] && array_is_list($data))) out(400, ['code' => 'invalid_argument']);
if ($op === 'set') { $items[$key] = (object)$data; save_items($items, $dir, $file); out(200, ['ok' => true]); }
if ($op === 'update') {
  if (!isset($items[$key])) out(200, ['found' => false]);
  $items[$key] = (object)array_merge((array)$items[$key], $data);
  save_items($items, $dir, $file);
  out(200, ['found' => true]);
}
out(400, ['code' => 'invalid_argument']);
