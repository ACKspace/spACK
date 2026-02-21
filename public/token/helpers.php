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

    $path = "../world/".$roomFolder."/metadata.json";
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
 * @param $token    {string} The token that allows the room to be created.
 * @param $metadata {object} The metadata from the filesystem to add to LiveKit
 *
 * @return {boolean} true on success
 */
function createRoom($token, $metadata)
{
    if (!$metadata) {
        return;
    }

    // https://docs.livekit.io/reference/other/roomservice-api/#createroom

    // TODO: use utf8 room name?
    $data = new stdClass();
    $data->name = $metadata->base;
    $data->emptyTimeout = 120;
    $data->maxParticipants = 20;
    // $data->departureTimeout: 10 * 24 * 60 * 60, // 10 days
    $data->metadata = json_encode(gameStateToMetadata($metadata));

    // error_log(json_encode($data), 0);

    // Do LiveKit request.
    postJson(
        $token->ws_url."twirp/livekit.RoomService/CreateRoom",
        $token->token,
        $data
    );

    return false;
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
        return;
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
 *  Convert game state to LiveKit metadata
 *
 * @param $gameState {stdClass} The Game state.
 *
 * @return {stdClass} true on success
 */
function gameStateToMetadata($gameState)
{
    if (!$gameState) {
        return null;
    }

    // Fields left: CFGHJKLNQRTVWXYZ
    $metadata = new stdClass();
    $metadata->B = $gameState->base; // Base directory
    $metadata->E = $gameState->earshotRadius; // Earshot radius
    $metadata->M = $gameState->debugMode ? 1 : 0; // Debug mode
    $metadata->U = $gameState->updated; // Updated timestamp

    $metadata->A = []; // "spotlight" x y  identifier
    $metadata->D = []; // "portal" x y direction room tx ty
    $metadata->I = []; // "impassable" x y direction
    $metadata->O = []; // objects[] x y image activeImage mediaType uri 
    $metadata->P = []; // "private" x y identifier
    $metadata->S = []; // "spawn" x y direction

    // Handle tile attributes
    foreach ($gameState->tileAttributes as $key => $tileAttribute) {
        list($x, $y) = explode(',', $key);
        $data = [(int)$x, (int)$y];

        switch ($tileAttribute->type) {
        case "spotlight":
            $data[] = $tileAttribute->identifier;
            $metadata->A[] = $data;
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
            $metadata->D[] = $data;
            break;

        case "impassable":
            if ($tileAttribute->direction ?? false) {
                $data[] = $tileAttribute->direction;
            }
            $metadata->I[] = $data;
            break;

        case "private":
            $data[] = $tileAttribute->identifier;
            $metadata->P[] = $data;
            break;

        case "spawn":
            if ($tileAttribute->direction ?? false) {
                $data[] = $tileAttribute->direction;
            }
            $metadata->S[] = $data;
            break;
        }
    }

    // Handle objects
    foreach ($gameState->objects as $object) {
        $mo = [
          $object->position->x,
          $object->position->y,
          $object->image,
          $object->activeImage ?? 0,
          $object->mediaType ?? 0,
          $object->uri ?? 0
        ];
        $metadata->O[] = $mo;
    }

    return $metadata;
}