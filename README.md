# spACK: Spacial audio conferencing for ACKspace

This project is an attempt to recreate the virtual hackerspace we had during COVID-19 on [Gather Town](https://gather.town), which was lost during their business plan updates.

Currently it is in development and not yet stable; check out the open issues at [GitHub](https://github.com/ACKspace/spACK/issues).


## Table of Contents

* [Prerequisites](#1)
  * [Windows](#1.1)
  * [MacOS](#1.2)
  * [Linux](#1.3)
* [Developing](#2)
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
# or git clone git@github.com:ACKspace/spACK.git
cd spACK
git submodule update --init --recursive
```

After the initial repository and submodules are cloned, you can pull in updates (from within the project's directory) with:
```bash
git pull
git submodule update --recursive --remote
```

Provide your local instance with the latest node modules:
```bash
$ npm install # or npm i
```

Copy over the `.env.example` file to `.env`:
```bash
$ cp .env.example .env
```


### Client <a id="2.1"></a>

Start local development instance:
```bash
$ npm start
```
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
The page will (hot) reload if you make edits.

You will need a local LiveKit server running that handles the conference and WebRTC media.


### Local token server <a id="2.2"></a>

* Update the `.env` file: `VITE_TOKEN_URL=http://localhost:8081`
* Create `spACK_config.php` in the project root (just outside the `public` directory) with the following content:
```php
<?php
define("API_KEY", "devkey");
define("PASSWORD", "secret");
// Used for LiveKitRoom websocket serverUrl and Twirp Roomservice POST
define("URL", "ws://127.0.0.1:7880");
// Alternatively, use online server
//define("URL", "https://pauper.tel/livekit/");
```
* Run local php instance of token service:
```bash
npm run token
# or:
php -S 0.0.0.0:8081 -t ./public public/token/index.php
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

* Create `spACK_config.php` just outside the public html directory with the following content:
```php
<?php
define("API_KEY", "devkey");
define("PASSWORD", "secret");
// Point to LiveKit server; used for LiveKitRoom websocket serverUrl and Twirp Roomservice POST
define("URL", "https://pauper.tel/livekit/");
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
