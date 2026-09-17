<?php
declare(strict_types=1);
namespace App;

final class Crypto {
    public static function randomToken(int $bytes = 32): string { return bin2hex(random_bytes($bytes)); }
    public static function hash(string $value): string { return hash('sha256', $value); }
    public static function encrypt(string $plaintext): string {
        $key = self::key(); $iv = random_bytes(12); $tag = '';
        $cipher = openssl_encrypt($plaintext, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
        if ($cipher === false) throw new \RuntimeException('Encryption failed');
        return base64_encode($iv . $tag . $cipher);
    }
    public static function decrypt(string $encoded): string {
        $raw = base64_decode($encoded, true);
        if ($raw === false || strlen($raw) < 29) throw new \RuntimeException('Invalid encrypted value');
        $plain = openssl_decrypt(substr($raw, 28), 'aes-256-gcm', self::key(), OPENSSL_RAW_DATA, substr($raw, 0, 12), substr($raw, 12, 16));
        if ($plain === false) throw new \RuntimeException('Decryption failed');
        return $plain;
    }
    private static function key(): string {
        $source = (string) ($GLOBALS['config']['app_key'] ?? '');
        if (strlen($source) < 32) throw new \RuntimeException('APP_KEY must be at least 32 characters');
        return hash('sha256', $source, true);
    }
}

