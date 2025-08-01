FROM alpine:latest

RUN apk add openssh-server

RUN touch test.txt

COPY flag.txt /flag.txt

CMD [ "tail", "-f", "/dev/null" ]
