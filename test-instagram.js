require('dotenv').config();
const InstagramDownloader = require('./services/instagramDownloader');
const logger = require('./utils/logger');

async function testInstagramDownload() {
    const downloader = new InstagramDownloader();
    const testUrl = 'https://www.instagram.com/reel/DQGdUzwEQ1r/?utm_source=ig_web_copy_link';
    const testUserId = 'test_user_123';

    console.log('🧪 Testing Instagram download...');
    console.log(`📱 URL: ${testUrl}`);
    console.log('⏳ Starting download...\n');

    try {
        const result = await downloader.download(testUrl, testUserId);
        
        if (result.success) {
            console.log('✅ Download successful!');
            console.log(`📄 Type: ${result.type}`);
            console.log(`📁 File: ${result.filePath}`);
            console.log(`📝 Caption: ${result.caption}`);
        } else {
            console.log('❌ Download failed!');
            console.log(`💥 Error: ${result.error}`);
        }
    } catch (error) {
        console.log('💥 Test failed with exception:');
        console.log(error.message);
    }
}

// Run the test
testInstagramDownload();