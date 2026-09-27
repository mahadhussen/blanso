import { z } from "zod";

export const bookingSchema = z.object({
  propertyId: z.string().min(1),
  roomTypeId: z.string().min(1, "Choose a room"),
  rooms: z.coerce.number().int().min(1, "Choose at least one room").max(50),
  guestFirstName: z.string().trim().min(1, "Enter your first name"),
  guestLastName: z.string().trim().min(1, "Enter your last name"),
  guestEmail: z.string().trim().email("Enter a valid email address"),
  guestPhone: z.string().trim().optional(),
  guestMessage: z.string().trim().max(1000).optional(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid check-in date"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid check-out date"),
  guests: z.coerce.number().int().min(1, "At least one guest"),
  cardName: z.string().trim().min(2, "Enter the cardholder name"),
  cardNumber: z.string().trim().min(12, "Enter a valid card number"),
  cardExpMonth: z.coerce.number().int().min(1).max(12),
  cardExpYear: z.coerce.number().int().min(2024).max(2100),
  cardCvc: z.string().trim().min(3).max(4),
});

export type BookingInput = z.infer<typeof bookingSchema>;

// En rumstyp i värdens extranät. Pris i dollar i formuläret, cent i domänen.
export const roomTypeSchema = z.object({
  name: z.string().trim().min(2, "Name the room type, e.g. Deluxe Double Room").max(80),
  sizeSqm: z.coerce.number().int("Room size in whole m²").min(5, "Room size must be at least 5 m²").max(2000),
  bedConfig: z.string().trim().min(3, "Describe the beds, e.g. 1 king bed").max(80),
  maxGuests: z.coerce.number().int().min(1, "At least 1 guest per room").max(16, "At most 16 guests per room"),
  units: z.coerce.number().int().min(1, "At least 1 room of this type").max(500),
  nightlyPrice: z.coerce.number().min(1, "Enter a price per night").max(100000),
});

export type RoomTypeInput = z.infer<typeof roomTypeSchema>;

// Nytt boende = boendet + dess första rumstyp (fälten med prefix room*).
export const listingSchema = z.object({
  title: z.string().trim().min(3, "Enter a property name"),
  city: z.string().trim().min(2, "Enter a city"),
  country: z.string().trim().min(2, "Enter a country"),
  description: z.string().trim().min(10, "Describe the property in at least 10 characters"),
  cleaningFee: z.coerce.number().min(0).default(0),
  amenities: z.string().optional(),
  roomName: roomTypeSchema.shape.name,
  roomSizeSqm: roomTypeSchema.shape.sizeSqm,
  roomBedConfig: roomTypeSchema.shape.bedConfig,
  roomMaxGuests: roomTypeSchema.shape.maxGuests,
  roomUnits: roomTypeSchema.shape.units,
  roomNightlyPrice: roomTypeSchema.shape.nightlyPrice,
});

export type ListingInput = z.infer<typeof listingSchema>;

// Dollar (formulär) → heltal cent (domän). Enda konverteringspunkten.
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}
