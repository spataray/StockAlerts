// Get stock symbol from URL
const urlParams = new URLSearchParams(window.location.search);
const symbol = urlParams.get(‘symbol’) || ‘AAPL’;
// API configuration - you’ll need to set this
const ALPHA_VANTAGE_KEY = ‘demo’; // Replace with actual key or pass via URL
// Generate sample candlestick data (replace with real API call)
function generateCandlestickData() {
const data = [];
let price = 170;
const today = new Date();
```
for (let i = 29; i >= 0; i--) {
   const date = new Date(today);
   date.setDate(date.getDate() - i);
   const open = price;
   const change = (Math.random() - 0.48) * 8;
   const close = open + change;
   const high = Math.max(open, close) + Math.random() * 3;
   const low = Math.min(open, close) - Math.random() * 3;
   data.push({
       date: date,
       dateStr: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
       open: open,
       high: high,
       low: low,
       close: close
   });
   price = close;
}
return data;
```
}
// Draw candlestick chart
function drawCandlestickChart(data, threshold) {
const canvas = document.getElementById(‘candlestickChart’);
const ctx = canvas.getContext(‘2d’);
```
// Set canvas size
const dpr = window.devicePixelRatio || 1;
const rect = canvas.getBoundingClientRect();
canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
ctx.scale(dpr, dpr);
const width = rect.width;
const height = rect.height;
const padding = { top: 20, right: 50, bottom: 40, left: 50 };
const plotWidth = width - padding.left - padding.right;
const plotHeight = height - padding.top - padding.bottom;
// Calculate price range
const prices = data.flatMap(d => [d.high, d.low]);
const maxPrice = Math.max(...prices, threshold);
const minPrice = Math.min(...prices, threshold);
const priceRange = maxPrice - minPrice;
const priceScale = plotHeight / priceRange;
// Clear canvas
ctx.fillStyle = '#1e293b';
ctx.fillRect(0, 0, width, height);
// Draw grid lines
ctx.strokeStyle = '#334155';
ctx.lineWidth = 1;
for (let i = 0; i <= 4; i++) {
   const y = padding.top + (plotHeight / 4) * i;
   ctx.beginPath();
   ctx.setLineDash([4, 4]);
   ctx.moveTo(padding.left, y);
   ctx.lineTo(width - padding.right, y);
   ctx.stroke();
   // Price labels
   const price = maxPrice - (priceRange / 4) * i;
   ctx.fillStyle = '#94a3b8';
   ctx.font = '12px sans-serif';
   ctx.textAlign = 'left';
   ctx.fillText('$' + price.toFixed(0), width - padding.right + 5, y + 4);
}
// Draw threshold line
const thresholdY = padding.top + (maxPrice - threshold) * priceScale;
ctx.strokeStyle = '#ef4444';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.setLineDash([6, 6]);
ctx.moveTo(padding.left, thresholdY);
ctx.lineTo(width - padding.right, thresholdY);
ctx.stroke();
ctx.setLineDash([]);
// Draw candlesticks
const candleWidth = plotWidth / data.length * 0.6;
data.forEach((d, i) => {
   const x = padding.left + (i * plotWidth / (data.length - 1));
   const isGreen = d.close >= d.open;
   const color = isGreen ? '#10b981' : '#ef4444';
   const topY = padding.top + (maxPrice - Math.max(d.open, d.close)) * priceScale;
   const bottomY = padding.top + (maxPrice - Math.min(d.open, d.close)) * priceScale;
   const highY = padding.top + (maxPrice - d.high) * priceScale;
   const lowY = padding.top + (maxPrice - d.low) * priceScale;
   // Draw wick
   ctx.strokeStyle = color;
   ctx.lineWidth = 1;
   ctx.beginPath();
   ctx.moveTo(x, highY);
   ctx.lineTo(x, lowY);
   ctx.stroke();
   // Draw body
   ctx.fillStyle = color;
   ctx.fillRect(x - candleWidth/2, topY, candleWidth, Math.max(bottomY - topY, 1));
   // Date labels (every 5 days)
   if (i % 5 === 0) {
       ctx.fillStyle = '#94a3b8';
       ctx.font = '10px sans-serif';
       ctx.textAlign = 'center';
       ctx.fillText(d.dateStr, x, height - padding.bottom + 20);
   }
});
```
}
// Update page with stock data
function updatePage() {
document.getElementById(‘stockSymbol’).textContent = symbol;
document.getElementById(‘lastUpdate’).textContent = new Date().toLocaleString();
```
// Generate sample data (replace with real API call)
const data = generateCandlestickData();
const currentPrice = data[data.length - 1].close;
const threshold = 150; // Get from URL or API
document.getElementById('stockPrice').textContent = '$' + currentPrice.toFixed(2);
document.getElementById('stockChange').textContent = '-3.2%';
document.getElementById('stockChange').classList.add('negative');
// Sample trends (replace with real data)
updateTrend('trend3mo', -8.5);
updateTrend('trend6mo', 4.2);
updateTrend('trend12mo', -12.3);
// Draw chart
drawCandlestickChart(data, threshold);
```
}
function updateTrend(elementId, value) {
const element = document.getElementById(elementId);
const sign = value >= 0 ? ‘+’ : ‘’;
const emoji = value > 0 ? ‘📈’ : value < 0 ? ‘📉’ : ‘➡️’;
element.textContent = `${emoji} ${sign}${value.toFixed(1)}%`;
element.classList.add(value >= 0 ? ‘positive’ : ‘negative’);
}
// Initialize when page loads
window.addEventListener(‘load’, updatePage);
window.addEventListener(‘resize’, updatePage);