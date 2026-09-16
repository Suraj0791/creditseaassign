import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import authenticate from '../middleware/authenticate';
import authorize from '../middleware/authorize';
import { UserRole } from '../models/User';
import {
  checkEligibility,
  uploadSalarySlip,
  applyLoan,
  getMyApplication,
} from '../controllers/borrower.controller';
import env from '../config/env';

const uploadDir = path.join(__dirname, '../..', env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, and PNG files are allowed'));
    }
  },
});

const handleUploadError = (err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ message: 'File size must be under 5MB' });
      return;
    }
    res.status(400).json({ message: err.message });
    return;
  }
  if (err) {
    res.status(400).json({ message: err.message });
    return;
  }
  next();
};

const router = Router();

router.use(authenticate, authorize(UserRole.BORROWER));

router.post('/check-eligibility', checkEligibility);
router.post('/upload-slip', upload.single('salarySlip'), handleUploadError, uploadSalarySlip);
router.post('/apply', applyLoan);
router.get('/my-application', getMyApplication);

export default router;
