<?php
declare(strict_types=1);

return [
    'app_env' => env('APP_ENV', 'production'),
    'app_url' => rtrim(env('APP_URL', 'http://localhost/appscope/backend/public'), '/'),
    'frontend_url' => rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/'),
    'app_key' => env('APP_KEY', ''),
    'session_ttl' => (int) env('SESSION_TTL_MINUTES', '480'),
    'cors_origins' => array_values(array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000'))))),
    'db' => [
        'host' => env('DB_HOST', '127.0.0.1'),
        'port' => (int) env('DB_PORT', '3306'),
        'name' => env('DB_DATABASE', 'appscope'),
        'user' => env('DB_USERNAME', 'appscope'),
        'pass' => env('DB_PASSWORD', ''),
    ],
];

