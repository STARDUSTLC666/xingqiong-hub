const https = require('https');
const url = 'https://vercel-static-site-pi.vercel.app/index.html';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const titleMatch = data.match(/<title>([^<]+)<\/title>/);
    console.log('=== Title ===');
    console.log(titleMatch ? titleMatch[1] : 'No title');
    
    // Extract main content
    const bodyMatch = data.match(/<body[^>]*>([\s\S]*?)<\/body>/);
    const body = bodyMatch ? bodyMatch[1] : data;
    const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    console.log('\n=== Content (first 2500 chars) ===');
    console.log(text.slice(0, 2500));
    console.log('\n=== Total text: ' + text.length + ' chars ===');
    
    // Key sections / headings
    const headings = data.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/g) || [];
    console.log('\n=== Headings ===');
    headings.forEach(h => console.log('  ' + h.replace(/<[^>]+>/g, '').trim()));
  });
}).on('error', e => console.error(e.message));
