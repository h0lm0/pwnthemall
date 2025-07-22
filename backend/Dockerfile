FROM golang:1.23 AS go_builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o pwnthemall

#region Dev stage
FROM golang:1.23 AS dev

WORKDIR /app

RUN go install github.com/air-verse/air@v1.61.7

RUN mkdir -p /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

EXPOSE 8080

CMD ["air"]
#endregion

#region Prod stage
FROM alpine:latest as prod

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

EXPOSE 8080

CMD ["/app/pwnthemall"]
#endregion