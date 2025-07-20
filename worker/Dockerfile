FROM alpine:3.20

RUN apk add --no-cache openssh bash docker openrc

# On ajoute un user dédié pr tout gérer
RUN adduser -D -u 1000 -s /bin/bash -G docker docker && \ 
    mkdir -p /home/docker/.ssh && \
    chown -R docker:docker /home/docker/.ssh && \
    chmod 700 /home/docker/.ssh

RUN mkdir -p /root/.ssh && \
    chmod 700 /root/.ssh

# RUN echo "docker:${WORKER_PASSWORD}"|chpasswd

RUN sed 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config
RUN sed 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT [ "/bin/bash", "/entrypoint.sh"]