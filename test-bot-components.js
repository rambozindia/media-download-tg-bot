require('dotenv').config();

// Test the bot components without starting the full bot
async function testBotComponents() {
    console.log('🧪 Testing Bot Components');
    console.log('========================');
    
    // Test 1: Environment setup
    console.log('\n1. Testing Environment Setup...');
    if (process.env.BOT_TOKEN) {
        console.log('✅ BOT_TOKEN found');
    } else {
        console.log('❌ BOT_TOKEN missing');
        return;
    }
    
    // Test 2: URL Parser
    console.log('\n2. Testing URL Parser...');
    try {
        const URLParser = require('./utils/urlParser');
        const parser = new URLParser();
        const testUrl = 'https://www.instagram.com/reel/DQGdUzwEQ1r/?utm_source=ig_web_copy_link';
        const result = parser.parseURL(testUrl);
        
        if (result.isValid && result.platform === 'instagram') {
            console.log('✅ URL Parser working correctly');
            console.log(`   Platform: ${result.platform}`);
            console.log(`   Clean URL: ${result.cleanURL}`);
        } else {
            console.log('❌ URL Parser failed');
            console.log('   Result:', result);
        }
    } catch (error) {
        console.log(`❌ URL Parser error: ${error.message}`);
    }
    
    // Test 3: Instagram Downloader
    console.log('\n3. Testing Instagram Downloader...');
    try {
        const InstagramDownloader = require('./services/instagramDownloader');
        const downloader = new InstagramDownloader();
        
        const testUrl = 'https://www.instagram.com/reel/DQGdUzwEQ1r/?utm_source=ig_web_copy_link';
        const result = await downloader.download(testUrl, 'test_user');
        
        console.log('📋 Download Result:');
        console.log(`   Success: ${result.success ? '✅' : '❌'}`);
        
        if (result.success) {
            console.log(`   Type: ${result.type}`);
            console.log(`   File: ${result.filePath}`);
        } else if (result.fallbackMessage) {
            console.log('📝 Fallback Message Available:');
            console.log(result.fallbackMessage.substring(0, 200) + '...');
        } else {
            console.log(`   Error: ${result.error}`);
        }
        
    } catch (error) {
        console.log(`❌ Instagram Downloader error: ${error.message}`);
    }
    
    console.log('\n🎯 Test Complete!');
    console.log('\nNext Steps:');
    console.log('1. Fix PowerShell execution policy if needed');
    console.log('2. Run: npm start');
    console.log('3. Send your Instagram URL to the bot');
}

testBotComponents().catch(console.error);