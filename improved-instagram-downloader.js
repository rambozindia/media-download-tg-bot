const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class ImprovedInstagramDownloader {
    constructor() {
        this.downloadsDir = path.join(__dirname, 'downloads');
        fs.ensureDirSync(this.downloadsDir);
    }

    async download(url, userId) {
        console.log(`🔄 Starting enhanced Instagram download for: ${url}`);
        
        try {
            // Clean the URL
            const cleanUrl = this.cleanUrl(url);
            
            // Try multiple methods in sequence
            let mediaData = null;
            
            // Method 1: Try Instagram embed endpoint
            try {
                console.log('📡 Trying Instagram embed method...');
                mediaData = await this.tryEmbedMethod(cleanUrl);
                if (mediaData) {
                    console.log('✅ Embed method successful!');
                }
            } catch (error) {
                console.log(`❌ Embed method failed: ${error.message}`);
            }
            
            // Method 2: Try alternative Instagram APIs
            if (!mediaData) {
                try {
                    console.log('📡 Trying alternative API method...');
                    mediaData = await this.tryAlternativeAPI(cleanUrl);
                    if (mediaData) {
                        console.log('✅ Alternative API successful!');
                    }
                } catch (error) {
                    console.log(`❌ Alternative API failed: ${error.message}`);
                }
            }
            
            // Method 3: Try modified user agent approach
            if (!mediaData) {
                try {
                    console.log('📡 Trying modified user agent method...');
                    mediaData = await this.tryModifiedUserAgent(cleanUrl);
                    if (mediaData) {
                        console.log('✅ Modified user agent successful!');
                    }
                } catch (error) {
                    console.log(`❌ Modified user agent failed: ${error.message}`);
                }
            }
            
            if (!mediaData) {
                throw new Error('All download methods failed. Instagram may be blocking requests or the content might be private.');
            }
            
            // Download the media file
            const fileName = `instagram_${userId}_${Date.now()}.${mediaData.type === 'video' ? 'mp4' : 'jpg'}`;
            const filePath = path.join(this.downloadsDir, fileName);
            
            await this.downloadFile(mediaData.url, filePath);
            
            // Verify download
            const stats = await fs.stat(filePath);
            if (stats.size === 0) {
                await fs.remove(filePath);
                throw new Error('Downloaded file is empty');
            }
            
            console.log(`✅ Successfully downloaded: ${mediaData.type}, size: ${Math.round(stats.size / 1024)}KB`);
            
            return {
                success: true,
                type: mediaData.type,
                filePath: filePath,
                caption: mediaData.caption || 'Downloaded from Instagram'
            };
            
        } catch (error) {
            console.log(`❌ Download failed: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    cleanUrl(url) {
        try {
            const urlObj = new URL(url);
            // Remove all query parameters
            urlObj.search = '';
            // Ensure www subdomain
            if (urlObj.hostname === 'instagram.com') {
                urlObj.hostname = 'www.instagram.com';
            }
            return urlObj.toString();
        } catch (error) {
            return url;
        }
    }
    
    async tryEmbedMethod(url) {
        // Try Instagram's embed endpoint
        const postId = this.extractPostId(url);
        if (!postId) return null;
        
        const embedUrl = `https://www.instagram.com/p/${postId}/embed/`;
        
        const response = await axios.get(embedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Cache-Control': 'no-cache'
            },
            timeout: 15000
        });
        
        return this.extractMediaFromHtml(response.data);
    }
    
    async tryAlternativeAPI(url) {
        // Try a different approach using Instagram's API-like endpoints
        const postId = this.extractPostId(url);
        if (!postId) return null;
        
        // This is a simplified approach - in practice you might use different endpoints
        const apiUrl = `https://www.instagram.com/graphql/query/`;
        
        // For now, fall back to the direct method
        return await this.tryModifiedUserAgent(url);
    }
    
    async tryModifiedUserAgent(url) {
        // Try with a different user agent that might not trigger bot detection
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 15000
        });
        
        return this.extractMediaFromHtml(response.data);
    }
    
    extractPostId(url) {
        const match = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
        return match ? match[2] : null;
    }
    
    extractMediaFromHtml(html) {
        // Try multiple extraction patterns
        
        // Pattern 1: JSON-LD structured data
        const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/s);
        if (jsonLdMatch) {
            try {
                const data = JSON.parse(jsonLdMatch[1]);
                if (data.video && data.video.contentUrl) {
                    return {
                        url: data.video.contentUrl,
                        type: 'video',
                        caption: data.caption || 'Instagram Video'
                    };
                }
                if (data.image && data.image.url) {
                    return {
                        url: data.image.url,
                        type: 'image',
                        caption: data.caption || 'Instagram Image'
                    };
                }
            } catch (e) {
                // Continue to next method
            }
        }
        
        // Pattern 2: Meta tags with better extraction
        const videoMetaMatch = html.match(/<meta property="og:video:secure_url" content="([^"]+)"/);
        if (videoMetaMatch) {
            return {
                url: videoMetaMatch[1],
                type: 'video',
                caption: 'Instagram Video'
            };
        }
        
        const videoMetaMatch2 = html.match(/<meta property="og:video" content="([^"]+)"/);
        if (videoMetaMatch2) {
            return {
                url: videoMetaMatch2[1],
                type: 'video',
                caption: 'Instagram Video'
            };
        }
        
        const imageMetaMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
        if (imageMetaMatch && !imageMetaMatch[1].includes('avatar')) {
            return {
                url: imageMetaMatch[1],
                type: 'image',
                caption: 'Instagram Image'
            };
        }
        
        // Pattern 3: Look for direct media URLs in script tags
        const scripts = html.match(/<script[^>]*>(.*?)<\/script>/gs) || [];
        
        for (const script of scripts) {
            // Look for video URLs
            const videoMatch = script.match(/"video_url":"([^"]+)"/);
            if (videoMatch) {
                return {
                    url: videoMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, ''),
                    type: 'video',
                    caption: 'Instagram Video'
                };
            }
            
            // Look for image URLs
            const imageMatch = script.match(/"display_url":"([^"]+)"/);
            if (imageMatch) {
                return {
                    url: imageMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, ''),
                    type: 'image',
                    caption: 'Instagram Image'
                };
            }
        }
        
        return null;
    }
    
    async downloadFile(url, filePath) {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.instagram.com/',
                'Accept': '*/*'
            },
            timeout: 60000,
            maxRedirects: 5
        });
        
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
            setTimeout(() => {
                writer.destroy();
                reject(new Error('Download timeout'));
            }, 60000);
        });
    }
}

// Test the improved downloader
async function testImprovedDownloader() {
    const downloader = new ImprovedInstagramDownloader();
    const testUrl = 'https://www.instagram.com/reel/DQGdUzwEQ1r/?utm_source=ig_web_copy_link';
    
    console.log('🧪 Testing Improved Instagram Downloader');
    console.log('==========================================');
    
    const result = await downloader.download(testUrl, 'test_user');
    
    if (result.success) {
        console.log('🎉 SUCCESS!');
        console.log(`📁 File: ${result.filePath}`);
        console.log(`📋 Type: ${result.type}`);
    } else {
        console.log('❌ FAILED!');
        console.log(`💥 Error: ${result.error}`);
    }
}

// Export for use in the main bot
module.exports = ImprovedInstagramDownloader;

// Run test if this file is executed directly
if (require.main === module) {
    testImprovedDownloader().catch(console.error);
}