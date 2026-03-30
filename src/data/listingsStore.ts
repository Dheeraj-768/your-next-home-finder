import { pgListings, type PGListing } from "@/data/mockData";

export type ListingStatus = "approved" | "pending" | "rejected";

export interface ManagedListing extends PGListing {
  status: ListingStatus;
  ownerId: string;
  createdAt: string;
  rejectionReason?: string;
}

// Initialize store from mock data (all approved) + some pending ones
const pendingListings: ManagedListing[] = [
  {
    id: "pending-1",
    name: "CozyNest PG",
    ownerName: "Ravi Shankar",
    location: "Jayanagar, Bangalore",
    city: "Bangalore",
    address: "12, 4th Block, Jayanagar",
    rent: 7500,
    description: "Newly opened PG with modern furnishings, hot water, and home-style food. Walking distance from Jayanagar metro station.",
    images: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800"],
    facilities: ["WiFi", "Food", "Hot Water", "Laundry"],
    rating: 0,
    reviewCount: 0,
    vacancies: 8,
    occupancy: "Double Sharing",
    gender: "male",
    nearbyPlaces: [{ name: "Jayanagar Metro", distance: "300 m", type: "transport" }],
    ratings: { food: 0, cleanliness: 0, wifi: 0, safety: 0 },
    status: "pending",
    ownerId: "u-owner",
    createdAt: "2026-03-28",
  },
  {
    id: "pending-2",
    name: "Lakeview Ladies Hostel",
    ownerName: "Anita Desai",
    location: "Ulsoor, Bangalore",
    city: "Bangalore",
    address: "88, Ulsoor Lake Road",
    rent: 10000,
    description: "Premium ladies hostel overlooking Ulsoor Lake. AC rooms, gym, and 24/7 security with biometric entry.",
    images: ["https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800"],
    facilities: ["WiFi", "Food", "AC", "Gym", "CCTV", "Biometric Entry"],
    rating: 0,
    reviewCount: 0,
    vacancies: 4,
    occupancy: "Single",
    gender: "female",
    nearbyPlaces: [{ name: "Ulsoor Lake", distance: "100 m", type: "transport" }],
    ratings: { food: 0, cleanliness: 0, wifi: 0, safety: 0 },
    status: "pending",
    ownerId: "u-owner2",
    createdAt: "2026-03-29",
  },
];

let allListings: ManagedListing[] = [
  ...pgListings.map((pg) => ({
    ...pg,
    status: "approved" as ListingStatus,
    ownerId: "u-owner",
    createdAt: "2026-01-01",
  })),
  ...pendingListings,
];

export function getAllListings(): ManagedListing[] {
  return [...allListings];
}

export function getApprovedListings(): ManagedListing[] {
  return allListings.filter((l) => l.status === "approved");
}

export function getOwnerListings(ownerId: string): ManagedListing[] {
  return allListings.filter((l) => l.ownerId === ownerId);
}

export function approveListing(id: string) {
  allListings = allListings.map((l) => l.id === id ? { ...l, status: "approved" as ListingStatus } : l);
}

export function rejectListing(id: string, reason: string) {
  allListings = allListings.map((l) => l.id === id ? { ...l, status: "rejected" as ListingStatus, rejectionReason: reason } : l);
}

export function flagListing(id: string) {
  allListings = allListings.map((l) => l.id === id ? { ...l, status: "rejected" as ListingStatus, rejectionReason: "Flagged by admin" } : l);
}

export function removeListing(id: string) {
  allListings = allListings.filter((l) => l.id !== id);
}

export function addListing(listing: ManagedListing) {
  allListings = [listing, ...allListings];
}
