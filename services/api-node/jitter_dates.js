import mongoose from 'mongoose';
mongoose.connect('mongodb://127.0.0.1:27017/survey_validation').then(async (m) => {
  const coll = m.connection.db.collection('anomalyrecords');
  const docs = await coll.find({}).toArray();
  let count = 0;
  for (let doc of docs) {
    const daysAgo = Math.floor(Math.random() * 14);
    const hoursAgo = Math.floor(Math.random() * 24);
    const newDate = new Date();
    newDate.setDate(newDate.getDate() - daysAgo);
    newDate.setHours(newDate.getHours() - hoursAgo);
    await coll.updateOne({ _id: doc._id }, { $set: { createdAt: newDate, detectedAt: newDate } });
    count++;
  }
  console.log('Jittered dates for ' + count + ' docs.');
  process.exit();
}).catch(console.error);
