<?php

declare(strict_types=1);

$password = $argv[1] ?? '';
if ($password === '') {
    fwrite(STDOUT, 'Password: ');
    $password = trim((string)fgets(STDIN));
}
if (strlen($password) < 12) {
    fwrite(STDERR, "Password must be at least 12 characters.\n");
    exit(1);
}
fwrite(STDOUT, password_hash($password, PASSWORD_DEFAULT) . PHP_EOL);