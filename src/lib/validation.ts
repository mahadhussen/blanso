import { z } from "zod";

export const bookingSchema = z.object({
  propertyId: z.string().min(1),
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

export const listingSchema = z.object({
  title: z.string().trim().min(3, "Enter a title"),
  city: z.string().trim().min(2, "Enter a city"),
  country: z.string().trim().min(2, "Enter a country"),
  description: z.string().trim().min(10, "Describe the stay in at least 10 characters"),
  nightlyPrice: z.coerce.number().min(1, "Enter a nightly price"),
  cleaningFee: z.coerce.number().min(0).default(0),
  maxGuests: z.coerce.number().int().min(1).max(16),
  bedrooms: z.coerce.number().int().min(0).max(20),
  beds: z.coerce.number().int().min(1).max(40),
  baths: z.coerce.number().int().min(1).max(20),
  amenities: z.string().optional(),
});

export type ListingInput = z.infer<typeof listingSchema>;
