import CryptoJS from 'crypto-js';

/**
 * Encrypts a file (Blob or File) using AES encryption
 * @param {Blob} file - The file to encrypt
 * @param {string} password - The password to use for encryption
 * @returns {Promise<Blob>} - A promise that resolves with the encrypted file as a Blob
 */
export const encryptFile = async (file, password) => {
  // Convert file to array buffer and then to word array
  const arrayBuffer = await file.arrayBuffer();
  const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
  
  // Encrypt the file data with the password
  const encrypted = CryptoJS.AES.encrypt(wordArray, password).toString();
  
  // Convert back to Blob
  const encryptedBlob = new Blob([encrypted], { type: 'application/encrypted' });
  
  return encryptedBlob;
};

/**
 * Decrypts an encrypted file
 * @param {Blob} encryptedBlob - The encrypted file as a Blob
 * @param {string} password - The password used for encryption
 * @returns {Promise<Blob>} - A promise that resolves with the decrypted file as a Blob
 */
export const decryptFile = async (encryptedBlob, password) => {
  try {
    // Convert the encrypted blob to text
    const encryptedText = await encryptedBlob.text();
    
    // Decrypt the data
    const decrypted = CryptoJS.AES.decrypt(encryptedText, password);
    
    // Check if decryption was successful by verifying the output
    // If the password is wrong, decrypted.sigBytes will likely be 0 or very small
    if (!decrypted || decrypted.sigBytes === 0) {
      throw new Error('Wrong password');
    }
    
    // Convert to Uint8Array
    const bytes = decrypted.words;
    const byteArray = new Uint8Array(decrypted.sigBytes);
    
    // Extract bytes from the WordArray
    for (let i = 0; i < decrypted.sigBytes; i++) {
      const bytePosition = Math.floor(i / 4);
      const byteShift = 8 * (3 - (i % 4));
      byteArray[i] = (bytes[bytePosition] >>> byteShift) & 0xff;
    }
    
    // Basic validation that the decrypted data looks like a ZIP file
    // Check for the ZIP file signature "PK" in the first two bytes
    if (byteArray.length > 2) {
      if (!(byteArray[0] === 80 && byteArray[1] === 75)) {
        throw new Error('Wrong password. Decrypted data is not a valid ZIP file.');
      }
    }
    
    // Create a blob from the array
    return new Blob([byteArray], { type: 'application/zip' });
  } catch (error) {
    console.error('Error decrypting file:', error);
    
    // Provide more specific error messages based on the type of error
    if (error.message.includes('Malformed UTF-8') || 
        error.message.includes('pad block') ||
        error.message.includes('bad decrypt') ||
        error.message.includes('Wrong password')) {
      throw new Error('Wrong password');
    } else if (error.message.includes('is not defined') || error.message.includes('cannot read property')) {
      throw new Error('Decryption failed. The file may be corrupted or not properly encrypted.');
    } else {
      throw new Error('Failed to decrypt file. Please check your password and try again.');
    }
  }
};

/**
 * Encrypts a passphrase for URL transmission
 * This should be a simple encoding that can be reversed, not a secure hash
 * @param {string} passphrase - The passphrase to encode
 * @returns {string} - The encoded passphrase
 */
export const encodePassphrase = (passphrase) => {
  // Base64 encode and encode for URL
  return btoa(passphrase).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/**
 * Decodes a passphrase from URL format
 * @param {string} encodedPassphrase - The encoded passphrase
 * @returns {string} - The decoded passphrase
 */
export const decodePassphrase = (encodedPassphrase) => {
  // Add back any padding
  let padding = '';
  const paddingLength = encodedPassphrase.length % 4;
  if (paddingLength > 0) {
    padding = '='.repeat(4 - paddingLength);
  }
  
  // Decode from URL-safe base64
  const base64 = encodedPassphrase.replace(/-/g, '+').replace(/_/g, '/') + padding;
  
  try {
    return atob(base64);
  } catch (error) {
    console.error('Error decoding passphrase:', error);
    return '';
  }
};

/**
 * Checks if a file is likely encrypted
 * @param {Blob} blob - The file to check
 * @returns {Promise<boolean>} - Whether the file is likely encrypted
 */
export const isFileEncrypted = async (blob) => {
  try {
    // If it has our custom mime type, it's definitely encrypted
    if (blob.type === 'application/encrypted') {
      return true;
    }
    
    // Read the first 20 bytes of the file
    const headerBytes = await blob.slice(0, 20).text();
    
    // Check for encryption signatures
    // AES encrypted files via CryptoJS often start with 'Salted__'
    if (headerBytes.includes('Salted__')) {
      return true;
    }
    
    // Most ZIP files start with PK (hex: 50 4B)
    // If it's not a ZIP file and is application/octet-stream, it might be encrypted
    const isPkZip = headerBytes.charCodeAt(0) === 80 && headerBytes.charCodeAt(1) === 75;
    if (!isPkZip && (blob.type === 'application/octet-stream' || blob.type === 'text/plain')) {
      return true;
    }
    
    // Additional check for Base64 encoded AES encryption
    // Most encrypted content will be random-looking Base64 characters
    const isBase64Like = /^[A-Za-z0-9+/=]+$/.test(headerBytes.slice(0, 10));
    const hasEncryptionMarkers = headerBytes.includes('cipher') || 
                               headerBytes.includes('AES') || 
                               headerBytes.includes('enc');
                               
    return isBase64Like && hasEncryptionMarkers;
  } catch (error) {
    console.error('Error checking file encryption:', error);
    // If we can't tell, assume it's not encrypted
    return false;
  }
};
