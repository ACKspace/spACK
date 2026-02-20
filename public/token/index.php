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

// Load config, suppress warnings.
if (!@include_once $_SERVER['DOCUMENT_ROOT']."/../spACK_config.php") {
    echo '{"error":"Config file not found!"}';
    exit(0);
}

/**
 * Base64 URL encode data.
 *
 * @param \String $data The data to encode as base64 URL.
 *
 * @return \String
 */
function Base64url_encode($data)
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * Base64 URL decode data.
 *
 * @param \String $data The base64 URL to decode as data.
 *
 * @return \String
 */
function Base64url_decode($data)
{
    return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
}

// Source - https://stackoverflow.com/a/9866124
// Posted by slashingweapon, modified by community. See post 'Timeline' for change history
// Retrieved 2026-02-05, License - CC BY-SA 4.0

/**
 *  An example CORS-compliant method.  It will allow any GET, POST, or OPTIONS requests from any
 *  origin.
 *
 *  In a production environment, you probably want to be more restrictive, but this gives you
 *  the general idea of what is involved.  For the nitty-gritty low-down, read:
 *
 *  - https://developer.mozilla.org/en/HTTP_access_control
 *  - https://fetch.spec.whatwg.org/#http-cors-protocol
 *
 * @return void
 */
function cors()
{
    // Allow from any origin
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        // Decide if the origin in $_SERVER['HTTP_ORIGIN'] is one
        // you want to allow, and if so:
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');    // cache for 1 day
    } else if (isset($_SERVER['HTTP_REFERER'])) {
        // Decide if the origin in $_SERVER['HTTP_REFERER'] is one
        // you want to allow, and if so:
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_REFERER']}");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');    // cache for 1 day
    }
    
    // Access-Control headers are received during OPTIONS requests
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
            // may also be using PUT, PATCH, HEAD etc
            header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
        
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
            header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");

        exit(0);
    }
}

cors();

$data = json_decode(file_get_contents('php://input'), true);
$room = isset($data["room"]) ? $data["room"] : "Dark";
$user = isset($data["user"]) ? $data["user"] : "unnamed";
$character = isset($data["character"]) ? $data["character"] : "vita";
$password = isset($data["password"]) ? $data["password"] : "";

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
$payload->video->roomJoin = true; // Join
$payload->video->roomAdmin = $password === "admin"; // Save room metadata
$payload->video->canUpdateOwnMetadata = true; // Save own metadata and attributes
$payload->video->room = $room;
// Optional initial user attributes
$payload->attributes = $attributes;

/*
    name: roomName,
    emptyTimeout: 120,
    maxParticipants: 20,
    departureTimeout: 10 * 24 * 60 * 60, // 10 days
*/

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

header("Content-Type", "application/json");
echo json_encode($output);
