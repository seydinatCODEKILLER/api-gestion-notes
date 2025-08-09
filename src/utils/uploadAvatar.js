import cloudinary from "../config/cloudinary.js";

export default class AvatarUploader {
  constructor() {
    this.uploadResults = new Map();
  }

  async upload(file, prefix = "avatar") {
    if (!file || typeof file !== "object") return null;

    try {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const dataUri = `data:${file.type};base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: "school-management/avatars",
        public_id: `${prefix}_${Date.now()}`,
        resource_type: "auto",
      });

      this.uploadResults.set(prefix, {
        public_id: result.public_id,
        url: result.secure_url,
      });

      return result.secure_url;
    } catch (error) {
      console.error("Upload failed:", error);
      throw error; 
    }
  }

  async rollback(prefix) {
    const uploadInfo = this.uploadResults.get(prefix);
    if (!uploadInfo) return;

    try {
      await cloudinary.uploader.destroy(uploadInfo.public_id);
      this.uploadResults.delete(prefix);
      console.log(`Rollback successful - deleted: ${uploadInfo.public_id}`);
    } catch (error) {
      console.error("Rollback failed:", error);
    }
  }

  async deleteByUrl(url) {
    if (!url) return;

    try {
      const publicId = url.match(
        /school-management\/avatars\/[^\/]+(?=\.|$)/
      )?.[0];
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted avatar: ${publicId}`);
      }
    } catch (error) {
      console.error("Delete by URL failed:", error);
    }
  }
}
