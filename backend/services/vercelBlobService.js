const { put, del, list } = require('@vercel/blob');
const axios = require('axios');

class VercelBlobService {
  constructor() {
    // Vercel Blob token should be in environment variables
    this.token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!this.token) {
      console.warn('BLOB_READ_WRITE_TOKEN not found in environment variables');
    }
  }

  /**
   * Download an image from a URL and upload it to Vercel Blob
   * @param {string} imageUrl - The URL of the image to download
   * @param {string} filename - The filename to use in Vercel Blob
   * @returns {Promise<Object>} The blob object with URL
   */
  async uploadImageFromUrl(imageUrl, filename) {
    try {
      console.log(`Downloading image from: ${imageUrl}`);
      
      // Download the image
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      const imageBuffer = Buffer.from(response.data);
      const contentType = response.headers['content-type'] || 'image/png';

      console.log(`Uploading to Vercel Blob as: ${filename} (${contentType})`);

      // Upload to Vercel Blob
      const blob = await put(filename, imageBuffer, {
        access: 'public',
        contentType: contentType,
        addRandomSuffix: true // Avoid conflicts
      });

      console.log(`Successfully uploaded to: ${blob.url}`);
      return blob;

    } catch (error) {
      console.error('Error uploading image to Vercel Blob:', error);
      throw error;
    }
  }

  /**
   * Delete a blob by URL
   * @param {string} url - The blob URL to delete
   */
  async deleteBlob(url) {
    try {
      await del(url);
      console.log(`Successfully deleted blob: ${url}`);
    } catch (error) {
      console.error('Error deleting blob:', error);
      throw error;
    }
  }

  /**
   * List all blobs in the store
   * @returns {Promise<Array>} Array of blob objects
   */
  async listBlobs() {
    try {
      const response = await list();
      return response.blobs;
    } catch (error) {
      console.error('Error listing blobs:', error);
      throw error;
    }
  }

  /**
   * Generate a unique filename for monster type icons
   * @param {string} typeName - The monster type name
   * @returns {string} The filename
   */
  generateIconFilename(typeName) {
    const sanitizedName = typeName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `monster-types/${sanitizedName}-icon.png`;
  }
}

module.exports = VercelBlobService; 