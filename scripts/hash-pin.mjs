// Hash a PIN for manual seeding: node scripts/hash-pin.mjs 123456
import bcrypt from 'bcryptjs';

const pin = process.argv[2];
if (!pin || !/^\d{6}$/.test(pin)) {
  console.error('Usage: node scripts/hash-pin.mjs <6-digit-pin>');
  process.exit(1);
}
console.log(bcrypt.hashSync(pin, 10));
