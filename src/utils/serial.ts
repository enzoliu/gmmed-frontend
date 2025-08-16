/**
 * 從完整序號中提取序號
 * 從後方開始取11位，包含dash
 * 僅在完整序號trim後長度等於54時才提取
 */
export function extractSerialNumber(fullSerialNumber: string): string | null {
  if (!fullSerialNumber) return null;
  
  const trimmed = fullSerialNumber.trim();
  
  // 檢查長度是否為54
  if (trimmed.length !== 54) return null;
  
  // 從後方開始取11位
  const serialNumber = trimmed.slice(-11);
  
  return serialNumber;
}

/**
 * 檢查完整序號是否有效（長度為54）
 */
export function isValidFullSerialLength(fullSerialNumber: string): boolean {
  if (!fullSerialNumber) return false;
  return fullSerialNumber.trim().length === 54;
}

