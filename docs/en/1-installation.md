# Installation

## Linux

### Requirements

- Docker
- Docker Compose (>v2)
- SSH client (ssh-keygen command)
- Bash

NB: Currently, the only option to deploy the project is to use Docker Compose.

### Steps


```bash
# Clone the project
git clone https://github.com/h0lm0/pwnthemall.git
cd pwnthemall

# Make .env & update it as you want
cp .env.example .env

# Run it all !
bash pta-cli.sh compose up -b -e prod

# Or if you want to run the development environment
bash pta-cli.sh compose up -b -e dev
```

By default, Caddy proxy will be available on `0.0.0.0:443`, but as it automatically create SSL cert for `$PTA_PUBLIC_DOMAIN` (configured in `.env`), you may have an error on the SSL certificate of the website.
As remediation, you can simply add an entry for this domain name on your `/etc/hosts` file like this:

```bash
127.0.0.1   pwnthemall.local
```

## Windows - DEPRECATED

### Requirements

- Windows Subsystem for Linux (WSL)
- Alternatively, Git Bash (if WSL is not available)

### Steps

Can run the same way as Linux if executed directly in the WSL terminal.

Use the provided `pta-cli.cmd` wrapper, which will automatically detect and use WSL if available, or fall back to Git Bash. 
```shell
pta-cli.cmd compose up -b -e prod
pta-cli.cmd compose up -b -e dev
```
