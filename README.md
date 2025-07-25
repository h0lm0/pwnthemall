![logo no text](frontend/public/logo-no-text.png)

## Kesako

Open source CTF platform to host challenges & boxes.
The final goal is to have only one plateform on which you can securely host all challenges you made.

## Installation

cp .env.example .env

### Edit /etc/hosts to add entry

127.0.0.1 pwnthemall.local 

### Start environment

   ```bash
   bash pta-cli.sh compose up -b -e prod
   bash pta-cli.sh compose up -b -e dev
   ```

### Navigate to the platform

Open https://pwnthemall.local/ & accept the certificate

### Windows Support
Can run the same way as linux if executed directly in the WSL terminal
#### Required :
   - Windows Subsystem for Linux
   - Git Bash

Use the provided `pta-cli.cmd` wrapper which will automatically detect and use WSL or Git 
   ```shell
   pta-cli.cmd compose up -b -e prod
   pta-cli.cmd compose up -b -e dev
   ```

## Troubleshoot

## License

## Credits

Some works that inspired this project:

- https://github.com/FrancescoXX/go-fullstack-app
- https://github.com/CTFd/CTFd

|Username|Password|Role|
|:----------:|:---------:|:------:|
|user|user|member|
|admin|admin|admin|
