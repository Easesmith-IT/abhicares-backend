const AvailableCity = require("../models/availableCities");

class LocationValidator {
  constructor() {
    // Cache for storing city availability data
    this.cityCache = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  // Generate cache key
  getCacheKey(city, state) {
    return `${city.toUpperCase()}_${state.toUpperCase()}`;
  }

  // Check and update cache
  async getCachedCity(city, state) {
    const key = this.getCacheKey(city, state);
    const cached = this.cityCache.get(key);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    // Fetch from database and update cache
    const cityData = await AvailableCity.findOne({
      city: city.toUpperCase(),
      state: state.toUpperCase(),
      isActive: true,
    }).lean();

    this.cityCache.set(key, {
      data: cityData,
      timestamp: Date.now(),
    });

    return cityData;
  }

  // Clear cache for a specific city or all cities
  clearCache(city = null, state = null) {
    if (city && state) {
      const key = this.getCacheKey(city, state);
      this.cityCache.delete(key);
    } else {
      this.cityCache.clear();
    }
  }

  // Validate location
  async validateLocation(city, state, pinCode) {
    try {
      if (!city || !state || !pinCode) {
        throw new Error("City, state, and pinCode are required");
      }

      const cityData = await this.getCachedCity(city, state);

      if (!cityData) {
        throw new Error(`Service is not available in ${city}, ${state}`);
      }

      const validPinCode = cityData.pinCodes.find(
        (p) => p.code === parseInt(pinCode) && p.isActive
      );

      if (!validPinCode) {
        throw new Error(`Service is not available for pincode ${pinCode}`);
      }

      return {
        isValid: true,
        cityData,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }
}

// Create singleton instance
const locationValidator = new LocationValidator();

module.exports = locationValidator;
