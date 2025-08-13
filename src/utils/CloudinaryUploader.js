import cloudinary from "../config/cloudinary.js";

export default class CloudinaryUploader {
  constructor(folder = "documents") {
    this.folder = `school-management/${folder}`;
  }

  async uploadPDF(buffer, prefix) {
    try {
      const base64 = buffer.toString("base64");
      const dataUri = `data:application/pdf;base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: this.folder,
        public_id: prefix,
        resource_type: "raw",
        format: "pdf",
      });


      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
      };
    } catch (error) {
      console.error("PDF upload failed:", error);
      throw new Error("Échec de l'enregistrement du PDF");
    }
  }

  async download(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: "raw",
      });
      return Buffer.from(result, "binary");
    } catch (error) {
      console.error("PDF download failed:", error);
      throw new Error("Échec du téléchargement du PDF");
    }
  }

  async delete(publicId) {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: "raw",
      });
    } catch (error) {
      console.error("PDF deletion failed:", error);
    }
  }

  async deleteByUrl(url) {
    try {
      const publicId = url.match(new RegExp(`${this.folder}/[^/]+`))?.[0];
      if (publicId) {
        await this.delete(publicId);
      }
    } catch (error) {
      console.error("Delete by URL failed:", error);
    }
  }
}
