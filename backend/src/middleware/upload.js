const multer = require("multer")
const path = require("path")
const AppError = require("../utils/appError")

const fs = require("fs");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
    // ✅ Folder exist nahi ho to create kar le
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  },
});


const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image") || file.mimetype === "application/pdf") {
    cb(null, true)
  } else {
    cb(new AppError("Not an image or PDF! Please upload only images or PDF files.", 400), false)
  }
}

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})

module.exports = upload
