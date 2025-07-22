![logo no text](frontend/public/logo-no-text.png)

## Kesako

Open source CTF platform to host challenges & boxes.
The final goal is to have only one plateform on which you can securely host all challenges you made.

## Installation

cp .env.example .env

### Edit /etc/hosts to add entry

127.0.0.1 pwnthemall.local 

### Start environment

bash pta-cli.sh compose up -b -e prod
bash pta-cli.sh compose up -b -e dev

### Navigate to the platform

Open https://pwnthemall.local/ & accept the certificate


## Troubleshoot

## License

## Credits

Some works that inspired this project:

- https://github.com/FrancescoXX/go-fullstack-app
- https://github.com/CTFd/CTFd
