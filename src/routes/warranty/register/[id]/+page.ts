import { error } from '@sveltejs/kit';
import { apiService, type WarrantyStatusResponse } from '$lib/api';

export const load = async ({ params }: { params: { id: string } }) => {
  const warrantyId = params.id;

  if (!warrantyId) {
    throw error(404, 'Warranty ID not found');
  }

  // 檢查保固狀態
  let statusCheckResult: WarrantyStatusResponse | null = null;
  let statusError: string | null = null;

  try {
    const response = await apiService.checkWarrantyStatus(warrantyId);
    if (response.data) {
      statusCheckResult = response.data;
    } else {
      statusError = response.error || "無法檢查保固狀態";
    }
  } catch (e: any) {
    statusError = "檢查保固狀態時發生錯誤: " + e.message;
  }

  return {
    warrantyId,
    statusCheckResult,
    statusError
  };
}; 