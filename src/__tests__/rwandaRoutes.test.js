import { describe, it, expect } from "vitest";
import {
  calculateServiceFee,
  getSuggestedPrice,
  calculatePricingBreakdown,
  isRideUpcoming,
} from "../services/rwandaRoutes";

describe("calculateServiceFee", () => {
  it("calculates 15% platform service fee correctly", () => {
    expect(calculateServiceFee(10000)).toBe(1500);
    expect(calculateServiceFee(4500)).toBe(675);
    expect(calculateServiceFee(0)).toBe(0);
  });
});

describe("getSuggestedPrice", () => {
  it("returns fair price for common Rwanda routes", () => {
    expect(getSuggestedPrice("Kigali", "Huye")).toBe(4500);
    expect(getSuggestedPrice("Huye", "Kigali")).toBe(4500);
    expect(getSuggestedPrice("Kigali", "Musanze")).toBe(4000);
    expect(getSuggestedPrice("Kigali", "Rubavu")).toBe(5500);
  });

  it("returns default 4000 for unspecified routes", () => {
    expect(getSuggestedPrice("UnknownCityA", "UnknownCityB")).toBe(4000);
  });
});

describe("calculatePricingBreakdown", () => {
  it("computes accurate passenger and driver breakdown", () => {
    const result = calculatePricingBreakdown(4500, 2);
    expect(result.seatCount).toBe(2);
    expect(result.subtotal).toBe(9000);
    expect(result.platformFee).toBe(1350);
    expect(result.driverNetEarnings).toBe(9000);
    expect(result.passengerTotal).toBe(10350);
  });
});

describe("isRideUpcoming", () => {
  it("returns true for future dates", () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    expect(isRideUpcoming(futureDate, "12:00")).toBe(true);
  });

  it("returns false for past dates", () => {
    expect(isRideUpcoming("2020-01-01", "08:00")).toBe(false);
  });
});
