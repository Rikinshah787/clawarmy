---
name: go-patterns
description: "Go/Golang best practices, patterns, and idioms for building performant, concurrent applications."
version: 2.0.0
author: ClawArmy
risk: safe
source: clawarmy
tags: ["go", "golang", "concurrency", "backend", "performance"]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Go (Golang) Best Practices & Patterns

> Simple, efficient, concurrent. The Go way.

## Core Philosophy

> "Don't communicate by sharing memory; share memory by communicating."

## Project Structure

```
project/
├── cmd/
│   └── myapp/
│       └── main.go          # Entry point
├── internal/
│   ├── handler/             # HTTP handlers
│   ├── service/             # Business logic
│   └── repository/          # Data access
├── pkg/
│   └── utils/               # Reusable packages
├── api/
│   └── openapi.yaml         # API specs
├── go.mod
└── go.sum
```

---

## Error Handling

### ✅ DO: Explicit Error Handling

```go
// Always handle errors explicitly
result, err := doSomething()
if err != nil {
    return fmt.Errorf("failed to do something: %w", err)
}

// Wrap errors with context
if err := db.Create(&user); err != nil {
    return fmt.Errorf("creating user %s: %w", user.Email, err)
}
```

### ❌ DON'T: Ignore Errors

```go
// BAD: Ignoring errors
result, _ := doSomething()

// BAD: No context
if err != nil {
    return err
}
```

---

## Concurrency Patterns

### Goroutines with sync.WaitGroup

```go
func processItems(items []Item) {
    var wg sync.WaitGroup
    
    for _, item := range items {
        wg.Add(1)
        go func(i Item) {
            defer wg.Done()
            process(i)
        }(item)
    }
    
    wg.Wait()
}
```

### Channel Patterns

```go
// Worker pool
func workerPool(jobs <-chan Job, results chan<- Result, workers int) {
    var wg sync.WaitGroup
    
    for i := 0; i < workers; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for job := range jobs {
                results <- process(job)
            }
        }()
    }
    
    wg.Wait()
    close(results)
}
```

### Context for Cancellation

```go
func fetchWithTimeout(ctx context.Context, url string) ([]byte, error) {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()
    
    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, err
    }
    
    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    return io.ReadAll(resp.Body)
}
```

---

## Interface Design

### Small Interfaces

```go
// ✅ GOOD: Small, focused interfaces
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

// Compose when needed
type ReadWriter interface {
    Reader
    Writer
}
```

### Accept Interfaces, Return Structs

```go
// ✅ GOOD: Accept interface
func ProcessData(r io.Reader) error {
    // Can accept any Reader
}

// ✅ GOOD: Return concrete type
func NewService() *Service {
    return &Service{}
}
```

---

## HTTP Handlers Pattern

### Clean Handler Structure

```go
type Handler struct {
    service *Service
    logger  *slog.Logger
}

func NewHandler(svc *Service, log *slog.Logger) *Handler {
    return &Handler{service: svc, logger: log}
}

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    
    user, err := h.service.GetUser(r.Context(), id)
    if err != nil {
        if errors.Is(err, ErrNotFound) {
            http.Error(w, "user not found", http.StatusNotFound)
            return
        }
        h.logger.Error("failed to get user", "error", err)
        http.Error(w, "internal error", http.StatusInternalServerError)
        return
    }
    
    json.NewEncoder(w).Encode(user)
}
```

---

## Testing

### Table-Driven Tests

```go
func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive", 2, 3, 5},
        {"negative", -1, -1, -2},
        {"zero", 0, 0, 0},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := Add(tt.a, tt.b)
            if result != tt.expected {
                t.Errorf("Add(%d, %d) = %d; want %d", 
                    tt.a, tt.b, result, tt.expected)
            }
        })
    }
}
```

### Mocking with Interfaces

```go
type UserRepository interface {
    Get(ctx context.Context, id string) (*User, error)
}

// Mock for testing
type mockUserRepo struct {
    user *User
    err  error
}

func (m *mockUserRepo) Get(ctx context.Context, id string) (*User, error) {
    return m.user, m.err
}
```

---

## Performance Patterns

### Avoid Allocations in Hot Paths

```go
// ✅ GOOD: Reuse buffers
var bufPool = sync.Pool{
    New: func() interface{} {
        return new(bytes.Buffer)
    },
}

func process() {
    buf := bufPool.Get().(*bytes.Buffer)
    defer func() {
        buf.Reset()
        bufPool.Put(buf)
    }()
    // Use buffer
}
```

### Pre-allocate Slices

```go
// ✅ GOOD: Pre-allocate when size known
users := make([]User, 0, len(ids))
for _, id := range ids {
    users = append(users, getUser(id))
}

// ❌ BAD: Multiple reallocations
var users []User
for _, id := range ids {
    users = append(users, getUser(id))
}
```

---

## Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| `panic` for errors | Return errors |
| Global mutable state | Dependency injection |
| `init()` side effects | Explicit initialization |
| Naked goroutines | Manage lifecycle |
| Empty interface `any` | Typed interfaces |

---

## Linting & Formatting

```bash
# Format code
gofmt -w .

# Lint
golangci-lint run

# Vet
go vet ./...

# Test with coverage
go test -cover ./...
```

---

## When To Use Go

- High-performance APIs
- Microservices
- CLI tools
- Concurrent processing
- DevOps tooling
- Network services

---

> **Remember:** "Clear is better than clever." - Go Proverbs
