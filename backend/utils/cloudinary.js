const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || "327255887477451",
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads an image (base64 data URI or local file path) to Cloudinary
 * @param {string} fileSource - base64 data URI or file path
 * @returns {Promise<string>} - Cloudinary secure URL
 */
const uploadToCloudinary = async (fileSource) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_SECRET) {
      console.warn("Cloudinary credentials missing. Falling back to input source.");
      return fileSource;
    }

    const result = await cloudinary.uploader.upload(fileSource, {
      folder: "campus-lost-found",
      resource_type: "image",
    });

    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image to Cloudinary.");
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
};
