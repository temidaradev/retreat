package utils

import (
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"regexp"

	"receiptlocker/internal/logging"
)

const (
	maxPhotoSizeBytes = 5 * 1024 * 1024
)

var (
	allowedMIMEs = map[string]string{
		"image/jpeg": "jpg",
		"image/png":  "png",
		"image/webp": "webp",
	}

	validNameRe = regexp.MustCompile(`[^a-zA-Z0-9_-]`)
)

func GetUploadsDir() string {
	if v := os.Getenv("UPLOADS_DIR"); v != "" {
		return v
	}
	return "/tmp/uploads"
}

func SavePhoto(userID, receiptID, declaredMIME string, r io.Reader) (string, string, error) {
	userID = sanitizeName(userID)
	receiptID = sanitizeName(receiptID)

	limited := io.LimitedReader{R: r, N: maxPhotoSizeBytes + 1}
	data, err := io.ReadAll(&limited)
	if err != nil {
		return "", "", fmt.Errorf("failed to read upload: %w", err)
	}
	if int64(len(data)) > maxPhotoSizeBytes {
		return "", "", fmt.Errorf("file too large")
	}

	probeLen := minInt(512, len(data))
	actualMIME := http.DetectContentType(data[:probeLen])
	if actualMIME == "application/octet-stream" && declaredMIME != "" {
		actualMIME = declaredMIME
	}

	ext, ok := allowedMIMEs[actualMIME]
	if !ok {
		return "", "", fmt.Errorf("unsupported media type")
	}

	baseDir := GetUploadsDir()
	userDir := filepath.Join(baseDir, userID)
	if err := os.MkdirAll(userDir, 0755); err != nil {
		return "", "", fmt.Errorf("failed to create directories: %w", err)
	}

	filename := fmt.Sprintf("%s.%s", receiptID, ext)
	fullPath := filepath.Join(userDir, filename)

	tmpPath := fullPath + ".tmp"
	if err := os.WriteFile(tmpPath, data, 0644); err != nil {
		return "", "", fmt.Errorf("failed to write file: %w", err)
	}
	if err := os.Rename(tmpPath, fullPath); err != nil {
		_ = os.Remove(tmpPath)
		return "", "", fmt.Errorf("failed to finalize file: %w", err)
	}

	publicURL := "/uploads/" + userID + "/" + filename

	logging.Info("Photo saved", map[string]interface{}{
		"user_id":    userID,
		"receipt_id": receiptID,
		"mime":       actualMIME,
		"bytes":      len(data),
		"path":       fullPath,
	})

	return publicURL, actualMIME, nil
}

func sanitizeName(name string) string {
	if name == "" {
		return "unknown"
	}

	name = filepath.Base(name)
	name = validNameRe.ReplaceAllString(name, "-")
	return name
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func mimeFromFilename(filename string) string {
	if ext := filepath.Ext(filename); ext != "" {
		return mime.TypeByExtension(ext)
	}
	return ""
}
