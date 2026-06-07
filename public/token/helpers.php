<?php
/**
 * Backend helper methods.
 * PHP version 7
 * 
 * @category Helper
 * @package  Helpers
 * @author   xopr <xopr@ackspace.nl>
 * @license  Beer license
 * @version  GIT: 0.9
 * @link     https://ackspace.nl
 */

// Make sure we don't call the file directly
if (__FILE__ == $_SERVER['SCRIPT_FILENAME']) {
    header("HTTP/1.1 400 Bad Request", true, 400);
    echo "<h1>400 - Bad Request</h1>";
    exit(0);
}

// Use __DIR__ to locate spACK_config.php reliably regardless of how the PHP
// server sets DOCUMENT_ROOT (built-in server, Apache, Docker, etc.).
// __DIR__ = public/token/, so ../../ = project root.
if (!@include_once __DIR__ . "/../../../spACK_config.php") {
    header("HTTP/1.1 500 Internal server error", true, 500);
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

/**
 *  Get metadata from filesystem
 *  Needs intl: `sudo aptitude install php5-intl`
 *
 * @param $room {string} The name of the room
 *
 * @return {object} Metadata if directory found, else null
 */
function getMetadata($room)
{
    $roomFolder = $room;

    setlocale(LC_CTYPE, 'en_US.UTF8');

    // Try and remove diacritics
    // $transliterator = Transliterator::createFromRules(':: NFD; :: [:Mn:] Remove; :: NFC;');
    // $roomFolder = $transliterator->transliterate($roomFolder);
    if (function_exists("transliterator_transliterate")) {
        $roomFolder = transliterator_transliterate('Any-Latin;Latin-ASCII;', $roomFolder);
    } else if (function_exists("iconv")) {
        $roomFolder = iconv('UTF-8', 'ISO-8859-1//TRANSLIT//IGNORE', $roomFolder);
    }

    $roomFolder = preg_replace('/[^A-Za-z0-9\-_]/', '_', $roomFolder);

    // __DIR__ is public/token/; /../world/ resolves to public/world/
    $path = __DIR__."/../world/".$roomFolder."/metadata.json";
    if (file_exists($path)) {
        // Load metadata
        $metadata = json_decode(file_get_contents($path));
        // Verify `base`

        if ($metadata->base === $roomFolder) {
            return $metadata;
        }
    }
    return null;
}

/**
 *  Create LiveKit room with meta data
 *
 * @param $livekitToken {string} The livekit token that allows the room to be created.
 * @param $metadata     {object} The metadata from the filesystem to add to LiveKit
 *
 * @return {boolean} true on success
 */
function createRoom($livekitToken, $metadata, $roomName = "")
{
    $name = $metadata ? $metadata->base : $roomName;

    // https://docs.livekit.io/reference/other/roomservice-api/#createroom

    // TODO: use utf8 room name?
    $data = new stdClass();
    $data->name = $name;
    $data->emptyTimeout = 120;
    $data->maxParticipants = 20;
    // $data->departureTimeout: 10 * 24 * 60 * 60, // 10 days
    // Have the stored metadata set as local room metadata (in game state format)
    if ($metadata) {
        $data->metadata = json_encode(metadataToGameState($metadata));
    }

    // error_log(json_encode($data), 0);

    // Do LiveKit request (use INTERNAL_URL to support Docker/reverse-proxy setups
    // where the browser-facing URL differs from the server-side API endpoint).
    return postJson(
        INTERNAL_URL."twirp/livekit.RoomService/CreateRoom",
        $livekitToken->token,
        $data
    );
}


/**
 *  Post JSON API data.
 *
 * @param $url   {string} The LiveKit endpoint.
 * @param $token {string} The JWT.
 * @param $data  {stdClass} The data to post.
 *
 * @return {string} The response.
 */
function postJson($url, $token, $data)
{
    // $data = my_utf8_encode($data);
    $postdata = json_encode($data);

    if (!$postdata) {
        return '{"error": "No data"}';
    }

    $opts = array("http" =>
        array(
            "method"  => "POST",
            "header"  => "Content-type: application/json\r\n".
                         "Authorization: Bearer {$token}\r\n",
            "content" => $postdata
        )
    );

    $context = stream_context_create($opts);
    return file_get_contents($url, false, $context);    
}

/**
 *  Convert LiveKit metadata to game state
 *
 * @param $metadata {stdClass} The (verbose) meta data.
 *
 * @return {stdClass} the game state or null on failure.
 */
function metadataToGameState($metadata)
{
    if (!$metadata) {
        return null;
    }

    // Fields left: CFGHJKLNQRTVWXYZ
    $gameState = new stdClass();
    $gameState->B = $metadata->base; // Base directory
    $gameState->E = $metadata->earshotRadius; // Earshot radius
    $gameState->M = $metadata->debugMode ? 1 : 0; // Debug mode
    $gameState->U = $metadata->updated; // Updated timestamp

    $gameState->A = []; // "spotlight" x y  identifier
    $gameState->D = []; // "portal" x y direction room tx ty
    $gameState->I = []; // "impassable" x y direction
    $gameState->O = []; // objects[] x y image activeImage mediaType uri 
    $gameState->P = []; // "private" x y identifier
    $gameState->S = []; // "spawn" x y direction

    // Handle tile attributes
    foreach ($metadata->tileAttributes as $key => $tileAttribute) {
        list($x, $y) = explode(',', $key);
        $data = [(int)$x, (int)$y];

        switch ($tileAttribute->type) {
        case "spotlight":
            $data[] = $tileAttribute->identifier;
            $gameState->A[] = $data;
            break;

        case "portal":
            // Most are optional, but either room or coordinate is required
            // TODO: make sure not to skip elements when coordinate is provided
            $data[] = $tileAttribute->direction ?? 0;
            $data[] = $tileAttribute->room ?? 0;
            if ($tileAttribute->coordinate ?? false) {
                $data[] = $tileAttribute->coordinate->x;
                $data[] = $tileAttribute->coordinate->y;
            }
            $gameState->D[] = $data;
            break;

        case "impassable":
            if ($tileAttribute->direction ?? false) {
                $data[] = $tileAttribute->direction;
            }
            $gameState->I[] = $data;
            break;

        case "private":
            $data[] = $tileAttribute->identifier;
            $gameState->P[] = $data;
            break;

        case "spawn":
            if ($tileAttribute->direction ?? false) {
                $data[] = $tileAttribute->direction;
            }
            $gameState->S[] = $data;
            break;
        }
    }

    // Handle objects
    foreach ($metadata->objects as $object) {
        $mo = [
          $object->position->x,
          $object->position->y,
          $object->image,
          $object->activeImage ?? 0,
          $object->mediaType ?? 0,
          $object->uri ?? 0
        ];
        $gameState->O[] = $mo;
    }

    return $gameState;
}

/**
 * Create JWT payload
 *
 * @param $room      {string} room name to create the payload for
 * @param $metadata  {stdClass} Room meta data that may contain join/admin password
 * @param $user      {string}     User's identity
 * @param $name      {string}     User name to display
 * @param $character {string} Character we built/selected
 * @param $password  {string} Optional room password
 * @param $debug     {boolean}    Whether debug is enabled
 *
 * @return {stdClass} payload object
 */
function JWTPayload($room, $metadata, $user, $name, $character, $password, $debug)
{
    $now = time();
    $expires = $now + ($debug ? 360 : 3600);

    $isUser = $password === ($metadata->pass ?? "") || $password === ($metadata->admin ?? "");
    $isAdmin = $password === ($metadata->admin ?? "");

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
    // Optional initial player attributes
    $payload->attributes = new stdClass();
    $payload->attributes->character = $character;
    $payload->attributes->name = $name;

    return $payload;
}

/**
 * Create Livekit token
 *
 * @param $room      {string} room name to create the payload for
 * @param $metadata  {stdClass} Room meta data that may contain join/admin password
 * @param $user      {string}     User's identity
 * @param $name      {string}     User name to display
 * @param $character {string} Character we built/selected
 * @param $password  {string} Optional room password
 * @param $debug     {boolean}    Whether debug is enabled
 *
 * @return {stdClass} Livekit token
 */
function createLivekitToken($room, $metadata, $user, $name, $character, $password, $debug)
{
    $header = new stdClass();
    $header->typ = "JWT";
    $header->alg = "HS256";

    $payload = JWTPayload($room, $metadata, $user, $name, $character, $password, $debug);

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

    $livekitToken = new stdClass();
    $livekitToken->token = $header_encoded.".".$payload_encoded.".".$hmac;
    $livekitToken->ws_url = URL;

    return $livekitToken;
}
