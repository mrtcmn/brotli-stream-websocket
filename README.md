# 🚀 WebSocket Compression Comparison

A real-time WebSocket streaming application that compares **Zstd**, **Brotli**, **Gzip**, and **No Compression** for high-frequency data transmission. Built with **Bun** and **Elysia** based on the article "How to Stream Big Data Fast with Compression & WebSockets".

## 🎯 Features

- **Real-time comparison** of four compression methods side-by-side
- **WebSocket streaming** every 2 seconds with large datasets
- **Beautiful modern UI** with live statistics and performance metrics
- **Client-side decompression** using WebAssembly for Brotli and Zstd
- **Built-in compression** using Bun's native zlib and zstd support
- **Performance tracking** with savings calculations and throughput metrics

## 🏗️ Architecture

### Backend (Bun + Elysia)
- **Four WebSocket endpoints**: `/feed/none`, `/feed/gzip`, `/feed/brotli`, `/feed/zstd`
- **Compression implementations**:
  - **None**: JSON (no compression)
  - **Gzip**: Bun's `zlib.gzipSync()` + base64 encoding
  - **Brotli**: Bun's `zlib.brotliCompressSync()` + base64 encoding
  - **Zstd**: Bun's `Bun.zstdCompressSync()` + base64 encoding
- **Large dataset generation** with 1000 realistic price data items per message

### Frontend (Vanilla JavaScript + WebAssembly)
- **Four separate WebSocket connections** for each compression type
- **Brotli WASM** for client-side decompression (`brotli-wasm` package)
- **Zstd WASM** for client-side decompression (`@bokuweb/zstd-wasm` package)
- **Native Compression Streams API** for gzip decompression
- **Live statistics** showing message counts, bandwidth usage, and compression savings

## 📊 Compression Results

Based on large JSON datasets (1000 items, ~400KB uncompressed):

| Method | Size | Savings | Use Case |
|--------|------|---------|----------|
| **None** | ~400KB | 0% | Development/Testing |
| **Gzip** | ~80KB | ~80% | Standard web compression |
| **Brotli** | ~60KB | ~85% | High-frequency streaming |
| **Zstd** | ~55KB | ~86% | High-performance streaming |

**Zstd and Brotli provide the best compression for large datasets!**

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh) v1.0.0 or higher

### Installation & Run

```bash
# Clone the repository
git clone <your-repo-url>
cd brotli-stream-websocket

# Install dependencies
bun install

# Start the development server
bun run dev
```

### Usage

1. Open your browser to `http://localhost:3001`
2. Select which compression methods to compare
3. Click **"🎯 Start Streaming"** to begin the comparison
4. Watch the real-time feeds and statistics update
5. Use **"🧹 Clear Data"** to reset metrics
6. Click **"⏹️ Stop Streaming"** to halt the demo

## 📡 API Endpoints

### HTTP Routes
- `GET /` - Main application interface
- `GET /health` - Server health check

### WebSocket Routes
- `ws://localhost:3001/feed/none` - Uncompressed data stream
- `ws://localhost:3001/feed/gzip` - Gzip compressed stream
- `ws://localhost:3001/feed/brotli` - Brotli compressed stream
- `ws://localhost:3001/feed/zstd` - Zstd compressed stream

## 🛠️ Technical Implementation

### Server-Side Compression

```typescript
// Brotli compression optimized for streaming performance
function compressWithBrotli(data: unknown) {
  const jsonString = JSON.stringify(data);
  const originalBuffer = Buffer.from(jsonString);
  const compressedBuffer = zlib.brotliCompressSync(originalBuffer, {
    params: {
      [zlib.constants.BROTLI_PARAM_MODE]: 0,     // generic mode (best for mixed data)
      [zlib.constants.BROTLI_PARAM_QUALITY]: 10, // high quality for better compression
      [zlib.constants.BROTLI_PARAM_LGWIN]: 15,   // window size optimization
      [zlib.constants.BROTLI_PARAM_LGBLOCK]: 20, // block size optimization
    },
  });
  
  return {
    compressed: compressedBuffer.toString("base64"),
    originalSize: originalBuffer.length,
    compressedSize: compressedBuffer.length
  };
}

// Zstd compression with balanced settings
function compressWithZstd(data: unknown) {
  const jsonString = JSON.stringify(data);
  const originalBuffer = Buffer.from(jsonString);
  const compressedBuffer = Bun.zstdCompressSync(originalBuffer, { level: 6 });
  
  return {
    compressed: compressedBuffer.toString("base64"),
    originalSize: originalBuffer.length,
    compressedSize: compressedBuffer.length
  };
}
```

### Client-Side Decompression

```javascript
// Brotli decompression using WebAssembly
const bytes = Uint8Array.from(atob(message), c => c.charCodeAt(0));
const decompressed = brotli.decompress(bytes);
const jsonStr = new TextDecoder().decode(decompressed);
const data = JSON.parse(jsonStr);

// Zstd decompression using WebAssembly  
const bytes = Uint8Array.from(atob(message), c => c.charCodeAt(0));
const decompressed = zstd.decompress(bytes);
const jsonStr = new TextDecoder().decode(decompressed);
const data = JSON.parse(jsonStr);

// Gzip decompression using Compression Streams API
const bytes = Uint8Array.from(atob(message), c => c.charCodeAt(0));
const stream = new DecompressionStream('gzip');
const writer = stream.writable.getWriter();
const reader = stream.readable.getReader();

writer.write(bytes);
writer.close();
const { value } = await reader.read();
const jsonStr = new TextDecoder().decode(value);
const data = JSON.parse(jsonStr);
```

## 📈 Use Cases

### High-Frequency Trading
- **Stock prices**: 50-60% bandwidth savings
- **Market depth**: Even better compression ratios due to repeated fields
- **News feeds**: Excellent compression for text-heavy content

### Gaming
- **Player positions**: Good compression for coordinate data
- **Chat messages**: Excellent text compression
- **Game state**: Significant savings on JSON state objects

### IoT & Sensors
- **Sensor readings**: Great for repeated field names
- **Time series**: Excellent compression ratios
- **Device telemetry**: Significant bandwidth reduction

## 🔧 Configuration

### Compression Quality Settings

```typescript
// Brotli quality levels (0-11)
// 0-3: Fast compression, larger files
// 4-6: Balanced (recommended for real-time)
// 7-9: Better compression, slower
// 10-11: Maximum compression, very slow

[zlib.constants.BROTLI_PARAM_QUALITY]: 10 // High quality for best compression

// Zstd compression levels (1-22)
// 1-3: Fast compression
// 4-9: Balanced (recommended for streaming)
// 10+: High compression, slower
{ level: 6 } // Balanced compression for streaming
```

### Message Frequency

```typescript
// Adjust streaming frequency (current: 1 msg every 2 seconds)
setInterval(() => {
  // Send large dataset messages...
}, 2000); // Change interval here (2000ms = 2 seconds)
```

## 🧪 Performance Testing

The application includes built-in performance metrics:
- **Message throughput** (messages/second)
- **Bandwidth usage** per compression type
- **Compression savings** percentage
- **Best compression** method identification
- **Total data saved** across all methods

## 🏆 Article Implementation

This project is an enhanced implementation of the concepts from:
**"How to Stream Big Data Fast with Compression & WebSockets"**

### Key Enhancements:
- ✅ **Four compression methods** including modern Zstd
- ✅ **Side-by-side comparison** of all compression types
- ✅ **Large dataset streaming** (1000 items per message)
- ✅ **Real-time statistics** and visual feedback
- ✅ **Production-ready code** with error handling
- ✅ **Modern UI** with responsive design and selectable comparisons
- ✅ **WebAssembly support** for client-side decompression
- ✅ **Comprehensive documentation** and usage examples

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Article: "How to Stream Big Data Fast with Compression & WebSockets"
- [Bun](https://bun.sh) - JavaScript runtime and toolkit
- [Elysia](https://elysiajs.com) - Ergonomic web framework
- [brotli-wasm](https://github.com/foliojs/brotli.js) - WebAssembly Brotli implementation
- [@bokuweb/zstd-wasm](https://github.com/bokuweb/zstd-wasm) - WebAssembly Zstd implementation
