<?php

declare(strict_types=1);
require dirname(__DIR__) . '/src/bootstrap.php';
if (PHP_SAPI !== 'cli') exit(1);
$email = strtolower(trim($argv[1] ?? ''));
$name = trim($argv[2] ?? 'Administrator');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Usage: php bin/create-admin.php pineagency@outlook.com \"Pine Agency\"\n");
    exit(1);
}
fwrite(STDOUT, 'Password: ');
$hideInput = PHP_OS_FAMILY !== 'Windows';
if ($hideInput) {
    system('stty -echo');
}
$password = trim((string)fgets(STDIN));
if ($hideInput) {
    system('stty echo');
    fwrite(STDOUT, "\n");
}
if (strlen($password) < 12) {
    fwrite(STDERR, "Password must be at least 12 characters.\n");
    exit(1);
}
$pdo = App\Database::connection();
$count = (int)$pdo->query('SELECT COUNT(*) FROM admins')->fetchColumn();
if ($count > 0) {
    fwrite(STDERR, "An administrator already exists.\n");
    exit(1);
}
$pdo->prepare('INSERT INTO admins(id,name,email,password_hash) VALUES(1,?,?,?)')->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT)]);
fwrite(STDOUT, "Administrator created.\n");
