Output run.gif

Set FontSize 36
Set Theme "Catppuccin Frappe"
Set WindowBar Colorful
Set BorderRadius 10
Set Width 1200
Set Height 800

Type "cp .env.example .env"
Sleep 1s
Enter

Sleep 1.5s

Type "./pta-cli.sh compose up -b -e prod"
Sleep 2s
Enter
Sleep 15s
Type "pwnthemall is now running !"
Sleep 3s
