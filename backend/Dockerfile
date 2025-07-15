FROM golang:1.23 AS go_builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o pwnthemall

FROM alpine:latest

WORKDIR /app

RUN apk --no-cache add ca-certificates

COPY config/casbin_model.conf /app/
COPY config/casbin_policies.csv /app/
COPY --from=go_builder /app/pwnthemall /app/pwnthemall

EXPOSE 8080

CMD ["/app/pwnthemall"]
# CMD ["tail", "-f", "/dev/null"]
