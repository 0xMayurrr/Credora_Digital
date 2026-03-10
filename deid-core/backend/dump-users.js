require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

async function fixUsers() {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await mongoose.connection.collection('users').find({}).toArray();
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    process.exit(0);
}
fixUsers().catch(console.error);
