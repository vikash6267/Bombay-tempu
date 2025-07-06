const mongoose = require("mongoose")

const counterSchema = new mongoose.Schema({
  _id: {type: String, required: true}, // counter name (e.g., 'trip', 'invoice', 'user')
  sequence: {type: Number, default: 0},
  prefix: {type: String, default: ""}, // optional prefix like "TRP", "INV"
  suffix: {type: String, default: ""}, // optional suffix
  padLength: {type: Number, default: 4}, // zero padding length
  lastReset: {type: Date, default: Date.now},
  resetPeriod: {
    type: String,
    enum: ["none", "daily", "monthly", "yearly"],
    default: "none",
  },
});

const Counter = mongoose.model("Counter", counterSchema);

// Helper function to get next sequence number
async function getNextSequence(counterName, options = {}) {
  const {
    prefix = "",
    suffix = "",
    padLength = 4,
    resetPeriod = "none",
  } = options;

  try {
    // Check if counter needs to be reset based on period
    const now = new Date();
    let shouldReset = false;
    let resetCondition = {};

    if (resetPeriod !== "none") {
      const existingCounter = await Counter.findById(counterName);
      if (existingCounter && existingCounter.lastReset) {
        const lastReset = new Date(existingCounter.lastReset);

        switch (resetPeriod) {
          case "daily":
            shouldReset =
              now.getDate() !== lastReset.getDate() ||
              now.getMonth() !== lastReset.getMonth() ||
              now.getFullYear() !== lastReset.getFullYear();
            break;
          case "monthly":
            shouldReset =
              now.getMonth() !== lastReset.getMonth() ||
              now.getFullYear() !== lastReset.getFullYear();
            break;
          case "yearly":
            shouldReset = now.getFullYear() !== lastReset.getFullYear();
            break;
        }
      }
    }

    // Update counter with atomic operation
    const updateOperation = shouldReset
      ? {
          sequence: 1,
          prefix,
          suffix,
          padLength,
          lastReset: now,
          resetPeriod,
        }
      : {
          $inc: {sequence: 1},
          $set: {
            prefix,
            suffix,
            padLength,
            lastReset: shouldReset ? now : undefined,
            resetPeriod,
          },
        };

    const counter = await Counter.findByIdAndUpdate(
      counterName,
      updateOperation,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    // Format the number with padding
    const paddedNumber = counter.sequence.toString().padStart(padLength, "0");

    // Build the final number string
    let finalNumber = "";
    if (prefix) finalNumber += prefix;
    finalNumber += paddedNumber;
    if (suffix) finalNumber += suffix;

    return {
      number: finalNumber,
      sequence: counter.sequence,
      counter: counter,
    };
  } catch (error) {
    console.error("Error getting next sequence:", error);
    throw new Error("Failed to generate sequence number");
  }
}



 class CounterService {
  // Initialize counter
  static async initializeCounter(counterName, options = {}) {
    const {
      startFrom = 1,
      prefix = "",
      suffix = "",
      padLength = 4,
      resetPeriod = "none",
    } = options;

    try {
      const existingCounter = await Counter.findById(counterName);
      if (!existingCounter) {
        const counter = new Counter({
          _id: counterName,
          sequence: startFrom - 1, // Will be incremented to startFrom on first use
          prefix,
          suffix,
          padLength,
          resetPeriod,
        });
        await counter.save();
        console.log(`Counter '${counterName}' initialized successfully`);
      }
      return true;
    } catch (error) {
      console.error("Error initializing counter:", error);
      throw error;
    }
  }

  // Get next number
  static async getNext(counterName, options = {}) {
    return await getNextSequence(counterName, options);
  }

  // Reset counter
  static async resetCounter(counterName, resetTo = 0) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        counterName,
        {
          sequence: resetTo,
          lastReset: new Date(),
        },
        {new: true}
      );

      if (!counter) {
        throw new Error(`Counter '${counterName}' not found`);
      }

      return counter;
    } catch (error) {
      console.error("Error resetting counter:", error);
      throw error;
    }
  }

  // Get current counter info
  static async getCounterInfo(counterName) {
    try {
      const counter = await Counter.findById(counterName);
      return counter;
    } catch (error) {
      console.error("Error getting counter info:", error);
      throw error;
    }
  }

  // Update counter settings
  static async updateCounterSettings(counterName, settings) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        counterName,
        {$set: settings},
        {new: true}
      );

      if (!counter) {
        throw new Error(`Counter '${counterName}' not found`);
      }

      return counter;
    } catch (error) {
      console.error("Error updating counter settings:", error);
      throw error;
    }
  }
}





// Export everything
module.exports = {
  Counter,
  CounterService,
  getNextSequence, 
};
