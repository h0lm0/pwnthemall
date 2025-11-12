FROM docker:29.0.0-dind-alpine3.22
# FROM alpine:3.20

RUN apk add --no-cache openssh bash docker openrc shadow

# Set default GID for docker group (will be overridden via build/run-time env + pta-cli.sh)
ARG DOCKER_GID
ENV DOCKER_GID $DOCKER_GID

ARG WORKER_PASSWORD
ENV WORKER_PASSWORD $WORKER_PASSWORD

# Create docker group with dynamic GID or use existing group with that GID
RUN EXISTING_GROUP=$(getent group ${DOCKER_GID} | cut -d: -f1) && \
    if [ -z "$EXISTING_GROUP" ]; then \
      addgroup -g ${DOCKER_GID} dockerhost; \
      GROUP_TO_USE=dockerhost; \
    else \
      GROUP_TO_USE=$EXISTING_GROUP; \
    fi && \
    adduser -D -u 1000 -s /bin/bash -G $GROUP_TO_USE docker && \
    mkdir -p /home/docker/.ssh && \
    chown -R docker:docker /home/docker/.ssh && \
    chmod 700 /home/docker/.ssh

# Set password for docker user, mandatory !
RUN echo "docker:${WORKER_PASSWORD}" | chpasswd

# SSH server config: disable root login, enable pubkey auth
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config && \
    sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config

RUN mkdir -p ~/.docker/cli-plugins && \
    wget -qO ~/.docker/cli-plugins/docker-buildx https://github.com/docker/buildx/releases/download/v0.29.1/buildx-v0.29.1.linux-amd64 && \
    chmod +x ~/.docker/cli-plugins/docker-buildx

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT [ "/bin/bash", "/entrypoint.sh" ]
