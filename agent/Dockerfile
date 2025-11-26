FROM golang:1.24-alpine AS builder

WORKDIR /build

COPY . .

RUN go build -o /bin/agent ./cmd/agent/main.go

FROM alpine:3.22

RUN apk add --no-cache iptables

COPY --from=builder /bin/agent /usr/local/bin/

ENTRYPOINT ["agent"]
