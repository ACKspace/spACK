# Prerequisites

* You have to have knowledge of command prompt/terminal use and directory navigation

```bash
commands look like this
```
You will need at least Node.js and Git to fetch and run the project.
Visual Studio Code is recommended as an IDE to manage and develop for it.

## Windows

Windows needs the Chocolatey Package manager (for ease of installation).
This is done by the first powershell command.

```cmd
powershell -c "irm https://community.chocolatey.org/install.ps1|iex"
choco install nodejs --version="24.13.0"
choco install git
choco install vscode
```


## MacOS

MacOS needs the Homebrew package manager (for ease of installation).
This is done by the first bash command.
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install 24
brew install git
brew install --cask visual-studio-code
```

## Linux

Assuming Debian based distros, for other, try replacing `deb` with `pacman` for Arch, `zypper` for Suse and `dnf` for RedHat.  Your mileage may vary and packages might have a slightly different name.

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install 24
sudo apt install git
curl -ovscode.deb https://go.microsoft.com/fwlink/?LinkID=760868
sudo apt install ./vscode.deb
```


# Developer mode

```bash
npm install # or npm i
```

Start local development instance:
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
The page will (hot) reload if you make edits.

You will need a local LiveKit server running that handles the conference and WebRTC media.


# Release build

```bash
npm run build
```
Test the production build locally:
```bash
npm run serve
```

# Deployment

```bash
# TODO: npm run deploy
```


# Notes on deployment server
In order to use WebRTC, a secure context is needed (TLS/SSL), which means your LiveKit server needs a proxy.

For Apache, the following can be used:
```conf
<VirtualHost *:443>
    #... current settings

    # SSL
    ProxyPass /wss ws://127.0.0.1:8088
    ProxyPassReverse /wss ws://127.0.0.1:8088
</VirtualHost>


