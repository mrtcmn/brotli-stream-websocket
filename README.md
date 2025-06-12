# 🚀 Brotli Stream WebSocket Comparison

A real-time WebSocket streaming application that compares **Brotli**, **Gzip**, and **No Compression** for high-frequency data transmission. Built with **Bun** and **Elysia** based on the article "How to Stream Big Data Fast with Brotli & WebSockets".

## 🎯 Features

- **Real-time comparison** of three compression methods side-by-side
- **WebSocket streaming** at 4 messages/second (250ms intervals)
- **Beautiful modern UI** with live statistics and performance metrics
- **Client-side decompression** using WebAssembly for Brotli
- **Built-in compression** using Bun's native zlib support
- **Performance tracking** with savings calculations and throughput metrics

## 🏗️ Architecture

### Backend (Bun + Elysia)
- **Three WebSocket endpoints**: `/feed/none`, `/feed/gzip`, `/feed/brotli`
- **Compression implementations**:
  - **None**: Base64 encoded JSON (no compression)
  - **Gzip**: Bun's `zlib.gzipSync()` + base64 encoding
  - **Brotli**: Bun's `zlib.brotliCompressSync()` + base64 encoding
- **Realistic price data** generation with market-like fluctuations

### Frontend (Vanilla JavaScript + WebAssembly)
- **Three separate WebSocket connections** for each compression type
- **Brotli WASM** for client-side decompression (`brotli-wasm` package)
- **Native Compression Streams API** for gzip decompression
- **Live statistics** showing message counts, bandwidth usage, and compression savings

## 📊 Compression Results

Based on typical JSON market data (~400-500 bytes):

| Method | Size | Savings | Use Case |
|--------|------|---------|----------|
| **None** | ~500 bytes | 0% | Development/Testing |
| **Gzip** | ~300 bytes | ~40% | Standard web compression |
| **Brotli** | ~250 bytes | ~50% | High-frequency streaming |

**Brotli typically saves an additional 20% over Gzip** for JSON data!

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

1. Open your browser to `http://localhost:3000`
2. Click **"🎯 Start Streaming"** to begin the comparison
3. Watch the real-time feeds and statistics update
4. Use **"🧹 Clear Data"** to reset metrics
5. Click **"⏹️ Stop Streaming"** to halt the demo

## 📡 API Endpoints

### HTTP Routes
- `GET /` - Main application interface
- `GET /health` - Server health check

### WebSocket Routes
- `ws://localhost:3001/feed/none` - Uncompressed data stream
- `ws://localhost:3001/feed/gzip` - Gzip compressed stream
- `ws://localhost:3001/feed/brotli` - Brotli compressed stream

## 🛠️ Technical Implementation

### Server-Side Compression

```typescript
// Brotli compression with quality 7 (balance of speed vs size)
function compressWithBrotli(data: unknown) {
  const jsonString = JSON.stringify(data);
  const originalBuffer = Buffer.from(jsonString);
  const compressedBuffer = zlib.brotliCompressSync(originalBuffer, {
    params: {
      [zlib.constants.BROTLI_PARAM_MODE]: 1,    // text mode
      [zlib.constants.BROTLI_PARAM_QUALITY]: 7, // 0–11 (7 = sweet spot)
    },
  });
  
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
const decompressed = brotliWasm.decompress(bytes);
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

[zlib.constants.BROTLI_PARAM_QUALITY]: 7 // Sweet spot for streaming
```

### Message Frequency

```typescript
// Adjust streaming frequency (current: 4 msgs/sec)
setInterval(() => {
  // Send messages...
}, 250); // Change interval here
```

## 🧪 Performance Testing

The application includes built-in performance metrics:
- **Message throughput** (messages/second)
- **Bandwidth usage** per compression type
- **Compression savings** percentage
- **Best compression** method identification
- **Total data saved** across all methods

## 🏆 Article Implementation

This project is a complete implementation of the concepts from:
**"How to Stream Big Data Fast with Brotli & WebSockets"**

### Key Improvements Over Article:
- ✅ **Side-by-side comparison** of all three methods
- ✅ **Real-time statistics** and visual feedback
- ✅ **Production-ready code** with error handling
- ✅ **Modern UI** with responsive design
- ✅ **Comprehensive documentation** and usage examples

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Article: "How to Stream Big Data Fast with Brotli & WebSockets"
- [Bun](https://bun.sh) - JavaScript runtime and toolkit
- [Elysia](https://elysiajs.com) - Ergonomic web framework
- [brotli-wasm](https://github.com/foliojs/brotli.js) - WebAssembly Brotli implementation
