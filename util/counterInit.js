exports.initializeCounter = async () => {
    try {
      await Counter.updateOne(
        { name: 'partnerId' },
        { $setOnInsert: { value: 0 } },
        { upsert: true } 
      );
      console.log('Counter initialized successfully');
    } catch (err) {
      console.error('Error initializing counter:', err.message);
    }
  };
  

 
  