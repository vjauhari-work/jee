FROM golang:1.26-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o jee-backend .

# alpine already ships ca-certificates-bundle (/etc/ssl/certs)
FROM alpine:3.22
WORKDIR /app
COPY --from=builder /app/jee-backend .
RUN addgroup -S app && adduser -S app -G app \
    && mkdir -p /app/uploads \
    && chown -R app:app /app
USER app
EXPOSE 8080
CMD ["./jee-backend"]
