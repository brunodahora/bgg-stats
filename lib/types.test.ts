import { describe, it, expect } from "vitest";
import { getWeightCategory } from "./types";

describe("getWeightCategory", () => {
  describe("null (unrated)", () => {
    it("Given a weight of 0, When getWeightCategory is called, Then it returns null", () => {
      expect(getWeightCategory(0)).toBeNull();
    });

    it("Given a negative weight, When getWeightCategory is called, Then it returns null", () => {
      expect(getWeightCategory(-1)).toBeNull();
    });
  });

  describe("Light (0 < weight <= 1.0)", () => {
    it("Given a weight of 0.5, When getWeightCategory is called, Then it returns 'Light'", () => {
      expect(getWeightCategory(0.5)).toBe("Light");
    });

    it("Given a weight of 1.0 (upper boundary), When getWeightCategory is called, Then it returns 'Light'", () => {
      expect(getWeightCategory(1.0)).toBe("Light");
    });
  });

  describe("Medium Light (1.0 < weight <= 2.0)", () => {
    it("Given a weight of 1.01 (just above Light boundary), When getWeightCategory is called, Then it returns 'Medium Light'", () => {
      expect(getWeightCategory(1.01)).toBe("Medium Light");
    });

    it("Given a weight of 1.5, When getWeightCategory is called, Then it returns 'Medium Light'", () => {
      expect(getWeightCategory(1.5)).toBe("Medium Light");
    });

    it("Given a weight of 2.0 (upper boundary), When getWeightCategory is called, Then it returns 'Medium Light'", () => {
      expect(getWeightCategory(2.0)).toBe("Medium Light");
    });
  });

  describe("Medium (2.0 < weight <= 3.0)", () => {
    it("Given a weight of 2.01 (just above Medium Light boundary), When getWeightCategory is called, Then it returns 'Medium'", () => {
      expect(getWeightCategory(2.01)).toBe("Medium");
    });

    it("Given a weight of 2.5, When getWeightCategory is called, Then it returns 'Medium'", () => {
      expect(getWeightCategory(2.5)).toBe("Medium");
    });

    it("Given a weight of 3.0 (upper boundary), When getWeightCategory is called, Then it returns 'Medium'", () => {
      expect(getWeightCategory(3.0)).toBe("Medium");
    });
  });

  describe("Medium Heavy (3.0 < weight <= 4.0)", () => {
    it("Given a weight of 3.01 (just above Medium boundary), When getWeightCategory is called, Then it returns 'Medium Heavy'", () => {
      expect(getWeightCategory(3.01)).toBe("Medium Heavy");
    });

    it("Given a weight of 3.5, When getWeightCategory is called, Then it returns 'Medium Heavy'", () => {
      expect(getWeightCategory(3.5)).toBe("Medium Heavy");
    });

    it("Given a weight of 4.0 (upper boundary), When getWeightCategory is called, Then it returns 'Medium Heavy'", () => {
      expect(getWeightCategory(4.0)).toBe("Medium Heavy");
    });
  });

  describe("Heavy (weight > 4.0)", () => {
    it("Given a weight of 4.01 (just above Medium Heavy boundary), When getWeightCategory is called, Then it returns 'Heavy'", () => {
      expect(getWeightCategory(4.01)).toBe("Heavy");
    });

    it("Given a weight of 5.0, When getWeightCategory is called, Then it returns 'Heavy'", () => {
      expect(getWeightCategory(5.0)).toBe("Heavy");
    });
  });
});
