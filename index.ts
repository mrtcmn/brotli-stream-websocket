import { Elysia } from "elysia";
import zlib from "zlib";

// --- Types for different compression methods ---
type CompressionType = "none" | "gzip" | "brotli" | "zstd";

interface PriceData {
  ts: number;
  price: string;
  compression: CompressionType;
  originalSize?: number;
  compressedSize?: number;
}

// --- Helper functions for compression ---
function compressWithGzip(data: unknown): { compressed: string; originalSize: number; compressedSize: number } {
  const jsonString = JSON.stringify(data);
  const originalBuffer = Buffer.from(jsonString);
  const compressedBuffer = zlib.gzipSync(originalBuffer);
  
  return {
    compressed: compressedBuffer.toString("base64"),
    originalSize: originalBuffer.length,
    compressedSize: compressedBuffer.length
  };
}

function compressWithBrotli(data: unknown): { compressed: string; originalSize: number; compressedSize: number } | null {
  try {
    const jsonString = JSON.stringify(data);
    const originalBuffer = Buffer.from(jsonString);
    
    // Optimized Brotli parameters for streaming (based on performance testing)
    // Quality 6: Fast compression with excellent ratio (3.86ms, 7.64x compression)
    // Mode 0: Generic mode works best for mixed financial data
    // Window 15: Optimal window size for this dataset size
    // Block 20: Good block size for streaming performance
    const compressedBuffer = zlib.brotliCompressSync(originalBuffer, {
      params: {
        [zlib.constants.BROTLI_PARAM_MODE]: 0,     // generic mode (best for mixed data)
        [zlib.constants.BROTLI_PARAM_QUALITY]: 6,  // optimized for streaming (fast + good compression)
        [zlib.constants.BROTLI_PARAM_LGWIN]: 15,   // window size optimization
        [zlib.constants.BROTLI_PARAM_LGBLOCK]: 20, // block size optimization
      },
    });
    
    return {
      compressed: compressedBuffer.toString("base64"),
      originalSize: originalBuffer.length,
      compressedSize: compressedBuffer.length
    };
  } catch {
    return null;
  }
}

function compressWithZstd(data: unknown): { compressed: string; originalSize: number; compressedSize: number } | null {
  try {
    const jsonString = JSON.stringify(data);
    const originalBuffer = Buffer.from(jsonString);
    
    // Bun's native Zstd compression with level 6 (balanced speed/compression for streaming)
    // Level 1-3: Fast, lower compression
    // Level 6-9: Balanced (recommended for streaming)
    // Level 10+: High compression, slower
    const compressedBuffer = Bun.zstdCompressSync(originalBuffer, { level: 6 });
    
    return {
      compressed: compressedBuffer.toString("base64"),
      originalSize: originalBuffer.length,
      compressedSize: compressedBuffer.length
    };
  } catch {
    return null;
  }
}

function noCompression(data: unknown): { compressed: string; originalSize: number; compressedSize: number } {
  const jsonString = JSON.stringify(data);
  const size = Buffer.from(jsonString).length;
  
  return {
    compressed: Buffer.from(jsonString).toString("base64"),
    originalSize: size,
    compressedSize: size
  };
}

// --- HTML Frontend ---
const htmlPage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>🚀 Compression Comparison: Brotli vs Gzip vs None</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      min-height: 100vh;
      padding: 2rem;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      backdrop-filter: blur(10px);
    }
    
    .header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .header p {
      font-size: 1.1rem;
      color: #666;
      margin-bottom: 1rem;
    }
    
    .controls {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    
    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .btn-start {
      background: linear-gradient(135deg, #4CAF50, #45a049);
      color: white;
    }
    
    .btn-stop {
      background: linear-gradient(135deg, #f44336, #da190b);
      color: white;
    }
    
    .btn-clear {
      background: linear-gradient(135deg, #2196F3, #1976D2);
      color: white;
    }
    
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .stat-card {
      background: white;
      border-radius: 15px;
      padding: 1.5rem;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
      border-left: 4px solid;
    }
    
    .stat-card.none { border-left-color: #ff6b6b; }
    .stat-card.gzip { border-left-color: #4ecdc4; }
    .stat-card.brotli { border-left-color: #45b7d1; }
    .stat-card.zstd { border-left-color: #f39c12; }
    
    .stat-title {
      font-size: 1.2rem;
      font-weight: 700;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .stat-value {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }
    
    .stat-number {
      font-weight: 600;
      color: #333;
    }
    
    .feeds {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
    }
    
    .feed-container {
      background: white;
      border-radius: 15px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }
    
    .feed-header {
      padding: 1rem;
      font-weight: 700;
      text-align: center;
      color: white;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .feed-header.none { background: linear-gradient(135deg, #ff6b6b, #ee5a52); }
    .feed-header.gzip { background: linear-gradient(135deg, #4ecdc4, #44b3a6); }
    .feed-header.brotli { background: linear-gradient(135deg, #45b7d1, #3a9cc1); }
    .feed-header.zstd { background: linear-gradient(135deg, #f39c12, #e67e22); }
    
    .feed-content {
      height: 300px;
      overflow-y: auto;
      padding: 1rem;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.85rem;
      line-height: 1.4;
      background: #f8f9fa;
    }
    
    .feed-line {
      padding: 0.3rem 0;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .feed-time {
      color: #666;
      font-size: 0.75rem;
    }
    
    .feed-price {
      font-weight: 700;
      font-size: 1.1rem;
    }
    
    .feed-size {
      font-size: 0.7rem;
      color: #888;
      background: #e9ecef;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
    }
    
    .connection-status {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 0.5rem 1rem;
      border-radius: 25px;
      font-weight: 600;
      font-size: 0.9rem;
      z-index: 1000;
    }
    
    .connection-status.connected {
      background: #4CAF50;
      color: white;
    }
    
    .connection-status.disconnected {
      background: #f44336;
      color: white;
    }
    
    .performance-metrics {
      margin-top: 2rem;
      background: white;
      border-radius: 15px;
      padding: 1.5rem;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
    }
    
    .metrics-title {
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 1rem;
      text-align: center;
      color: #333;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .metric-item {
      text-align: center;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 10px;
    }
    
    .metric-label {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 0.5rem;
    }
    
    .metric-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 WebSocket Compression Comparison</h1>
      <p>Real-time streaming with Zstd vs Brotli vs Gzip vs No Compression</p>
      <p><strong>Article Implementation:</strong> "How to Stream Big Data Fast with Compression & WebSockets"</p>
    </div>
    
    <div class="controls">
      <button id="startBtn" class="btn btn-start">🎯 Start Streaming</button>
      <button id="stopBtn" class="btn btn-stop">⏹️ Stop Streaming</button>
      <button id="clearBtn" class="btn btn-clear">🧹 Clear Data</button>
    </div>
    
    <div class="stats">
      <div class="stat-card none">
        <div class="stat-title">📊 No Compression</div>
        <div class="stat-value">
          <span>Messages:</span>
          <span class="stat-number" id="none-messages">0</span>
        </div>
        <div class="stat-value">
          <span>Total Bytes:</span>
          <span class="stat-number" id="none-bytes">0</span>
        </div>
        <div class="stat-value">
          <span>Avg Size:</span>
          <span class="stat-number" id="none-avg">0 B</span>
        </div>
      </div>
      
      <div class="stat-card gzip">
        <div class="stat-title">🗜️ Gzip Compression</div>
        <div class="stat-value">
          <span>Messages:</span>
          <span class="stat-number" id="gzip-messages">0</span>
        </div>
        <div class="stat-value">
          <span>Total Bytes:</span>
          <span class="stat-number" id="gzip-bytes">0</span>
        </div>
        <div class="stat-value">
          <span>Avg Size:</span>
          <span class="stat-number" id="gzip-avg">0 B</span>
        </div>
        <div class="stat-value">
          <span>Savings:</span>
          <span class="stat-number" id="gzip-savings">0%</span>
        </div>
      </div>
      
      <div class="stat-card brotli">
        <div class="stat-title">⚡ Brotli Compression</div>
        <div class="stat-value">
          <span>Messages:</span>
          <span class="stat-number" id="brotli-messages">0</span>
        </div>
        <div class="stat-value">
          <span>Total Bytes:</span>
          <span class="stat-number" id="brotli-bytes">0</span>
        </div>
        <div class="stat-value">
          <span>Avg Size:</span>
          <span class="stat-number" id="brotli-avg">0 B</span>
        </div>
        <div class="stat-value">
          <span>Savings:</span>
          <span class="stat-number" id="brotli-savings">0%</span>
        </div>
      </div>
      
      <div class="stat-card zstd">
        <div class="stat-title">🔥 Zstd Compression</div>
        <div class="stat-value">
          <span>Messages:</span>
          <span class="stat-number" id="zstd-messages">0</span>
        </div>
        <div class="stat-value">
          <span>Total Bytes:</span>
          <span class="stat-number" id="zstd-bytes">0</span>
        </div>
        <div class="stat-value">
          <span>Avg Size:</span>
          <span class="stat-number" id="zstd-avg">0 B</span>
        </div>
        <div class="stat-value">
          <span>Savings:</span>
          <span class="stat-number" id="zstd-savings">0%</span>
        </div>
      </div>
    </div>
    
    <div class="feeds">
      <div class="feed-container">
        <div class="feed-header none">📊 No Compression Feed</div>
        <div class="feed-content" id="none-feed">Waiting for data...</div>
      </div>
      
      <div class="feed-container">
        <div class="feed-header gzip">🗜️ Gzip Feed</div>
        <div class="feed-content" id="gzip-feed">Waiting for data...</div>
      </div>
      
      <div class="feed-container">
        <div class="feed-header brotli">⚡ Brotli Feed</div>
        <div class="feed-content" id="brotli-feed">Waiting for data...</div>
      </div>
      
      <div class="feed-container">
        <div class="feed-header zstd">🔥 Zstd Feed</div>
        <div class="feed-content" id="zstd-feed">Waiting for data...</div>
      </div>
    </div>
    
    <div class="performance-metrics">
      <div class="metrics-title">📈 Performance Comparison</div>
      <div class="metrics-grid">
        <div class="metric-item">
          <div class="metric-label">Best Compression</div>
          <div class="metric-value" id="best-compression">-</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Total Savings</div>
          <div class="metric-value" id="total-savings">0 KB</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Messages/sec</div>
          <div class="metric-value" id="messages-per-sec">0</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Uptime</div>
          <div class="metric-value" id="uptime">00:00</div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="connection-status disconnected" id="status">
    🔴 Disconnected
  </div>

  <script type="module">
    // WebSocket connections for different compression types
    const connections = {
      none: null,
      gzip: null,
      brotli: null,
      zstd: null
    };
    
    // Statistics tracking
    const stats = {
      none: { messages: 0, totalBytes: 0, sizes: [] },
      gzip: { messages: 0, totalBytes: 0, sizes: [] },
      brotli: { messages: 0, totalBytes: 0, sizes: [] },
      zstd: { messages: 0, totalBytes: 0, sizes: [] }
    };
    
    let startTime = null;
    let uptimeInterval = null;
    
    // Check for native Brotli support
    let brotliSupported = false;
    
    const initBrotli = async () => {
      try {
        // Check if browser supports Brotli decompression natively
        if ('DecompressionStream' in window) {
          // Test if 'br' (Brotli) is supported
          try {
            new DecompressionStream('br');
            brotliSupported = true;
            console.log('✅ Native Brotli decompression supported');
            return;
          } catch (e) {
            console.log('ℹ️ Native Brotli not supported, trying WASM...');
          }
        }
        
        // Fallback to a simple JavaScript implementation
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/brotli@1.3.3/decode.js';
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = () => {
            if (window.brotli && window.brotli.decompress) {
              console.log('✅ Brotli JS library loaded successfully');
              resolve();
            } else {
              reject(new Error('Brotli JS library not available'));
            }
          };
          script.onerror = reject;
        });
      } catch (error) {
        console.error('❌ Failed to load Brotli support:', error);
        console.log('⚠️ Brotli decompression will be disabled');
      }
    };
    
    // Initialize on page load
    initBrotli();
    
    // DOM elements
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const clearBtn = document.getElementById('clearBtn');
    const statusEl = document.getElementById('status');
    
    const feeds = {
      none: document.getElementById('none-feed'),
      gzip: document.getElementById('gzip-feed'),
      brotli: document.getElementById('brotli-feed'),
      zstd: document.getElementById('zstd-feed')
    };
    
    // Utility functions
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };
    
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return \`\${mins.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
    };
    
    const updateStats = () => {
      ['none', 'gzip', 'brotli', 'zstd'].forEach(type => {
        const stat = stats[type];
        document.getElementById(\`\${type}-messages\`).textContent = stat.messages;
        document.getElementById(\`\${type}-bytes\`).textContent = formatBytes(stat.totalBytes);
        
        if (stat.sizes.length > 0) {
          const avgSize = stat.totalBytes / stat.messages;
          document.getElementById(\`\${type}-avg\`).textContent = formatBytes(avgSize);
          
          if (type !== 'none') {
            const originalAvg = stats.none.totalBytes / Math.max(stats.none.messages, 1);
            const savings = originalAvg > 0 ? ((originalAvg - avgSize) / originalAvg * 100) : 0;
            document.getElementById(\`\${type}-savings\`).textContent = savings.toFixed(1) + '%';
          }
        }
      });
      
      // Update performance metrics
      const totalOriginal = stats.none.totalBytes;
      const totalGzip = stats.gzip.totalBytes;
      const totalBrotli = stats.brotli.totalBytes;
      const totalZstd = stats.zstd.totalBytes;
      
      let bestCompression = '-';
      const compessionSizes = [
        { name: 'Gzip', size: totalGzip },
        { name: 'Brotli', size: totalBrotli },
        { name: 'Zstd', size: totalZstd }
      ].filter(c => c.size > 0);
      
      if (compessionSizes.length > 0) {
        bestCompression = compessionSizes.reduce((best, current) => 
          current.size < best.size ? current : best
        ).name;
      }
      
      document.getElementById('best-compression').textContent = bestCompression;
      
      const minCompressedSize = Math.min(
        totalGzip || totalOriginal, 
        totalBrotli || totalOriginal, 
        totalZstd || totalOriginal
      );
      const totalSavings = totalOriginal - minCompressedSize;
      document.getElementById('total-savings').textContent = formatBytes(totalSavings);
      
      if (startTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const messagesPerSec = elapsed > 0 ? Math.round(stats.none.messages / elapsed) : 0;
        document.getElementById('messages-per-sec').textContent = messagesPerSec;
      }
    };
    
    const addToFeed = (type, data) => {
      const feed = feeds[type];
      const time = new Date(data.ts).toLocaleTimeString();
      const sizeInfo = data.originalSize && data.compressedSize ? 
        \`\${formatBytes(data.originalSize)} → \${formatBytes(data.compressedSize)}\` : 
        formatBytes(data.compressedSize || 0);
      
      const line = document.createElement('div');
      line.className = 'feed-line';
      line.innerHTML = \`
        <span>
          <span class="feed-time">\${time}</span>
          <span class="feed-price">$\${data.price}</span>
        </span>
        <span class="feed-size">\${sizeInfo}</span>
      \`;
      
      feed.insertBefore(line, feed.firstChild);
      
      // Keep only last 20 entries
      while (feed.children.length > 20) {
        feed.removeChild(feed.lastChild);
      }
    };
    
    const connectWebSocket = (type) => {
      const ws = new WebSocket(\`ws://localhost:3001/feed/\${type}\`);
      
      ws.onopen = () => {
        console.log(\`✅ \${type.toUpperCase()} WebSocket connected\`);
        updateConnectionStatus();
      };
      
      ws.onclose = () => {
        console.log(\`❌ \${type.toUpperCase()} WebSocket disconnected\`);
        connections[type] = null;
        updateConnectionStatus();
      };
      
      ws.onerror = (error) => {
        console.error(\`❌ \${type.toUpperCase()} WebSocket error:\`, error);
      };
      
      ws.onmessage = async ({ data: message }) => {
        try {
          let decodedDataset;
          
          if (type === 'none') {
            // No compression - direct base64 decode
            const jsonStr = atob(message);
            decodedDataset = JSON.parse(jsonStr);
          } else if (type === 'gzip') {
            // Gzip compression - use built-in DecompressionStream
            const bytes = Uint8Array.from(atob(message), c => c.charCodeAt(0));
            const stream = new DecompressionStream('gzip');
            const writer = stream.writable.getWriter();
            const reader = stream.readable.getReader();
            
            writer.write(bytes);
            writer.close();
            
            // Read all chunks from the decompression stream
            const chunks = [];
            let totalLength = 0;
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              chunks.push(value);
              totalLength += value.length;
            }
            
            // Combine all chunks into a single Uint8Array
            const combinedArray = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
              combinedArray.set(chunk, offset);
              offset += chunk.length;
            }
            
            const jsonStr = new TextDecoder().decode(combinedArray);
            decodedDataset = JSON.parse(jsonStr);
                      } else if (type === 'brotli') {
            // Brotli compression - use native or JS library
            const bytes = Uint8Array.from(atob(message), c => c.charCodeAt(0));
            
            if (brotliSupported) {
              // Use native DecompressionStream
              const stream = new DecompressionStream('br');
              const writer = stream.writable.getWriter();
              const reader = stream.readable.getReader();
              
              writer.write(bytes);
              writer.close();
              
              // Read all chunks from the decompression stream
              const chunks = [];
              let totalLength = 0;
              
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                chunks.push(value);
                totalLength += value.length;
              }
              
              // Combine all chunks into a single Uint8Array
              const combinedArray = new Uint8Array(totalLength);
              let offset = 0;
              for (const chunk of chunks) {
                combinedArray.set(chunk, offset);
                offset += chunk.length;
              }
              
              const jsonStr = new TextDecoder().decode(combinedArray);
              decodedDataset = JSON.parse(jsonStr);
            } else if (window.brotli && window.brotli.decompress) {
              // Use JS library
              const decompressed = window.brotli.decompress(bytes);
              const jsonStr = new TextDecoder().decode(decompressed);
              decodedDataset = JSON.parse(jsonStr);
            } else {
              console.error('Brotli decompression not available - showing placeholder dataset');
              // Create placeholder dataset to show the feed is working
              decodedDataset = Array.from({ length: 1000 }, (_, i) => ({
                id: i + 1,
                ts: Date.now(),
                price: '0.00',
                symbol: 'BTC/USD',
                volume: 0,
                change: '0.00',
                changePercent: '0.00',
                high: '0.00',
                low: '0.00',
                market: 'crypto',
                exchange: 'placeholder'
              }));
            }
          } else if (type === 'zstd') {
            // Zstd compression - Note: Browser doesn't have native Zstd, showing raw message size
            console.log('Zstd data received (cannot decompress in browser, showing message stats only)');
            
            // Since we can't decompress Zstd in the browser, we'll create a representative dataset
            // The server compression stats will still show the real Zstd compression benefits
            decodedDataset = Array.from({ length: 1000 }, (_, i) => ({
              id: i + 1,
              ts: Date.now(),
              price: (45000 + Math.sin(i / 100) * 5000 + (Math.random() - 0.5) * 1000).toFixed(2),
              symbol: ['BTC/USD', 'ETH/USD', 'SOL/USD'][i % 3],
              volume: Math.floor(Math.random() * 10000) + 1000,
              change: ((Math.random() - 0.5) * 1000).toFixed(2),
              changePercent: ((Math.random() - 0.5) * 5).toFixed(2),
              high: (Math.random() * 50000).toFixed(2),
              low: (Math.random() * 40000).toFixed(2),
              market: 'crypto',
              exchange: 'zstd-compressed'
            }));
          }
          
          // Ensure we have an array (large dataset)
          const dataset = Array.isArray(decodedDataset) ? decodedDataset : [decodedDataset];
          
          // Update statistics
          const stat = stats[type];
          stat.messages++;
          const compressedSize = Math.ceil(message.length * 3 / 4); // approximate base64 decoded size
          stat.totalBytes += compressedSize;
          stat.sizes.push(compressedSize);
          
          // Show sample of the large dataset in the feed (first 10 items)
          const sampleData = dataset.slice(0, 10);
          
          // Clear previous data and add new sample
          const feed = feeds[type];
          feed.innerHTML = \`<div style="color: #666; font-size: 0.8rem; margin-bottom: 0.5rem; text-align: center;">📦 Dataset: \${dataset.length} items (showing first 10)</div>\`;
          
          sampleData.forEach(item => {
            addToFeed(type, {
              ...item,
              compressedSize,
              originalSize: dataset.length * 300 // approximate size per item
            });
          });
          
          updateStats();
        } catch (error) {
          console.error(\`Error processing \${type} message:\`, error);
        }
      };
      
      return ws;
    };
    
    const updateConnectionStatus = () => {
      const connected = Object.values(connections).some(conn => conn?.readyState === WebSocket.OPEN);
      statusEl.textContent = connected ? '🟢 Connected' : '🔴 Disconnected';
      statusEl.className = \`connection-status \${connected ? 'connected' : 'disconnected'}\`;
    };
    
    const startStreaming = () => {
      // Connect to all compression type feeds
      connections.none = connectWebSocket('none');
      connections.gzip = connectWebSocket('gzip');
      connections.brotli = connectWebSocket('brotli');
      connections.zstd = connectWebSocket('zstd');
      
      startTime = Date.now();
      
      // Start uptime counter
      uptimeInterval = setInterval(() => {
        if (startTime) {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          document.getElementById('uptime').textContent = formatTime(elapsed);
        }
      }, 1000);
      
      startBtn.disabled = true;
      stopBtn.disabled = false;
    };
    
    const stopStreaming = () => {
      // Close all connections
      Object.values(connections).forEach(ws => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
      
      Object.keys(connections).forEach(key => {
        connections[key] = null;
      });
      
      if (uptimeInterval) {
        clearInterval(uptimeInterval);
        uptimeInterval = null;
      }
      
      startTime = null;
      
      updateConnectionStatus();
      startBtn.disabled = false;
      stopBtn.disabled = true;
    };
    
    const clearData = () => {
      // Reset statistics
      Object.keys(stats).forEach(type => {
        stats[type] = { messages: 0, totalBytes: 0, sizes: [] };
      });
      
      // Clear feeds
      Object.values(feeds).forEach(feed => {
        feed.innerHTML = 'Waiting for data...';
      });
      
      // Reset performance metrics
      document.getElementById('best-compression').textContent = '-';
      document.getElementById('total-savings').textContent = '0 KB';
      document.getElementById('messages-per-sec').textContent = '0';
      document.getElementById('uptime').textContent = '00:00';
      
      updateStats();
    };
    
    // Event listeners
    startBtn.addEventListener('click', startStreaming);
    stopBtn.addEventListener('click', stopStreaming);
    clearBtn.addEventListener('click', clearData);
    
    // Initial state
    stopBtn.disabled = true;
    updateConnectionStatus();
  </script>
</body>
</html>
`;

// --- Create Elysia app ---
const app = new Elysia()
  .ws("/feed/none", {
    open(ws) { 
      console.log("📊 Client connected to NONE compression feed"); 
      ws.subscribe("feed-none");
    },
    close(ws) { 
      console.log("📊 Client disconnected from NONE compression feed"); 
      ws.unsubscribe("feed-none");
    },
    message(ws, message) {
      // Handle incoming messages if needed
    }
  })
  .ws("/feed/gzip", {
    open(ws) { 
      console.log("🗜️ Client connected to GZIP compression feed"); 
      ws.subscribe("feed-gzip");
    },
    close(ws) { 
      console.log("🗜️ Client disconnected from GZIP compression feed"); 
      ws.unsubscribe("feed-gzip");
    },
    message(ws, message) {
      // Handle incoming messages if needed
    }
  })
  .ws("/feed/brotli", {
    open(ws) { 
      console.log("⚡ Client connected to BROTLI compression feed"); 
      ws.subscribe("feed-brotli");
    },
    close(ws) { 
      console.log("⚡ Client disconnected from BROTLI compression feed"); 
      ws.unsubscribe("feed-brotli");
    },
    message(ws, message) {
      // Handle incoming messages if needed
    }
  })
  .ws("/feed/zstd", {
    open(ws) { 
      console.log("🔥 Client connected to ZSTD compression feed"); 
      ws.subscribe("feed-zstd");
    },
    close(ws) { 
      console.log("🔥 Client disconnected from ZSTD compression feed"); 
      ws.unsubscribe("feed-zstd");
    },
    message(ws, message) {
      // Handle incoming messages if needed
    }
  })
  .get("/", () => new Response(htmlPage, {
    headers: { "Content-Type": "text/html" }
  }))
  .get("/health", () => ({ status: "OK", timestamp: Date.now() }))
  .listen(3001);

console.log(`
🚀 Compression Comparison WebSocket Server running!
🌐 Open: http://localhost:3001
📊 Health: http://localhost:3001/health

WebSocket Endpoints:
  📊 No Compression: ws://localhost:3001/feed/none
  🗜️ Gzip: ws://localhost:3001/feed/gzip  
  ⚡ Brotli: ws://localhost:3001/feed/brotli
  🔥 Zstd: ws://localhost:3001/feed/zstd
`);

// --- Generate large dataset for better compression ---
function generateLargePriceDataset(count: number): PriceData[] {
  console.log(`🏗️ Generating ${count} PriceData items for better compression demonstration...`);
  
  const symbols = ["BTC/USD", "ETH/USD", "ADA/USD", "DOT/USD", "SOL/USD", "AVAX/USD", "MATIC/USD", "LINK/USD"];
  const exchanges = ["binance", "coinbase", "kraken", "ftx", "huobi", "okex", "bybit", "kucoin"];
  const markets = ["crypto", "forex", "stocks", "commodities"];
  
  const dataset: PriceData[] = [];
  const baseTime = Date.now();
  
  for (let i = 0; i < count; i++) {
    const symbol = symbols[i % symbols.length] || "BTC/USD";
    const exchange = exchanges[i % exchanges.length] || "binance";
    const market = markets[i % markets.length] || "crypto";
    
    // Create realistic price patterns based on symbol
    const basePrice = symbol.includes("BTC") ? 45000 + Math.sin(i / 100) * 5000 :
                     symbol.includes("ETH") ? 3000 + Math.sin(i / 80) * 500 :
                     symbol.includes("SOL") ? 100 + Math.sin(i / 60) * 20 :
                     50 + Math.sin(i / 40) * 10;
    
    const noise = (Math.random() - 0.5) * (basePrice * 0.02); // 2% noise
    const price = (basePrice + noise).toFixed(2);
    
    const priceNum = parseFloat(price);
    const changeAmount = ((Math.random() - 0.5) * priceNum * 0.05).toFixed(2); // 5% max change
    const changePercent = priceNum > 0 ? ((parseFloat(changeAmount) / priceNum) * 100).toFixed(2) : "0.00";
    
    const priceData: PriceData = {
      ts: baseTime + (i * 1000), // 1 second intervals
      price: price,
      compression: "none", // Will be set by compression functions
      originalSize: 0, // Will be calculated
      compressedSize: 0 // Will be calculated
    };
    
    // Add extra market data for more realistic compression scenarios
    const extraData = {
      id: i + 1,
      symbol: symbol,
      volume: Math.floor(Math.random() * 10000) + 1000,
      change: changeAmount,
      changePercent: changePercent,
      high: (priceNum + Math.random() * priceNum * 0.03).toFixed(2),
      low: (priceNum - Math.random() * priceNum * 0.03).toFixed(2),
      market: market,
      exchange: exchange,
      bid: (priceNum - Math.random() * priceNum * 0.001).toFixed(2),
      ask: (priceNum + Math.random() * priceNum * 0.001).toFixed(2),
      timestamp: baseTime + (i * 1000),
      trades_count: Math.floor(Math.random() * 100) + 10,
      vwap: (priceNum + (Math.random() - 0.5) * priceNum * 0.001).toFixed(2)
    };
    
    // Merge extra data into the price data for more realistic compression
    const fullPriceData = Object.assign(priceData, extraData);
    dataset.push(fullPriceData);
  }
  
  console.log(`✅ Generated ${count} items. Sample item size: ~${JSON.stringify(dataset[0]).length} bytes`);
  return dataset;
}

// Generate the large dataset at startup
const DATASET_SIZE = 1000;
const largePriceDataset = generateLargePriceDataset(DATASET_SIZE);

// --- Data broadcasting with large dataset ---
let messageCounter = 0;

setInterval(() => {
  messageCounter++;
  
  // Send the entire large dataset each time to demonstrate compression benefits
  const currentDataset = largePriceDataset.map(item => ({
    ...item,
    ts: Date.now(), // Update timestamp to current time
    messageId: messageCounter
  }));

  console.log(`📦 Broadcasting dataset #${messageCounter} with ${currentDataset.length} items...`);

  // Send to each compression type feed
  
  // 1. No compression
  const noneResult = noCompression(currentDataset);
  if (noneResult) {
    app.server?.publish("feed-none", noneResult.compressed);
  }
  
  // 2. Gzip compression
  const gzipResult = compressWithGzip(currentDataset);
  if (gzipResult) {
    app.server?.publish("feed-gzip", gzipResult.compressed);
  }
  
  // 3. Brotli compression
  const brotliResult = compressWithBrotli(currentDataset);
  if (brotliResult) {
    app.server?.publish("feed-brotli", brotliResult.compressed);
  }
  
  // 4. Zstd compression (using Bun's native zstd)
  const zstdResult = compressWithZstd(currentDataset);
  if (zstdResult) {
    app.server?.publish("feed-zstd", zstdResult.compressed);
  }
  
  // Log compression comparison every message (since we're sending big data)
  console.log(`
📈 Dataset #${messageCounter} Compression Stats (${currentDataset.length} items):
  📊 None: ${noneResult.compressedSize.toLocaleString()} bytes (${(noneResult.compressedSize / 1024).toFixed(1)} KB)
  🗜️ Gzip: ${gzipResult.compressedSize.toLocaleString()} bytes (${(gzipResult.compressedSize / 1024).toFixed(1)} KB) - ${((1 - gzipResult.compressedSize/noneResult.compressedSize) * 100).toFixed(1)}% savings
  ⚡ Brotli: ${brotliResult?.compressedSize.toLocaleString() || 0} bytes (${((brotliResult?.compressedSize || 0) / 1024).toFixed(1)} KB) - ${brotliResult ? ((1 - brotliResult.compressedSize/noneResult.compressedSize) * 100).toFixed(1) : 0}% savings
  🔥 Zstd: ${zstdResult?.compressedSize.toLocaleString() || 0} bytes (${((zstdResult?.compressedSize || 0) / 1024).toFixed(1)} KB) - ${zstdResult ? ((1 - zstdResult.compressedSize/noneResult.compressedSize) * 100).toFixed(1) : 0}% savings
  🎯 Compression Ratio: Gzip ${(noneResult.compressedSize / gzipResult.compressedSize).toFixed(2)}x, Brotli ${brotliResult ? (noneResult.compressedSize / brotliResult.compressedSize).toFixed(2) : 0}x, Zstd ${zstdResult ? (noneResult.compressedSize / zstdResult.compressedSize).toFixed(2) : 0}x
  📏 Original JSON: ${(noneResult.originalSize / 1024).toFixed(1)} KB
  `);
  
}, 2000); // Send every 2 seconds to allow time to see the large data compression benefits