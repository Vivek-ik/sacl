import { Router } from "express";
import multer from "multer";
import { protect } from "../middleware/auth.js";
import cloudinary from "../utils/cloudinary.js";
const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
router.post("/", protect, upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Image is required" });
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: "sacl2", resource_type: "image" },
        (error, result) => error ? reject(error) : resolve(result));
      stream.end(req.file.buffer);
    });
    res.status(201).json({ url: result.secure_url, publicId: result.public_id });
  } catch (e) { next(e); }
});
export default router;
