# Development

This document describes to set up and run your local instance, deployment and development; it is not needed to play online.

## Table of Contents

* [Prerequisites](#1)
  * [Windows](#1.1)
  * [MacOS](#1.2)
  * [Linux](#1.3)
* [Developing](#2)
  * [Docker Compose (alternative)](#2.0)
  * [Client](#2.1)
  * [Local token server](#2.2)
  * [Committing code](#2.3)
* [Builds and deployments](#3)
  * [Release build](#3.1)
  * [Other variants](#3.2)
  * [Deployment](#3.3)
  * [Token server config](#3.4)
  * [LiveKit server](#3.5)
  * [Notes on deployment server](#3.6)


## Prerequisites <a id="1"></a>

* You have to have knowledge of command prompt/terminal use and directory navigation

```bash
$ commands look like this
```
The the `$` is your shell prompt similar `to C:\>`.

You will need at least Node.js and Git to fetch and run the project.
Visual Studio Code is recommended as an IDE to manage and develop for it.


### Windows <a id="1.1"></a>

Windows needs the Chocolatey Package manager (for ease of installation).
This is done by the first powershell command.

```cmd
$ powershell -c "irm https://community.chocolatey.org/install.ps1|iex"
$ choco install nodejs --version="24.13.0"
$ choco install git
$ choco install vscode
```


### MacOS <a id="1.2"></a>

MacOS needs the Homebrew package manager (for ease of installation).
This is done by the first bash command.
```bash
$ /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
$ \. "$HOME/.nvm/nvm.sh"
$ nvm install 24
$ brew install git
$ brew install --cask visual-studio-code
```


### Linux <a id="1.3"></a>

Assuming Debian based distros, for other, try replacing `deb` with `pacman` for Arch, `zypper` for Suse and `dnf` for RedHat.  Your mileage may vary and packages might have a slightly different name.

```bash
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
$ \. "$HOME/.nvm/nvm.sh"
$ nvm install 24
$ sudo apt install git
$ curl -ovscode.deb https://go.microsoft.com/fwlink/?LinkID=760868
$ sudo apt install ./vscode.deb
```


## Developing <a id="2"></a>

Checkout this repository from GitHub and make sure the submodules are also cloned:
```bash
git clone https://github.com/ACKspace/spACK.git
cd spACK
git submodule update --init --recursive
```

> **Note:** the `solid-canvas` submodule uses HTTPS, so no SSH key is required for it.

After the initial repository and submodules are cloned, you can pull in updates (from within the project's directory) with:
```bash
git pull
git submodule update --recursive --remote
```

Copy over the `.env.example` file to `.env`:
```bash
$ cp .env.example .env
```


### Docker Compose (alternative) <a id="2.0"></a>

If you have Docker and Docker Compose installed, you can run a full local stack (frontend, token server, LiveKit) without installing Node.js, PHP, or the LiveKit binary manually.

```bash
$ docker compose up --build
```

This starts three services:

| Service | URL | Description |
|---|---|---|
| `frontend` | http://localhost:3001 | Vite dev server with hot reload |
| `token` | http://localhost:8083 | PHP JWT token server |
| `livekit` | ws://localhost:7880 | LiveKit WebRTC server (dev mode) |

Update your `.env` file to point at the Docker token server:
```
VITE_TOKEN_URL=http://localhost:8083
```

The frontend service mounts the project source as a volume, so edits to `src/` hot-reload automatically. The token service mounts `public/` and `spACK_config.php` directly, so PHP changes also take effect immediately without a rebuild.

To override LiveKit credentials or URLs, set environment variables before running:
```bash
export LIVEKIT_API_KEY=mykey
export LIVEKIT_PASSWORD=mypassword
docker compose up
```

To stop all services:
```bash
$ docker compose down
```


### Client <a id="2.1"></a>

Install dependencies:
```bash
$ npm install # or npm i
```

Start local development instance:
```bash
$ npm start
```
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
The page will (hot) reload if you make edits.

You will need a local LiveKit server running that handles the conference and WebRTC media.


### Local token server <a id="2.2"></a>

`spACK_config.php` is already present in the repository and reads its settings from environment variables. The defaults (`devkey` / `secret`) point at the production LiveKit server, so no manual creation is needed for basic use.

To use the token server locally without Docker:

* Update the `.env` file: `VITE_TOKEN_URL=http://localhost:8081`
* Run local php instance of token service:
```bash
npm run token
# or:
php -S 0.0.0.0:8081 -t ./public public/token/index.php
```

To override the defaults, set environment variables before starting the token server:
```bash
export LIVEKIT_API_KEY=mykey
export LIVEKIT_PASSWORD=mypassword
export LIVEKIT_URL=ws://127.0.0.1:7880/
npm run token
```

### Committing code <a id="2.3"></a>
Note on committing using the editor which starts with `#` that also indicates a comment;
for example on an amend, use
```bash
git commit --amend --cleanup=whitespace
```
and clear all other lines.

Make sure, if using VSCode to set the commit message editor:
```bash
git config --global core.editor "code --wait"
```

Note that creating a tag requires the following syntax: `git tag -a v0.9.1 -m "beta 2"`
Don't forget to update the `.env` files accordingly.


## Builds and deployments <a id="3"></a>


### Release build <a id="3.1"></a>

```bash
$ npm run build
```
Test the production build locally:
```bash
$ npm run serve
```


### Other variants <a id="3.2"></a>

By default, production builds are made, but it's possible to build other types for your needs, i.e. debug features and/or local server connection.

You can build a certain variant using mode, replacing `<variant>`:
```bash
$ npm run build -- --mode <variant>
```

* `test`: debug features enabled, connecting to localhost, similar to local development instance
* `staging`: debug features enabled, connecting to public server

Other variants can be made to suit your needs: they should pair with a dedicated `.env.<variant>` file containing specific environment variables.


### Deployment <a id="3.3"></a>

The current deployment script is using [Bun](http://bun.sh/).
By default, deployment is done to `test`.


#### Create keyfiles (for reference; only needed once)

Keyfiles:
```bash
LOGIN=$USER # Set your remote username
REMOTE=pauper.tel
ssh-keygen -t ed25519 -C "$LOGIN$@$HOSTNAME$" -f "$HOME/.ssh/$REMOTE" -P ""
ssh-copy-id -p 22 -i "$HOME/.ssh/$REMOTE" $LOGIN@$REMOTE
eval "$(ssh-agent -s)"
```

For the correct environment (`test`, `staging` or `prod`), open the corresponding `.env.*` file, choose the name of the `DEPLOYMENT_FOLDER` and update the command in `DEPLOYMENT_SERVER` to suit your needs.

Make sure the server variable contains the same folder name as the folder variable.

To run a fresh build and immediately deploy it:
```bash
npm run deploy [environment]
```
Environment defaults to `test`.


### Token server config <a id="3.4"></a>

`spACK_config.php` is included in the repository and reads credentials from environment variables. On the deployment server, set these variables in your web server configuration (e.g. Apache `SetEnv`, nginx `fastcgi_param`) or a server-side environment file:

```
LIVEKIT_API_KEY=<your-api-key>
LIVEKIT_PASSWORD=<your-admin-password>
LIVEKIT_URL=https://your-livekit-host/
```

`LIVEKIT_INTERNAL_URL` can optionally be set if the server-side API endpoint differs from the browser-facing WebSocket URL (e.g. in Docker or behind a reverse proxy). It defaults to the value of `LIVEKIT_URL`.

For Apache, environment variables can be set per virtual host:
```conf
<VirtualHost *:443>
    #... current settings

    SetEnv LIVEKIT_API_KEY     your-api-key
    SetEnv LIVEKIT_PASSWORD    your-admin-password
    SetEnv LIVEKIT_URL         https://your-livekit-host/
</VirtualHost>
```


### LiveKit server <a id="3.5"></a>

Run development server.

Check the latest version on https://github.com/livekit/livekit/releases/latest

```bash
$ wget https://github.com/livekit/livekit/releases/download/v1.9.11/livekit_1.9.11_linux_amd64.tar.gz
$ tar -xf livekit_1.9.11_linux_amd64.tar.gz
./livekit-server --dev
```
To run it publicly (not recommended), add `--bind 0.0.0.0`


### Notes on deployment server <a id="3.6"></a>

In order to use WebRTC, a secure context is needed (TLS/SSL), which means your LiveKit server needs a proxy.

For Apache, a proxy can be used.
Make sure the proxy module is enabled:
```bash
$ a2enmod proxy
```
And add the following two lines to your virtualhost config:
```conf
<VirtualHost *:443>
    #... current settings

    # SSL websocket proxy
    ProxyPass /livekit ws://127.0.0.1:7880
    ProxyPassReverse /livekit ws://127.0.0.1:7880
</VirtualHost>
```
