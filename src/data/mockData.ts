export interface PGListing {
  id: string;
  name: string;
  ownerName: string;
  location: string;
  city: string;
  address: string;
  rent: number;
  description: string;
  images: string[];
  panoramaUrl?: string;
  facilities: string[];
  rating: number;
  reviewCount: number;
  vacancies: number;
  occupancy: string;
  gender: "male" | "female" | "co-ed";
  nearbyPlaces: { name: string; distance: string; type: string }[];
  ratings: { food: number; cleanliness: number; wifi: number; safety: number };
}

export interface Review {
  id: string;
  pgId: string;
  studentName: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
  ratings: { food: number; cleanliness: number; wifi: number; safety: number };
}

export interface Booking {
  id: string;
  pgId: string;
  pgName: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "rejected";
}

export const pgListings: PGListing[] = [
  {
    id: "1",
    name: "Sunrise PG for Men",
    ownerName: "Rajesh Kumar",
    location: "Koramangala, Bangalore",
    city: "Bangalore",
    address: "123, 5th Cross, Koramangala 4th Block",
    rent: 8500,
    description: "A comfortable and well-maintained PG with excellent amenities. Located in the heart of Koramangala, close to tech parks and restaurants. We offer home-cooked meals, high-speed WiFi, and 24/7 security.",
    images: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    ],
    panoramaUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=2048",
    facilities: ["WiFi", "Food", "AC", "Laundry", "Parking", "Power Backup", "Security"],
    rating: 4.3,
    reviewCount: 47,
    vacancies: 3,
    occupancy: "Double Sharing",
    gender: "male",
    nearbyPlaces: [
      { name: "Christ University", distance: "2 km", type: "college" },
      { name: "Apollo Hospital", distance: "1.5 km", type: "hospital" },
      { name: "Koramangala Bus Stop", distance: "500 m", type: "transport" },
    ],
    ratings: { food: 4.2, cleanliness: 4.5, wifi: 4.0, safety: 4.6 },
  },
  {
    id: "2",
    name: "GreenNest Ladies PG",
    ownerName: "Priya Sharma",
    location: "HSR Layout, Bangalore",
    city: "Bangalore",
    address: "45, Sector 3, HSR Layout",
    rent: 9500,
    description: "Premium ladies PG with fully furnished rooms, attached bathrooms, and a rooftop terrace. We prioritize safety with CCTV surveillance and biometric entry.",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
    ],
    facilities: ["WiFi", "Food", "AC", "Gym", "CCTV", "Biometric Entry", "Laundry"],
    rating: 4.7,
    reviewCount: 89,
    vacancies: 1,
    occupancy: "Single",
    gender: "female",
    nearbyPlaces: [
      { name: "PES University", distance: "3 km", type: "college" },
      { name: "Manipal Hospital", distance: "2 km", type: "hospital" },
      { name: "HSR BDA Complex", distance: "800 m", type: "transport" },
    ],
    ratings: { food: 4.8, cleanliness: 4.9, wifi: 4.5, safety: 4.9 },
  },
  {
    id: "3",
    name: "BlueSky Co-Living",
    ownerName: "Amit Patel",
    location: "Indiranagar, Bangalore",
    city: "Bangalore",
    address: "78, 12th Main, Indiranagar",
    rent: 12000,
    description: "Modern co-living space designed for young professionals. Community events, coworking space, and premium amenities included.",
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800",
      "https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800",
    ],
    panoramaUrl: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=2048",
    facilities: ["WiFi", "Food", "AC", "Coworking", "Gym", "Terrace", "Events", "Housekeeping"],
    rating: 4.5,
    reviewCount: 62,
    vacancies: 5,
    occupancy: "Single & Double",
    gender: "co-ed",
    nearbyPlaces: [
      { name: "RVCE", distance: "5 km", type: "college" },
      { name: "Indiranagar Metro", distance: "300 m", type: "transport" },
      { name: "Fortis Hospital", distance: "3 km", type: "hospital" },
    ],
    ratings: { food: 4.3, cleanliness: 4.6, wifi: 4.7, safety: 4.4 },
  },
  {
    id: "4",
    name: "Urban Stay PG",
    ownerName: "Suresh Reddy",
    location: "BTM Layout, Bangalore",
    city: "Bangalore",
    address: "22, 2nd Stage, BTM Layout",
    rent: 7000,
    description: "Affordable PG accommodation with clean rooms and basic amenities. Great connectivity to Silk Board and Electronic City.",
    images: [
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800",
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800",
    ],
    facilities: ["WiFi", "Food", "Laundry", "Power Backup"],
    rating: 3.9,
    reviewCount: 34,
    vacancies: 7,
    occupancy: "Triple Sharing",
    gender: "male",
    nearbyPlaces: [
      { name: "BMS College", distance: "4 km", type: "college" },
      { name: "Silk Board Junction", distance: "1 km", type: "transport" },
    ],
    ratings: { food: 3.8, cleanliness: 4.0, wifi: 3.7, safety: 4.1 },
  },
  {
    id: "5",
    name: "HomeAway Women's Hostel",
    ownerName: "Lakshmi Devi",
    location: "Marathahalli, Bangalore",
    city: "Bangalore",
    address: "56, Outer Ring Road, Marathahalli",
    rent: 8000,
    description: "Safe and welcoming women's hostel near major IT parks. Home-style food and a warm community atmosphere.",
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
      "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
    ],
    facilities: ["WiFi", "Food", "CCTV", "Security Guard", "Hot Water", "Laundry"],
    rating: 4.4,
    reviewCount: 56,
    vacancies: 2,
    occupancy: "Double Sharing",
    gender: "female",
    nearbyPlaces: [
      { name: "IIIT Bangalore", distance: "6 km", type: "college" },
      { name: "Marathahalli Bridge", distance: "500 m", type: "transport" },
      { name: "Columbia Asia Hospital", distance: "1 km", type: "hospital" },
    ],
    ratings: { food: 4.6, cleanliness: 4.3, wifi: 4.1, safety: 4.7 },
  },
  {
    id: "6",
    name: "TechNest Coliving",
    ownerName: "Vikram Singh",
    location: "Whitefield, Bangalore",
    city: "Bangalore",
    address: "99, ITPL Main Road, Whitefield",
    rent: 11000,
    description: "Tech-forward coliving space with high-speed fiber internet, gaming zone, and community kitchen. Perfect for tech professionals.",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800",
    ],
    panoramaUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2048",
    facilities: ["WiFi", "Food", "AC", "Gaming Zone", "Gym", "Coworking", "Housekeeping", "Parking"],
    rating: 4.6,
    reviewCount: 73,
    vacancies: 4,
    occupancy: "Single & Double",
    gender: "co-ed",
    nearbyPlaces: [
      { name: "ITPL", distance: "500 m", type: "transport" },
      { name: "Whitefield Metro", distance: "2 km", type: "transport" },
    ],
    ratings: { food: 4.4, cleanliness: 4.7, wifi: 4.9, safety: 4.5 },
  },
];

export const reviews: Review[] = [
  {
    id: "r1",
    pgId: "1",
    studentName: "Arjun M.",
    avatar: "A",
    rating: 4.5,
    comment: "Great place to stay! The food is home-cooked and the rooms are well maintained. WiFi could be better during peak hours.",
    date: "2026-03-15",
    verified: true,
    ratings: { food: 4.5, cleanliness: 4.5, wifi: 3.8, safety: 4.8 },
  },
  {
    id: "r2",
    pgId: "1",
    studentName: "Karthik R.",
    avatar: "K",
    rating: 4.0,
    comment: "Decent PG with good location. The owner is responsive. Could improve the common area facilities.",
    date: "2026-02-28",
    verified: true,
    ratings: { food: 4.0, cleanliness: 4.2, wifi: 3.5, safety: 4.5 },
  },
  {
    id: "r3",
    pgId: "2",
    studentName: "Sneha K.",
    avatar: "S",
    rating: 4.8,
    comment: "Best ladies PG I've stayed in! The security is top-notch and the food is amazing. Highly recommended.",
    date: "2026-03-20",
    verified: true,
    ratings: { food: 4.9, cleanliness: 5.0, wifi: 4.5, safety: 5.0 },
  },
];

export const sampleBookings: Booking[] = [];

export const cities = ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai"];

export const allFacilities = [
  "WiFi", "Food", "AC", "Laundry", "Parking", "Power Backup", "Security",
  "CCTV", "Gym", "Coworking", "Terrace", "Housekeeping", "Hot Water",
  "Gaming Zone", "Biometric Entry", "Events",
];
