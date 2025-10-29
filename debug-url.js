// Simple debug script to test Instagram URL handling
console.log('🔍 Debug: Testing Instagram URL validation');

const testUrl = 'https://www.instagram.com/reel/DQGdUzwEQ1r/?utm_source=ig_web_copy_link';
console.log(`Testing URL: ${testUrl}`);

// Test the Instagram regex patterns
const instagramPatterns = [
    /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+/,
    /^https?:\/\/(www\.)?instagram\.com\/stories\/[A-Za-z0-9_.]+\/\d+/
];

console.log('\n📋 Regex Test Results:');
instagramPatterns.forEach((pattern, index) => {
    const matches = pattern.test(testUrl);
    console.log(`Pattern ${index + 1}: ${matches ? '✅ MATCH' : '❌ NO MATCH'}`);
    console.log(`  Regex: ${pattern}`);
});

// Test URL cleaning
console.log('\n🧹 URL Cleaning Test:');
try {
    const urlObj = new URL(testUrl);
    console.log(`Original: ${testUrl}`);
    
    // Remove utm parameters
    urlObj.searchParams.delete('utm_source');
    urlObj.searchParams.delete('utm_medium');
    urlObj.searchParams.delete('utm_campaign');
    urlObj.searchParams.delete('utm_content');
    urlObj.searchParams.delete('igshid');
    
    // Ensure www subdomain
    if (urlObj.hostname === 'instagram.com') {
        urlObj.hostname = 'www.instagram.com';
    }
    
    const cleanUrl = urlObj.toString();
    console.log(`Cleaned: ${cleanUrl}`);
    
    // Test cleaned URL against patterns
    console.log('\n🔄 Testing cleaned URL:');
    instagramPatterns.forEach((pattern, index) => {
        const matches = pattern.test(cleanUrl);
        console.log(`Pattern ${index + 1}: ${matches ? '✅ MATCH' : '❌ NO MATCH'}`);
    });
    
} catch (error) {
    console.log(`❌ URL parsing error: ${error.message}`);
}

console.log('\n✨ Debug complete!');