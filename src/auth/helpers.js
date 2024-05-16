import crypto from 'crypto'

// see How password is stored

// function generateHash(password) {
//     const salt = crypto.randomBytes(16)
//     const hash = crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512')

//     return {salt, hash}
// }

function isEqualHash(salt, hash, password) {
  const _hash = crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512')
  // note point 5. in notes
  return crypto.timingSafeEqual(_hash, hash)
}

export { isEqualHash }
