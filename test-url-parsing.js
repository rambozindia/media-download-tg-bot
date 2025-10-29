const URLParser = require('./utils/urlParser');

// Simple test without requiring dependencies
function testUrlParsing() {
    console.log('🧪 Testing URL parsing...');
    
    const parser = new URLParser();
    const testUrl = 'https://www.instagram.com/reel/DQGdUzwEQ1r/?utm_source=ig_web_copy_link';
    
    console.log(`📱 Testing URL: ${testUrl}`);
    
    const result = parser.parseURL(testUrl);
    
    console.log('📋 Parse Result:', JSON.stringify(result, null, 2));
    
    if (result.isValid) {
        console.log('✅ URL is valid and supported');
        console.log(`🔗 Platform: ${result.platform}`);
        console.log(`🧹 Clean URL: ${result.cleanURL}`);
    } else {
        console.log('❌ URL validation failed');
        console.log(`💥 Error: ${result.error}`);
    }
}

// Test the specific URL validation logic
function testInstagramUrlValidation() {
    console.log('\n🔍 Testing Instagram URL validation...');
    
    const testUrls = [
        'https://www.instagram.com/reel/DQGdUzwEQ1r/?utm_source=ig_web_copy_link',
        'https://instagram.com/p/ABC123/',
        'https://www.instagram.com/tv/XYZ789/',
        'https://facebook.com/some-post' // Should fail
    ];
    
    testUrls.forEach((url, index) => {
        console.log(`\nTest ${index + 1}: ${url}`);
        
        // Test the regex directly
        const instagramRegexes = [
            /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+/,
            /^https?:\/\/(www\.)?instagram\.com\/stories\/[A-Za-z0-9_.]+\/\d+/
        ];
        
        const isValid = instagramRegexes.some(regex => regex.test(url));
        console.log(`Valid: ${isValid ? '✅' : '❌'}`);
    });
}

// Run tests
testUrlParsing();
testInstagramUrlValidation();