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
Assuming Debian based distros, for other, try replacing `deb` with `pacman` for Arch, `zypper` for Suse and `dnf` for RedHat

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install 24
sudo apt install git
curl -ovscode.deb https://go.microsoft.com/fwlink/?LinkID=760868
sudo apt install ./vscode.deb
```









---------------------------
## Usage

Those templates dependencies are maintained via [pnpm](https://pnpm.io) via `pnpm up -Lri`.

This is the reason you see a `pnpm-lock.yaml`. That being said, any package manager will work. This file can be safely be removed once you clone a template.

```bash
$ npm install # or pnpm install or yarn install
```

### Learn more on the [Solid Website](https://solidjs.com) and come chat with us on our [Discord](https://discord.com/invite/solidjs)

## Available Scripts

In the project directory, you can run:

### `npm run dev` or `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>

### `npm run build`

Builds the app for production to the `dist` folder.<br>
It correctly bundles Solid in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

## Deployment

You can deploy the `dist` folder to any static host provider (netlify, surge, now, etc.)

## This project was created with the [Solid CLI](https://github.com/solidjs-community/solid-cli)
