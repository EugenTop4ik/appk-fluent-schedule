<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

date_default_timezone_set('Europe/Moscow');

echo json_encode(array(
    'ok' => true,
    'timezone' => date_default_timezone_get(),
    'serverUnixMs' => round(microtime(true) * 1000),
    'serverDate' => date('Y-m-d'),
    'serverTime' => date('H:i:s')
));
