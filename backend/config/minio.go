package config

import (
	"log"
	"os"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

var FS *minio.Client

func ConnectMinio() *minio.Client {
	endpoint := "minio:9000"
	useSSL := false

	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(os.Getenv("MINIO_ROOT_USER"), os.Getenv("MINIO_ROOT_PASSWORD"), ""),
		Secure: useSSL,
	})
	if err != nil {
		log.Fatalln(err)
	}
	FS = minioClient
	return minioClient
}
