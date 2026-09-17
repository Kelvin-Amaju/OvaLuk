<?php
declare(strict_types=1);

function loadEnv(string $path): void {
    if (!is_file($path)) return;
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key); $value = trim(trim($value), "\"'");
        if (getenv($key) === false) putenv("{$key}={$value}");
    }
}

function env(string $key, string $default = ''): string {
    $value = getenv($key);
    return $value === false ? $default : $value;
}

loadEnv(dirname(__DIR__) . '/.env');
$GLOBALS['config'] = require dirname(__DIR__) . '/config/config.php';

spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    if (!str_starts_with($class, $prefix)) return;
    $path = __DIR__ . '/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (is_file($path)) require $path;
});

set_exception_handler(function (Throwable $e): void {
    error_log((string) $e);
    $debug = ($GLOBALS['config']['app_env'] ?? 'production') !== 'production';
    App\Http::json(['success' => false, 'error' => $debug ? $e->getMessage() : 'Server error'], 500);
});

