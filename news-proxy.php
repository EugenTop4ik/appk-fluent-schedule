<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$url = 'https://t.me/s/alexandrovappk';
$context = stream_context_create(array(
    'http' => array(
        'method' => 'GET',
        'header' => "User-Agent: Mozilla/5.0 (compatible; APPKNewsBot/1.0)\r\n"
    ),
    'ssl' => array(
        'verify_peer' => false,
        'verify_peer_name' => false
    )
));

$html = @file_get_contents($url, false, $context);
if ($html === false) {
    echo json_encode(array(
        'ok' => false,
        'source' => 'fallback-required',
        'items' => array(),
        'message' => 'Не удалось получить данные из Telegram.'
    ));
    exit;
}

function appk_strip_tags_text($value) {
    $value = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $value);
    $value = preg_replace('/<style\b[^>]*>(.*?)<\/style>/is', '', $value);
    $value = strip_tags($value);
    $value = html_entity_decode($value, ENT_QUOTES, 'UTF-8');
    $value = preg_replace('/\s+/u', ' ', $value);
    return trim($value);
}

function appk_length($value) {
    if (function_exists('mb_strlen')) {
        return mb_strlen($value, 'UTF-8');
    }
    return strlen(utf8_decode($value));
}

function appk_substr($value, $start, $length) {
    if (function_exists('mb_substr')) {
        return mb_substr($value, $start, $length, 'UTF-8');
    }
    return substr($value, $start, $length);
}

$items = array();
if (preg_match_all('/<div class="tgme_widget_message_wrap[\s\S]*?<\/article>[\s\S]*?<\/div>\s*<\/div>/i', $html, $blocks)) {
    foreach ($blocks[0] as $block) {
        $item = array(
            'title' => '',
            'time' => '',
            'url' => '',
            'excerpt' => ''
        );

        if (preg_match('/<a class="tgme_widget_message_date" href="([^"]+)"/i', $block, $m)) {
            $item['url'] = $m[1];
        }

        if (preg_match('/<time[^>]*>([^<]+)<\/time>/i', $block, $m)) {
            $item['time'] = appk_strip_tags_text($m[1]);
        }

        $textHtml = '';
        if (preg_match('/<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>\s*(<div class="tgme_widget_message_footer"|<div class="tgme_widget_message_link"|<a class="tgme_widget_message_date")/i', $block, $m)) {
            $textHtml = $m[1];
        }

        $text = appk_strip_tags_text($textHtml);
        if ($text === '') {
            continue;
        }

        $parts = preg_split('/[\.\!\?]\s+/u', $text);
        $title = isset($parts[0]) ? trim($parts[0]) : '';
        if ($title === '') {
            $title = appk_substr($text, 0, 90);
        }
        if (appk_length($title) > 110) {
            $title = appk_substr($title, 0, 107) . '...';
        }

        $excerpt = $text;
        if (appk_length($excerpt) > 240) {
            $excerpt = appk_substr($excerpt, 0, 237) . '...';
        }

        $item['title'] = $title;
        $item['excerpt'] = $excerpt;
        $items[] = $item;

        if (count($items) >= 6) {
            break;
        }
    }
}

echo json_encode(array(
    'ok' => count($items) > 0,
    'source' => 'telegram',
    'items' => $items,
    'message' => count($items) > 0 ? 'ok' : 'Посты не найдены.'
));
