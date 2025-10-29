require('dotenv').config();

// Minimal Instagram test without full bot dependencies
const axios = require('axios');

async function simpleInstagramTest() {
    const testUrl = 'https://www.instagram.com/reel/DQGdUzwEQ1r/';
    
    console.log('🧪 Simple Instagram Test');
    console.log('========================');
    console.log(`Testing URL: ${testUrl}`);
    console.log('');

    try {
        console.log('📡 Making HTTP request to Instagram...');
        
        const response = await axios.get(testUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache'
            },
            timeout: 15000
        });

        console.log(`✅ HTTP Status: ${response.status}`);
        console.log(`📄 Content Length: ${response.data.length} characters`);
        
        const html = response.data;
        
        // Test for different media extraction patterns
        console.log('\n🔍 Testing Media Extraction Patterns:');
        
        // Pattern 1: video_url in JSON
        const videoMatch = html.match(/"video_url":"([^"]+)"/);
        console.log(`1. video_url pattern: ${videoMatch ? '✅ FOUND' : '❌ NOT FOUND'}`);
        if (videoMatch) {
            console.log(`   URL: ${videoMatch[1].substring(0, 100)}...`);
        }
        
        // Pattern 2: display_url in JSON  
        const imageMatch = html.match(/"display_url":"([^"]+)"/);
        console.log(`2. display_url pattern: ${imageMatch ? '✅ FOUND' : '❌ NOT FOUND'}`);
        if (imageMatch) {
            console.log(`   URL: ${imageMatch[1].substring(0, 100)}...`);
        }
        
        // Pattern 3: og:video meta tag
        const videoMetaMatch = html.match(/<meta property="og:video:url" content="([^"]+)"/);
        console.log(`3. og:video meta tag: ${videoMetaMatch ? '✅ FOUND' : '❌ NOT FOUND'}`);
        if (videoMetaMatch) {
            console.log(`   URL: ${videoMetaMatch[1].substring(0, 100)}...`);
        }
        
        // Pattern 4: og:image meta tag
        const imageMetaMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
        console.log(`4. og:image meta tag: ${imageMetaMatch ? '✅ FOUND' : '❌ NOT FOUND'}`);
        if (imageMetaMatch) {
            console.log(`   URL: ${imageMetaMatch[1].substring(0, 100)}...`);
        }
        
        // Check if Instagram is blocking us
        if (html.includes('login') || html.includes('Log In')) {
            console.log('\n⚠️  WARNING: Instagram might be requiring login');
        }
        
        if (html.includes('challenge') || html.includes('suspicious')) {
            console.log('\n🚫 WARNING: Instagram detected suspicious activity');
        }
        
        // Check for rate limiting
        if (response.status === 429) {
            console.log('\n⏰ Rate limited by Instagram');
        }
        
        console.log('\n📊 DIAGNOSIS:');
        if (videoMatch || imageMatch || videoMetaMatch || imageMetaMatch) {
            console.log('✅ Media extraction should work!');
            console.log('   The issue might be in the bot logic or Puppeteer setup.');
        } else {
            console.log('❌ No media patterns found.');
            console.log('   Instagram might have changed their structure or is blocking requests.');
        }

    } catch (error) {
        console.log(`❌ Request failed: ${error.message}`);
        
        if (error.code === 'ENOTFOUND') {
            console.log('🌐 Network connectivity issue');
        } else if (error.code === 'ECONNABORTED') {
            console.log('⏰ Request timeout');
        } else if (error.response?.status === 403) {
            console.log('🚫 Instagram blocked the request (403 Forbidden)');
        } else if (error.response?.status === 429) {
            console.log('⏰ Rate limited by Instagram (429 Too Many Requests)');
        }
    }
}

// Only run if axios is available
try {
    simpleInstagramTest();
} catch (error) {
    console.log('❌ Dependencies not installed yet.');
    console.log('Please run: npm install');
    console.log('Then try again: node simple-instagram-test.js');
}