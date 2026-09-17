<?php
declare(strict_types=1);
namespace App;

use PDO;

final class Auth {
    public static function login(array $body): array {
        self::throttle();
        $email = strtolower(trim((string)($body['email'] ?? ''))); $password = (string)($body['password'] ?? '');
        $stmt=Database::connection()->prepare('SELECT * FROM admins WHERE email=? AND active=1 LIMIT 1');$stmt->execute([$email]);$admin=$stmt->fetch();
        if(!$admin || !password_verify($password,$admin['password_hash'])){self::recordFailure();usleep(250000);Http::json(['success'=>false,'error'=>'Invalid credentials'],401);}
        if(password_needs_rehash($admin['password_hash'],PASSWORD_DEFAULT)) Database::connection()->prepare('UPDATE admins SET password_hash=? WHERE id=?')->execute([password_hash($password,PASSWORD_DEFAULT),$admin['id']]);
        if((int)$admin['mfa_enabled']===1){$temp=self::issue((int)$admin['id'],'mfa',5);return ['mfa_required'=>true,'temp_token'=>$temp];}
        return ['mfa_required'=>false,'token'=>self::issue((int)$admin['id'],'access')];
    }
    public static function verifyMfa(array $body): array {
        $admin=self::fromToken((string)($body['temp_token']??''),'mfa');$code=trim((string)($body['code']??''));
        $secret=Crypto::decrypt($admin['mfa_secret']);
        if(!Totp::verify($secret,$code)&&!self::useRecovery((int)$admin['id'],$code)) Http::json(['success'=>false,'error'=>'Invalid verification code'],401);
        self::revoke((string)$body['temp_token']); return ['token'=>self::issue((int)$admin['id'],'access')];
    }
    public static function requireAdmin(): array { $token=Http::bearer(); if(!$token)Http::json(['success'=>false,'error'=>'Unauthenticated'],401); return self::fromToken($token,'access'); }
    public static function logout(): void { $token=Http::bearer(); if($token)self::revoke($token); }
    public static function setupMfa(array $admin): array {
        $secret=Totp::secret();Database::connection()->prepare('UPDATE admins SET mfa_pending_secret=? WHERE id=?')->execute([Crypto::encrypt($secret),$admin['id']]);
        return ['secret'=>$secret,'otpauth_uri'=>Totp::uri($secret,$admin['email'])];
    }
    public static function confirmMfa(array $admin,string $code): array {
        $stmt=Database::connection()->prepare('SELECT mfa_pending_secret FROM admins WHERE id=?');$stmt->execute([$admin['id']]);$enc=$stmt->fetchColumn();
        if(!$enc||!Totp::verify(Crypto::decrypt($enc),$code))Http::json(['success'=>false,'error'=>'Invalid verification code'],422);
        $codes=[];for($i=0;$i<8;$i++)$codes[]=strtoupper(substr(Crypto::randomToken(6),0,10));$pdo=Database::connection();$pdo->beginTransaction();
        $pdo->prepare('UPDATE admins SET mfa_enabled=1,mfa_secret=mfa_pending_secret,mfa_pending_secret=NULL WHERE id=?')->execute([$admin['id']]);$pdo->prepare('DELETE FROM mfa_recovery_codes WHERE admin_id=?')->execute([$admin['id']]);$ins=$pdo->prepare('INSERT INTO mfa_recovery_codes(admin_id,code_hash) VALUES(?,?)');foreach($codes as $c)$ins->execute([$admin['id'],Crypto::hash($c)]);$pdo->commit();return ['recovery_codes'=>$codes];
    }
    public static function disableMfa(array $admin,string $password,string $code): void {
        if(!password_verify($password,$admin['password_hash'])||!Totp::verify(Crypto::decrypt((string)$admin['mfa_secret']),$code))Http::json(['success'=>false,'error'=>'Password or MFA code is invalid'],422);
        $pdo=Database::connection();$pdo->prepare('UPDATE admins SET mfa_enabled=0,mfa_secret=NULL,mfa_pending_secret=NULL WHERE id=?')->execute([$admin['id']]);$pdo->prepare('DELETE FROM mfa_recovery_codes WHERE admin_id=?')->execute([$admin['id']]);
    }
    public static function verifySensitiveAction(array $admin,array $body): void {
        $password=(string)($body['password']??'');$code=trim((string)($body['code']??''));
        if(!password_verify($password,$admin['password_hash']))Http::json(['success'=>false,'error'=>'Password is invalid'],422);
        if((int)$admin['mfa_enabled']!==1)return;
        $secret=(string)($admin['mfa_secret']??'');
        if($code===''||$secret===''||(!Totp::verify(Crypto::decrypt($secret),$code)&&!self::useRecovery((int)$admin['id'],$code)))Http::json(['success'=>false,'error'=>'MFA code is invalid'],422);
    }
    private static function issue(int $adminId,string $type,int $minutes=0): string {$token=Crypto::randomToken();$ttl=$minutes?:$GLOBALS['config']['session_ttl'];Database::connection()->prepare('INSERT INTO admin_sessions(admin_id,token_hash,type,ip,user_agent,expires_at) VALUES(?,?,?,?,?,DATE_ADD(NOW(),INTERVAL ? MINUTE))')->execute([$adminId,Crypto::hash($token),$type,Http::ip(),substr($_SERVER['HTTP_USER_AGENT']??'',0,255),$ttl]);return $token;}
    private static function fromToken(string $token,string $type): array {$stmt=Database::connection()->prepare('SELECT a.* FROM admin_sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=? AND s.type=? AND s.expires_at>NOW() AND a.active=1 LIMIT 1');$stmt->execute([Crypto::hash($token),$type]);$admin=$stmt->fetch();if(!$admin)Http::json(['success'=>false,'error'=>'Session expired'],401);return $admin;}
    private static function revoke(string $token): void { Database::connection()->prepare('DELETE FROM admin_sessions WHERE token_hash=?')->execute([Crypto::hash($token)]); }
    private static function throttle(): void {$stmt=Database::connection()->prepare('SELECT COUNT(*) FROM login_attempts WHERE ip=? AND successful=0 AND created_at>DATE_SUB(NOW(),INTERVAL 15 MINUTE)');$stmt->execute([Http::ip()]);if((int)$stmt->fetchColumn()>=8)Http::json(['success'=>false,'error'=>'Too many attempts. Try again later.'],429);}
    private static function recordFailure(): void {Database::connection()->prepare('INSERT INTO login_attempts(ip,successful) VALUES(?,0)')->execute([Http::ip()]);}
    private static function useRecovery(int $adminId,string $code): bool {$stmt=Database::connection()->prepare('SELECT id FROM mfa_recovery_codes WHERE admin_id=? AND code_hash=? AND used_at IS NULL LIMIT 1');$stmt->execute([$adminId,Crypto::hash(strtoupper($code))]);$id=$stmt->fetchColumn();if(!$id)return false;Database::connection()->prepare('UPDATE mfa_recovery_codes SET used_at=NOW() WHERE id=?')->execute([$id]);return true;}
}
