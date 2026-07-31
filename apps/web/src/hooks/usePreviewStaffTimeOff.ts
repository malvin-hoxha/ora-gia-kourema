import { useMutation } from "@tanstack/react-query";
import { previewStaffTimeOff } from "../api/staff.api";

export function usePreviewStaffTimeOff() {
  return useMutation({
    mutationFn: previewStaffTimeOff,
  });
}