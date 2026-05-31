<?php
/**
 * Create LiveKit token.
 * PHP version 7
 * 
 * @category Helper
 * @package  Helpers
 * @author   xopr <xopr@ackspace.nl>
 * @license  Beer license
 * @version  GIT: 0.9
 * @link     https://ackspace.nl
 */

// error_reporting(E_ALL);
// ini_set('display_errors', 'On');

// Load helper first so cors() is available for all responses (including errors).
// helpers.php has no dependency on the config file.
if (!@include_once __DIR__ . "/helpers.php") {
    header("HTTP/1.1 500 Internal server error", true, 500);
    echo '{"error":"Helpers file not found!"}';
    exit(0);
}

cors();

// Use __DIR__ to locate spACK_config.php reliably regardless of how the PHP
// server sets DOCUMENT_ROOT (built-in server, Apache, Docker, etc.).
// __DIR__ = public/token/, so ../../ = project root.
if (!@include_once __DIR__ . "/../../../spACK_config.php") {
    header("HTTP/1.1 500 Internal server error", true, 500);
    echo '{"error":"Config file not found!"}';
    exit(0);
}

$data = json_decode(file_get_contents('php://input'), true);
$room = isset($data["room"]) ? $data["room"] : "Dark";
$user = isset($data["user"]) ? $data["user"] : "unnamed";
$character = isset($data["character"]) ? $data["character"] : "vita";
$debug = isset($data["debug"]) ? $data["debug"] : false;

// TODO: HMAC encoded
$password = isset($data["password"]) ? $data["password"] : "";
$metadata = getMetadata($room);

$livekitToken = createLivekitToken($room, $metadata, $user, $character, $password, $debug);
createRoom($livekitToken, $metadata, $room); // TODO: room diacritics?

header("Content-Type", "application/json");
echo json_encode($livekitToken);
