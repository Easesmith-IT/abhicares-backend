const { counterSchema } = require("../models/counter");

exports.initializeCounter = async () => {
    try {
      await counterSchema.updateOne(
        { name: 'partnerId' },
        { $setOnInsert: { value: 0 } },
        { upsert: true } 
      );
      console.log('Counter initialized successfully');
    } catch (err) {
      console.error('Error initializing counter:', err.message);
    }
  };
  

 
  