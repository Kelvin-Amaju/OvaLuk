<?php
declare(strict_types=1);
namespace App;

final class Http {
    public static function cors(): void {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowed = $GLOBALS['config']['cors_origins'];
        if ($origin !== '' && in_array($origin, $allowed, true)) {
            header("Access-Control-Allow-Origin: {$origin}");
            header('Vary: Origin');
            header('Access-Control-Allow-Credentials: true');
        }
        header('Access-Control-Allow-Headers: Authorization, Content-Type, X-App-Key, X-Webhook-Signature, Stripe-Signature');
        header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
        header('Access-Control-Max-Age: 86400');
        header('X-Content-Type-Options: nosniff');
        header('Referrer-Policy: no-referrer');
        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
    }
    public static function json(array $data, int $status = 200): never {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
        exit;
    }
    public static function body(): array {
        $raw = file_get_contents('php://input') ?: '';
        if (strlen($raw) > 1048576) self::json(['success'=>false,'error'=>'Payload too large'], 413);
        if ($raw === '') return [];
        $data = json_decode($raw, true);
        if (!is_array($data)) self::json(['success'=>false,'error'=>'Invalid JSON'], 400);
        return $data;
    }
    public static function bearer(): ?string {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? $_SERVER['Authorization'] ?? '';
        return preg_match('/^Bearer\s+(.+)$/i', $header, $m) ? trim($m[1]) : null;
    }
    public static function ip(): string { return substr($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0', 0, 45); }
}
