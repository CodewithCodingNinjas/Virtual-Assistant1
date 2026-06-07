import multer from "multer"
import path from "path"
import crypto from "crypto"

// Store uploads under ./public with a generated, collision-free name. Using the
// client-supplied originalname directly risks path traversal and lets one user
// overwrite another's file — so we derive a random name and keep only the
// extension from the original.
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "./public"),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase()
        const safe = crypto.randomBytes(16).toString("hex") + ext
        cb(null, safe)
    },
})

// Accept images only, cap at 5 MB.
const fileFilter = (req, file, cb) => {
    if (/^image\/(png|jpe?g|gif|webp)$/.test(file.mimetype)) cb(null, true)
    else cb(new Error("only image uploads are allowed"), false)
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
})

export default upload
