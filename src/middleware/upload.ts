import multer from "multer";
import { AppError } from "../utils/AppError.js";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new AppError(400, "INVALID_FILE_TYPE", "Only JPEG, PNG, or WEBP images are allowed"));
      return;
    }
    cb(null, true);
  },
});
