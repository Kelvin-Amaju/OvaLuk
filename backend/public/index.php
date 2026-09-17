<?php

declare(strict_types=1);
require dirname(__DIR__) . '/src/bootstrap.php';

use App\{Api, Auth, Http, Ingest, Webhook};

Http::cors();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$base = parse_url($GLOBALS['config']['app_url'], PHP_URL_PATH) ?: '';
if ($base && str_starts_with($path, $base)) $path = substr($path, strlen($base));
$path = '/' . ltrim($path, '/');
if ($method === 'GET' && $path === '/api/health') Http::json(['success' => true, 'data' => ['status' => 'ok', 'time' => gmdate(DATE_ATOM)]]);
if ($method === 'POST' && $path === '/api/auth/login') Http::json(['success' => true, 'data' => Auth::login(Http::body())]);
if ($method === 'POST' && $path === '/api/auth/mfa/verify') Http::json(['success' => true, 'data' => Auth::verifyMfa(Http::body())]);
if ($method === 'POST' && $path === '/api/events') Http::json(['success' => true, 'data' => Ingest::event(Http::body())], 202);
if ($method === 'POST' && preg_match('#^/api/webhooks/(stripe|paystack|flutterwave)/([a-f0-9]{32})$#', $path, $m)) Http::json(['success' => true, 'data' => Webhook::handle($m[1], $m[2], file_get_contents('php://input') ?: '')]);
$admin = Auth::requireAdmin();
if ($method === 'GET' && $path === '/api/auth/me') Http::json(['success' => true, 'data' => Api::profile($admin)]);
if ($method === 'POST' && $path === '/api/auth/logout') {
    Auth::logout();
    Http::json(['success' => true]);
}
if ($method === 'POST' && $path === '/api/auth/mfa/setup') Http::json(['success' => true, 'data' => Auth::setupMfa($admin)]);
if ($method === 'POST' && $path === '/api/auth/mfa/confirm') Http::json(['success' => true, 'data' => Auth::confirmMfa($admin, (string)(Http::body()['code'] ?? ''))]);
if ($method === 'DELETE' && $path === '/api/auth/mfa') {
    $b = Http::body();
    Auth::disableMfa($admin, (string)($b['password'] ?? ''), (string)($b['code'] ?? ''));
    Http::json(['success' => true]);
}
if ($method === 'GET' && $path === '/api/dashboard') Http::json(['success' => true, 'data' => Api::dashboard((int)($_GET['days'] ?? 7))]);
if ($method === 'GET' && $path === '/api/apps') Http::json(['success' => true, 'data' => Api::apps()]);
if ($method === 'POST' && $path === '/api/apps') Http::json(['success' => true, 'data' => Api::createApp(Http::body())], 201);
if (preg_match('#^/api/apps/([a-f0-9]{32})(/rotate-key)?$#', $path, $m)) {
    if ($method === 'PATCH' && empty($m[2])) Http::json(['success' => true, 'data' => Api::updateApp($m[1], Http::body())]);
    if ($method === 'DELETE' && empty($m[2])) {
        Auth::verifySensitiveAction($admin, Http::body());
        Api::deleteApp($m[1]);
        Http::json(['success' => true]);
    }
    if ($method === 'POST' && !empty($m[2])) Http::json(['success' => true, 'data' => ['ingestion_key' => Api::rotateKey($m[1])]]);
}
if ($method === 'GET' && $path === '/api/engagement') Http::json(['success' => true, 'data' => Api::engagement((int)($_GET['days'] ?? 7))]);
if ($method === 'GET' && $path === '/api/payments') Http::json(['success' => true, 'data' => Api::payments()]);
if ($method === 'POST' && $path === '/api/payment-connections') Http::json(['success' => true, 'data' => Api::connectPayment(Http::body())], 201);
if ($method === 'GET' && $path === '/api/alerts') Http::json(['success' => true, 'data' => Api::alerts()]);
Http::json(['success' => false, 'error' => 'Route not found'], 404);
