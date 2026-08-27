import { z } from "zod";

export const bookingSchema = z.object({
  propertyId: z.string().min(1),
  guestName: z.string().trim().min(2, "Ange ditt namn"),
  guestEmail: z.string().trim().email("Ange en giltig e-postadress"),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ogiltigt incheckningsdatum"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ogiltigt utcheckningsdatum"),
  guests: z.coerce.number().int().min(1, "Minst en gäst"),
  cardName: z.string().trim().min(2, "Ange kortinnehavarens namn"),
  cardNumber: z.string().trim().min(12, "Ange ett giltigt kortnummer"),
  cardExpMonth: z.coerce.number().int().min(1).max(12),
  cardExpYear: z.coerce.number().int().min(2024).max(2100),
  cardCvc: z.string().trim().min(3).max(4),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const listingSchema = z.object({
  title: z.string().trim().min(3, "Ange en titel"),
  city: z.string().trim().min(2, "Ange stad"),
  country: z.string().trim().min(2, "Ange land"),
  description: z.string().trim().min(10, "Beskriv boendet med minst 10 tecken"),
  nightlyPrice: z.coerce.number().min(1, "Ange ett pris per natt"),
  cleaningFee: z.coerce.number().min(0).default(0),
  maxGuests: z.coerce.number().int().min(1).max(16),
  bedrooms: z.coerce.number().int().min(0).max(20),
  beds: z.coerce.number().int().min(1).max(40),
  baths: z.coerce.number().int().min(1).max(20),
  hostName: z.string().trim().min(2, "Ange värdens namn"),
});

export type ListingInput = z.infer<typeof listingSchema>;
