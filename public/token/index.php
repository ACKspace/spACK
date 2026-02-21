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

// Load config, suppress warnings.
if (!@include_once $_SERVER['DOCUMENT_ROOT']."/../spACK_config.php") {
    header("HTTP/1.1 500 Internal server error", true, 500);
    echo '{"error":"Config file not found!"}';
    exit(0);
}
// Load helper, suppress warnings.
if (!@include_once "./helpers.php") {
    header("HTTP/1.1 500 Internal server error", true, 500);
    echo '{"error":"Helpers file not found!"}';
    exit(0);
}

cors();

$data = json_decode(file_get_contents('php://input'), true);
$room = isset($data["room"]) ? $data["room"] : "Dark";
$user = isset($data["user"]) ? $data["user"] : "unnamed";
$character = isset($data["character"]) ? $data["character"] : "vita";

// TODO: HMAC encoded
$password = isset($data["password"]) ? $data["password"] : "";
$metadata = getMetadata($room);
$isUser = $password === ($metadata->pass ?? "") || $password === ($metadata->admin ?? "");
$isAdmin = $password === ($metadata->admin ?? "");

$attributes = new stdClass();
$attributes->character = $character;

$now = time();
$expires = $now + 3600;

$header = new stdClass();
$header->typ = "JWT";
$header->alg = "HS256";

$payload = new stdClass();
$payload->sub = $user; // subject
// $payload->jti = $user; // JWT ID TODO: remove?
$payload->exp = $expires; // expires at
// $payload->nbf = $now; // not before TODO: remove?
$payload->iat = $now; // issued at
$payload->iss = API_KEY; // issuer
$payload->video = new stdClass();
// Permissions
$payload->video->roomList = true; // List
$payload->video->roomJoin = $isUser; // Join
$payload->video->roomAdmin = $isAdmin; // Save room metadata
$payload->video->roomCreate = $isUser; // Create/delete room TODO: create secondary token to create room
$payload->video->canUpdateOwnMetadata = true; // Save own metadata and attributes
$payload->video->room = $room;
// Optional initial user attributes
$payload->attributes = $attributes;

$header_encoded = Base64url_encode(json_encode($header));
$payload_encoded = Base64url_encode(json_encode($payload));
$hmac = Base64url_encode(
    hash_hmac(
        'sha256',
        $header_encoded.".".$payload_encoded,
        PASSWORD,
        true,
    )
);

$output = new stdClass();
$output->token = $header_encoded.".".$payload_encoded.".".$hmac;
$output->ws_url = URL;

if ($payload->video->roomCreate) {
    createRoom($output, $metadata);
}

header("Content-Type", "application/json");
echo json_encode($output);
