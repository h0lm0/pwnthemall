FROM golang:1.23 AS go_builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o pwnthemall

#region Dev stage
FROM golang:1.23-alpine AS dev

WORKDIR /app

RUN apk --no-cache add ca-certificates openssh-client

RUN adduser -D -u 1000 -s /sbin/nologin app && \ 
    mkdir -p /home/app/.ssh && \
    chown -R app:app /home/app/.ssh && \
    chmod 700 /home/app/.ssh && \
    chown -R app:app /app

USER app

RUN mkdir -p /app/tmp
RUN go install github.com/air-verse/air@v1.61.7
COPY go.mod go.sum ./
RUN go mod download

COPY . .
COPY entrypoint.dev.sh /entrypoint.sh

EXPOSE 8080

CMD ["sh", "/entrypoint.sh"]
#endregion

#region Prod stage
FROM alpine:latest AS prod

WORKDIR /app

RUN apk --no-cache add ca-certificates openssh-client

RUN mkdir -p /app/config

RUN adduser -D -u 1000 -s /sbin/nologin app && \ 
    mkdir -p /home/app/.ssh && \
    chown -R app:app /home/app/.ssh && \
    chmod 700 /home/app/.ssh && \
    chown -R app:app /app

USER app

COPY config/casbin_model.conf /app/config/
COPY config/casbin_policies.csv /app/config/
COPY --from=go_builder /app/pwnthemall /app/pwnthemall
COPY entrypoint.prod.sh /entrypoint.sh

EXPOSE 8080

CMD ["sh", "/entrypoint.sh"]
#endregion