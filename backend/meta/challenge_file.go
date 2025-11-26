package meta

// FileMetadata represents downloadable file information
type FileMetadata struct {
	Name        string `json:"name"`
	Size        int64  `json:"size"`
	ContentType string `json:"contentType"`
}
