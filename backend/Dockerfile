FROM golang:1.23 AS go_builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o pwnthemall

FROM alpine:latest

WORKDIR /app

RUN apk --no-cache add ca-certificates openssh-client

COPY config/casbin_model.conf /app/
COPY config/casbin_policies.csv /app/
COPY --from=go_builder /app/pwnthemall /app/pwnthemall

RUN adduser -D -u 1000 app && \ 
    mkdir -p /home/app/.ssh && \
    chown -R app:app /home/app/.ssh && \
    chmod 700 /home/app/.ssh

USER app

EXPOSE 8080

CMD ["/app/pwnthemall"]
