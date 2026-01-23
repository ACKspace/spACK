# spACK: Spacial audio conferencing for ACKspace
This project is an attempt to recreate the virtual hackerspace we had during COVID-19 on [Gather Town](https://gather.town), which was lost during their business plan updates.

Currently it is in early alpha stage; check out the open issues at [GitHub](https://github.com/ACKspace/spACK/issues).

## Table of Contents

* [Prerequisites](#1)
  * [Windows](#1.1)
  * [MacOS](#1.2)
  * [Linux](#1.3)
* [Developing](#2)
  * [Client](#2.1)
* [Builds and deployments](#3)
  * [Release build](#3.1)
  * [Other variants](#3.2)
  * [Deployment](#3.3)
  * [LiveKit server](#3.4)
  * [Notes on deployment server](#3.5)


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
TODO

### LiveKit server <a id="3.4"></a>
Run development server.

Check the latest version on https://github.com/livekit/livekit/releases/latest

```bash
$ wget https://github.com/livekit/livekit/releases/download/v1.9.11/livekit_1.9.11_linux_amd64.tar.gz
$ tar -xf livekit_1.9.11_linux_amd64.tar.gz
./livekit-server --dev
```
To run it publicly (not recommended), add `--bind 0.0.0.0`

```bash
# TODO: npm run deploy
```


### Notes on deployment server <a id="3.5"></a>
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
