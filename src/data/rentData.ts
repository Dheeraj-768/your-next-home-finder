export interface Resident {
  id: string;
  name: string;
  email: string;
  roomNumber: string;
  rentAmount: number;
  phone: string;
  joinDate: string;
}

export interface RentRecord {
  id: string;
  residentId: string;
  month: string; // "2026-03"
  amount: number;
  status: "paid" | "pending" | "pending_verification" | "rejected";
  paymentDate?: string;
  paymentProofUrl?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface Notification {
  id: string;
  type: "payment_uploaded" | "payment_approved" | "payment_rejected" | "rent_reminder";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetRole: "owner" | "resident";
  residentId?: string;
}

export const mockResidents: Resident[] = [
  { id: "res1", name: "Arjun Mehta", email: "arjun@email.com", roomNumber: "101", rentAmount: 8500, phone: "9876543210", joinDate: "2025-06-01" },
  { id: "res2", name: "Sneha Kulkarni", email: "sneha@email.com", roomNumber: "102", rentAmount: 9500, phone: "9876543211", joinDate: "2025-07-15" },
  { id: "res3", name: "Rahul Verma", email: "rahul@email.com", roomNumber: "103", rentAmount: 8500, phone: "9876543212", joinDate: "2025-08-01" },
  { id: "res4", name: "Priya Nair", email: "priya@email.com", roomNumber: "201", rentAmount: 9500, phone: "9876543213", joinDate: "2025-09-01" },
  { id: "res5", name: "Karthik Sharma", email: "karthik@email.com", roomNumber: "202", rentAmount: 7000, phone: "9876543214", joinDate: "2025-10-15" },
  { id: "res6", name: "Divya Rao", email: "divya@email.com", roomNumber: "203", rentAmount: 8500, phone: "9876543215", joinDate: "2026-01-01" },
  { id: "res7", name: "Amit Joshi", email: "amit@email.com", roomNumber: "301", rentAmount: 11000, phone: "9876543216", joinDate: "2025-05-01" },
  { id: "res8", name: "Neha Gupta", email: "neha@email.com", roomNumber: "302", rentAmount: 12000, phone: "9876543217", joinDate: "2025-11-01" },
];

export const mockRentRecords: RentRecord[] = [
  { id: "rr1", residentId: "res1", month: "2026-03", amount: 8500, status: "paid", paymentDate: "2026-03-02", paymentProofUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400" },
  { id: "rr2", residentId: "res2", month: "2026-03", amount: 9500, status: "paid", paymentDate: "2026-03-01", paymentProofUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400" },
  { id: "rr3", residentId: "res3", month: "2026-03", amount: 8500, status: "pending_verification", paymentDate: "2026-03-28", paymentProofUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400" },
  { id: "rr4", residentId: "res4", month: "2026-03", amount: 9500, status: "pending" },
  { id: "rr5", residentId: "res5", month: "2026-03", amount: 7000, status: "pending" },
  { id: "rr6", residentId: "res6", month: "2026-03", amount: 8500, status: "rejected", paymentProofUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400", rejectionReason: "Blurry image, please re-upload" },
  { id: "rr7", residentId: "res7", month: "2026-03", amount: 11000, status: "paid", paymentDate: "2026-03-05", paymentProofUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400" },
  { id: "rr8", residentId: "res8", month: "2026-03", amount: 12000, status: "pending_verification", paymentDate: "2026-03-29", paymentProofUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400" },
];

export const mockNotifications: Notification[] = [
  { id: "n1", type: "payment_uploaded", title: "Payment Proof Uploaded", message: "Rahul Verma (Room 103) uploaded payment proof for March rent", timestamp: "2026-03-28T14:30:00", read: false, targetRole: "owner", residentId: "res3" },
  { id: "n2", type: "payment_uploaded", title: "Payment Proof Uploaded", message: "Neha Gupta (Room 302) uploaded payment proof for March rent", timestamp: "2026-03-29T09:15:00", read: false, targetRole: "owner", residentId: "res8" },
  { id: "n3", type: "rent_reminder", title: "Rent Pending", message: "Priya Nair (Room 201) has not paid March rent yet", timestamp: "2026-03-25T08:00:00", read: true, targetRole: "owner", residentId: "res4" },
  { id: "n4", type: "rent_reminder", title: "Rent Pending", message: "Karthik Sharma (Room 202) has not paid March rent yet", timestamp: "2026-03-25T08:00:00", read: true, targetRole: "owner", residentId: "res5" },
];
