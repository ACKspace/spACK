# spACK: Spacial audio conferencing for ACKspace

This project is an attempt to recreate the virtual hackerspace we had during COVID-19 on [Gather Town](https://gather.town), which was lost during their business plan updates.

Currently it is in development and not yet stable; check out the open issues at [GitHub](https://github.com/ACKspace/spACK/issues).

The following documents exist as well, you can find them in the `docs` directory:
* [Development](./docs/Development.md): set up and run a local instance
* [SolidJS](./docs/SolidJS.md): information on SolidJS, used to render the browser page
* [Internals](./docs/Internals.md): structure of this project
* [LiveKit](./docs/LiveKit.md): information on the workings of LiveKit and its online conferencing

## Table of Contents

* [Play online](#1)
  * [Keys](#1.1)
  * [Admin mode](#1.2)
* [Track status on GitHub](#2)
  * [File a bug](#2.1)


## Play online <a id="1"></a>

A version of spACK is running on https://pauper.tel/spack

* First, enter a room name. Note that existing rooms can be password protected which will be indicated on the next screen
* Next, enter a name and choose a character.  A password may be required to enter or administer the room.
* From the spawn point you can walk using the arrow keys (or gamer's `WSAD`)
* By default, audio is muted; optionally select your audio device on the bottom right corner and click `enable`.


### Keys <a id="1.1"></a>

The following keys are available:

* arrow keys and `w`, `s`, `a`, `d`: walk around
* `x`: interact/use; to trigger an object or draw tiles
* `t`: start chat; `enter` to send, `escape` to cancel


### Admin mode <a id="1.2"></a>

If you're a room admin, you can edit the level by clicking `edit mode` on the top right corner; a toolbox will appear on the bottom left corner.

Select a block tool by pressing the numbers, or `Delete` to select the eraser:
* `1`: Impassable; blocking block with optional pass through direction (for one way walking)
* `2`: Spawn: player spawn point with optional facing direction
* `3`: Portal: you must enter a room name, coordinate or both. Facing direction is optional
* `4`: **NOT YET AVAILABLE** Private: audio/video isolation within the room: all participants within the same `Identifier` will be able to hear each other regardless of the earshot radius.
* `5`: **NOT YET AVAILABLE** Spotlight: participant on this tile will take precedence on all other participants within the private group; for presentations

## Track status on GitHub <a id="2"></a>

The latest development version is available on [GitHub](http://github.com/ACKspace/spACK/); you can track [development](https://github.com/ACKspace/spACK/branches), [active bugs](https://github.com/ACKspace/spACK/issues) and planned [milestones](https://github.com/ACKspace/spACK/milestones).


### File a bug <a id="2.1"></a>

First, make sure there isn't already a [bug report](https://github.com/ACKspace/spACK/issues) that describes the exact issue.  Related issues are important to mention as well.

Click `New issue`, provide a thorough fitting title and clear steps to reproduce.