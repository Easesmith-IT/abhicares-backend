const AvailableCity = require("../models/availableCities");

class PincodeValidator {
  constructor() {
    this.pincodeCache = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  // Get cached pincode data
  async getCachedPincodeData(pinCode) {
    const cached = this.pincodeCache.get(pinCode);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    // Efficient query using index on pinCodes.code
    const cityData = await AvailableCity.findOne(
      {
        pinCodes: {
          $elemMatch: {
            code: parseInt(pinCode),
            isActive: true,
          },
        },
        isActive: true,
      },
      {
        city: 1,
        state: 1,
        "pinCodes.$": 1, // Only return the matched pincode
      }
    ).lean();

    // Cache the result (even if null, to prevent repeated DB queries for invalid pincodes)
    this.pincodeCache.set(pinCode, {
      data: cityData,
      timestamp: Date.now(),
    });

    return cityData;
  }

  // Clear specific pincode cache or entire cache
  clearCache(pinCode = null) {
    if (pinCode) {
      this.pincodeCache.delete(pinCode);
    } else {
      this.pincodeCache.clear();
    }
  }

  // Validate pincode
  async validatePincode(pinCode) {
    try {
      if (!pinCode) {
        throw new Error("Pincode is required");
      }

      // Validate pincode format
      if (!/^\d{6}$/.test(pinCode)) {
        throw new Error("Invalid pincode format. Must be 6 digits");
      }

      const locationData = await this.getCachedPincodeData(parseInt(pinCode));

      if (!locationData) {
        throw new Error(`Service is not available for pincode ${pinCode}`);
      }

      return {
        isValid: true,
        data: {
          city: locationData.city,
          state: locationData.state,
          pinCode: locationData.pinCodes[0].code,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  // Periodic cache cleanup (optional)
  startCacheCleanup(interval = 30 * 60 * 1000) {
    // 30 minutes default
    setInterval(() => {
      const now = Date.now();
      for (const [pincode, data] of this.pincodeCache.entries()) {
        if (now - data.timestamp > this.CACHE_DURATION) {
          this.pincodeCache.delete(pincode);
        }
      }
    }, interval);
  }
}

// Create singleton instance
const pincodeValidator = new PincodeValidator();

// Start periodic cache cleanup
pincodeValidator.startCacheCleanup();

module.exports = pincodeValidator;
