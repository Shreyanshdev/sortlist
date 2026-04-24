import multer from 'multer';

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// A simple magic bytes checker for PDF and DOCX
export const validateMagicBytes = (buffer: Buffer, mimeType: string): boolean => {
  if (mimeType === 'application/pdf') {
    // PDF magic bytes: %PDF- (25 50 44 46 2D)
    return buffer.length > 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }
  
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // DOCX (ZIP) magic bytes: PK.. (50 4B 03 04)
    return buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
  }
  
  return false;
};
