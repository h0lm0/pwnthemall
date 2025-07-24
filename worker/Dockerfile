FROM alpine:3.20

RUN apk add --no-cache openssh bash docker openrc shadow

# Set default GID for docker group (will be overridden via build/run-time env + pta-cli.sh)
ARG DOCKER_GID
ENV DOCKER_GID $DOCKER_GID

ARG WORKER_PASSWORD
ENV WORKER_PASSWORD $WORKER_PASSWORD

# Create docker group with dynamic GID
RUN if ! getent group ${DOCKER_GID}; then \
      addgroup -g ${DOCKER_GID} dockerhost; \
    else \
      EXISTING_GROUP=$(getent group ${DOCKER_GID} | cut -d: -f1); \
      echo "Group with GID ${DOCKER_GID} already exists: $EXISTING_GROUP"; \
      addgroup dockerhost || true; \
    fi


# Create non-root user 'docker' with same GID, add to both dockerhost and docker groups
RUN adduser -D -u 1000 -s /bin/bash -G dockerhost docker && \
    mkdir -p /home/docker/.ssh && \
    chown -R docker:docker /home/docker/.ssh && \
    chmod 700 /home/docker/.ssh

# Set password for docker user, mandatory !
RUN echo "docker:${WORKER_PASSWORD}" | chpasswd

# SSH server config: disable root login, enable pubkey auth
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config && \
    sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT [ "/bin/bash", "/entrypoint.sh" ]
