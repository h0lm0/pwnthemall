FROM alpine:3.20

RUN apk add --no-cache \
    openssh \
    bash \
    libvirt \
    libvirt-daemon \
    qemu-system-x86_64 \
    qemu-img \
    dbus \
    polkit \
    shadow \
    netcat-openbsd

# Set default UID for libvirt user (will be overridden via build/run-time env + pta-cli.sh)
ARG LIBVIRT_UID
ENV LIBVIRT_UID $LIBVIRT_UID

ARG LIBVIRT_WORKER_PASSWORD
ENV LIBVIRT_WORKER_PASSWORD $LIBVIRT_WORKER_PASSWORD

RUN adduser -D -G libvirt -u ${LIBVIRT_UID} -s /bin/bash libvirt-user && \
    mkdir -p /home/libvirt-user/.ssh && \
    chown -R libvirt-user /home/libvirt-user/.ssh && \
    chmod 700 /home/libvirt-user/.ssh

# RUN addgroup libvirt-user libvirt

RUN echo "libvirt-user:${LIBVIRT_WORKER_PASSWORD}" | chpasswd

RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config && \
    sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config && \
    sed -i 's/#UsePAM yes/UsePAM yes/' /etc/ssh/sshd_config && \
    sed -i 's/AllowTcpForwarding no/AllowTcpForwarding yes/' /etc/ssh/sshd_config && \
    echo 'StreamLocalBindUnlink yes' >> /etc/ssh/sshd_config && \
    echo 'AllowStreamLocalForwarding yes' >> /etc/ssh/sshd_config && \
    echo 'PermitOpen any' >> /etc/ssh/sshd_config


RUN mkdir -p /var/run/libvirt \
             /var/lib/libvirt/images \
             /var/lib/libvirt/qemu \
             /var/log/libvirt \
             /etc/libvirt/qemu && \
    chown -R root:libvirt /var/run/libvirt && \
    chmod 775 /var/run/libvirt

RUN echo 'unix_sock_group = "libvirt"' >> /etc/libvirt/libvirtd.conf && \
    echo 'unix_sock_rw_perms = "0770"' >> /etc/libvirt/libvirtd.conf && \
    echo 'auth_unix_ro = "none"' >> /etc/libvirt/libvirtd.conf && \
    echo 'auth_unix_rw = "none"' >> /etc/libvirt/libvirtd.conf && \
    echo 'log_outputs = "1:file:/var/log/libvirt/libvirtd.log"' >> /etc/libvirt/libvirtd.conf && \
    echo 'log_level = 3' >> /etc/libvirt/libvirtd.conf

RUN dbus-uuidgen > /var/lib/dbus/machine-id

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 22

ENTRYPOINT ["/bin/bash", "/entrypoint.sh"]
