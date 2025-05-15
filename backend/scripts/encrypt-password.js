const bcrypt = require('bcryptjs');

async function encryptPassword() {
    const password = 'yq071010';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('加密后的密码:', hashedPassword);
}

encryptPassword().catch(console.error); 