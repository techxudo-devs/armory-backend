import cloudinary from "../../config/cloudinary.js";

export const uploadToCloudinary = (fileBuffer, folder = "lucky_seat_games") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    stream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("[CLOUDINARY DELETE ERROR]", error.message);
  }
};
