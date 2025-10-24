package logging

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"runtime"
	"time"
)

// LogLevel represents the logging level
type LogLevel int

const (
	DEBUG LogLevel = iota
	INFO
	WARN
	ERROR
	FATAL
)

// Logger represents a structured logger
type Logger struct {
	level  LogLevel
	logger *log.Logger
}

// LogEntry represents a log entry
type LogEntry struct {
	Timestamp string                 `json:"timestamp"`
	Level     string                 `json:"level"`
	Message   string                 `json:"message"`
	Fields    map[string]interface{} `json:"fields,omitempty"`
	File      string                 `json:"file,omitempty"`
	Line      int                    `json:"line,omitempty"`
}

var (
	defaultLogger *Logger
	logLevel      LogLevel
)

func init() {
	// Set log level from environment
	level := os.Getenv("LOG_LEVEL")
	switch level {
	case "debug":
		logLevel = DEBUG
	case "info":
		logLevel = INFO
	case "warn":
		logLevel = WARN
	case "error":
		logLevel = ERROR
	case "fatal":
		logLevel = FATAL
	default:
		logLevel = INFO
	}

	defaultLogger = &Logger{
		level:  logLevel,
		logger: log.New(os.Stdout, "", 0),
	}
}

// NewLogger creates a new logger instance
func NewLogger(level LogLevel) *Logger {
	return &Logger{
		level:  level,
		logger: log.New(os.Stdout, "", 0),
	}
}

// Debug logs a debug message
func (l *Logger) Debug(message string, fields ...map[string]interface{}) {
	if l.level <= DEBUG {
		l.log("DEBUG", message, fields...)
	}
}

// Info logs an info message
func (l *Logger) Info(message string, fields ...map[string]interface{}) {
	if l.level <= INFO {
		l.log("INFO", message, fields...)
	}
}

// Warn logs a warning message
func (l *Logger) Warn(message string, fields ...map[string]interface{}) {
	if l.level <= WARN {
		l.log("WARN", message, fields...)
	}
}

// Error logs an error message
func (l *Logger) Error(message string, fields ...map[string]interface{}) {
	if l.level <= ERROR {
		l.log("ERROR", message, fields...)
	}
}

// Fatal logs a fatal message and exits
func (l *Logger) Fatal(message string, fields ...map[string]interface{}) {
	l.log("FATAL", message, fields...)
	os.Exit(1)
}

// log creates a structured log entry
func (l *Logger) log(level, message string, fields ...map[string]interface{}) {
	entry := LogEntry{
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Level:     level,
		Message:   message,
		Fields:    make(map[string]interface{}),
	}

	// Add caller information for debug and error levels
	if level == "DEBUG" || level == "ERROR" || level == "FATAL" {
		_, file, line, ok := runtime.Caller(3)
		if ok {
			entry.File = file
			entry.Line = line
		}
	}

	// Merge fields
	for _, fieldMap := range fields {
		for k, v := range fieldMap {
			entry.Fields[k] = v
		}
	}

	// Output based on format
	if os.Getenv("LOG_FORMAT") == "json" {
		jsonData, _ := json.Marshal(entry)
		l.logger.Println(string(jsonData))
	} else {
		// Human readable format
		fileInfo := ""
		if entry.File != "" {
			fileInfo = fmt.Sprintf(" [%s:%d]", entry.File, entry.Line)
		}
		
		fieldsStr := ""
		if len(entry.Fields) > 0 {
			fieldsData, _ := json.Marshal(entry.Fields)
			fieldsStr = fmt.Sprintf(" %s", string(fieldsData))
		}
		
		l.logger.Printf("[%s] %s: %s%s%s", entry.Timestamp, level, message, fileInfo, fieldsStr)
	}
}

// Package level functions for convenience
func Debug(message string, fields ...map[string]interface{}) {
	defaultLogger.Debug(message, fields...)
}

func Info(message string, fields ...map[string]interface{}) {
	defaultLogger.Info(message, fields...)
}

func Warn(message string, fields ...map[string]interface{}) {
	defaultLogger.Warn(message, fields...)
}

func Error(message string, fields ...map[string]interface{}) {
	defaultLogger.Error(message, fields...)
}

func Fatal(message string, fields ...map[string]interface{}) {
	defaultLogger.Fatal(message, fields...)
}

// WithFields creates a logger with predefined fields
func WithFields(fields map[string]interface{}) *Logger {
	return &Logger{
		level:  defaultLogger.level,
		logger: defaultLogger.logger,
	}
}
