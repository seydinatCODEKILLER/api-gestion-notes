import cloudinary from "../config/cloudinary.js";

export default class AvatarUploader {
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

      return result.secure_url;
    } catch (error) {
      console.error("Upload failed:", error);
      return null;
    }
  }
}
