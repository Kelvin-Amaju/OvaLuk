<?php
declare(strict_types=1);
namespace App;

final class Totp {
    private const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    public static function secret(int $length = 32): string {
        $out = ''; for ($i=0;$i<$length;$i++) $out .= self::ALPHABET[random_int(0,31)]; return $out;
    }
    public static function uri(string $secret, string $email): string {
        $issuer = 'AppScope';
        return 'otpauth://totp/' . rawurlencode($issuer . ':' . $email) . '?secret=' . $secret . '&issuer=' . rawurlencode($issuer) . '&digits=6&period=30';
    }
    public static function verify(string $secret, string $code, int $window = 1): bool {
        if (!preg_match('/^\d{6}$/', $code)) return false;
        $counter = intdiv(time(), 30);
        for ($offset=-$window;$offset<=$window;$offset++) if (hash_equals(self::code($secret, $counter+$offset), $code)) return true;
        return false;
    }
    private static function code(string $secret, int $counter): string {
        $key = self::decode($secret); $bin = pack('N2', intdiv($counter, 4294967296), $counter % 4294967296);
        $hash = hash_hmac('sha1', $bin, $key, true); $offset = ord($hash[19]) & 15;
        $value = ((ord($hash[$offset]) & 127)<<24)|((ord($hash[$offset+1])&255)<<16)|((ord($hash[$offset+2])&255)<<8)|(ord($hash[$offset+3])&255);
        return str_pad((string)($value % 1000000), 6, '0', STR_PAD_LEFT);
    }
    private static function decode(string $value): string {
        $bits=''; foreach(str_split(strtoupper($value)) as $c){$p=strpos(self::ALPHABET,$c);if($p!==false)$bits.=str_pad(decbin($p),5,'0',STR_PAD_LEFT);} $out='';
        foreach(str_split($bits,8) as $byte) if(strlen($byte)===8)$out.=chr(bindec($byte)); return $out;
    }
}

