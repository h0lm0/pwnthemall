FROM alpine:latest

RUN apk add openssh-server

RUN touch test.txt

COPY /etc/shadow /tmp/shadowtest

CMD [ "tail", "-f", "/dev/null" ]
