FROM alpine:3.22

RUN apk add --no-cache curl openssh-server
COPY flag.txt /flag.txt

ENTRYPOINT ["tail", "-f", "/dev/null"]
