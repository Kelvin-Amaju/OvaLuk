<?php
declare(strict_types=1);
namespace App;

final class Ingest {
    public static function event(array $b): array {
        $key=$_SERVER['HTTP_X_APP_KEY']??'';if($key==='')Http::json(['success'=>false,'error'=>'Missing app key'],401);
        $stmt=Database::connection()->prepare('SELECT id,public_id FROM applications WHERE ingestion_key_hash=? LIMIT 1');$stmt->execute([Crypto::hash($key)]);$app=$stmt->fetch();if(!$app)Http::json(['success'=>false,'error'=>'Invalid app key'],401);
        $visitor=substr(trim((string)($b['visitor_id']??'')),0,190);$name=substr(trim((string)($b['event']??'')),0,100);if($visitor===''||$name==='')Http::json(['success'=>false,'error'=>'visitor_id and event are required'],422);
        $user=substr(trim((string)($b['user_id']??'')),0,190)?:null;$session=substr(trim((string)($b['session_id']??'')),0,190)?:null;$now=date('Y-m-d H:i:s');$properties=$b['properties']??[];
        $pdo=Database::connection();$pdo->beginTransaction();
        $pdo->prepare('INSERT INTO visitors(application_id,visitor_id,user_id,first_seen_at,last_seen_at,ip_hash,country,device,browser) VALUES(?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE user_id=COALESCE(VALUES(user_id),user_id),last_seen_at=VALUES(last_seen_at),country=COALESCE(VALUES(country),country),device=COALESCE(VALUES(device),device),browser=COALESCE(VALUES(browser),browser)')->execute([$app['id'],$visitor,$user,$now,$now,Crypto::hash(Http::ip()),substr((string)($b['country']??''),0,2)?:null,substr((string)($b['device']??''),0,50)?:null,substr((string)($b['browser']??''),0,50)?:null]);
        $pdo->prepare('INSERT INTO events(application_id,visitor_id,session_id,user_id,event_name,page_url,referrer,properties,occurred_at) VALUES(?,?,?,?,?,?,?,?,?)')->execute([$app['id'],$visitor,$session,$user,$name,substr((string)($b['page_url']??''),0,1000)?:null,substr((string)($b['referrer']??''),0,1000)?:null,json_encode($properties,JSON_UNESCAPED_SLASHES),$now]);$id=(int)$pdo->lastInsertId();$pdo->commit();return ['accepted'=>true,'event_id'=>$id];
    }
}

