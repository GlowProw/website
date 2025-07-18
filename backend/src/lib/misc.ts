"use strict";
import crypto from "crypto";
import {pipeline as _pipeline, Readable} from "stream";
import {promisify} from "util";
import config from "../../config";

const crypt_algo = 'aes256';

type ErrorHelperOptions = {
    time?: Date;
};

/**
 * Generate error helper with optional verbose output
 * @param err Error object
 * @param options Optional settings including time
 */
function generateErrorHelper(err: Error, options?: ErrorHelperOptions): string;
function generateErrorHelper(err: Error, time?: Date): string;
function generateErrorHelper(err: any, timeOrOptions?: Date | ErrorHelperOptions): string {
    const time = timeOrOptions instanceof Date
        ? timeOrOptions
        : timeOrOptions?.time ?? new Date();

    switch (config.errorHelperVerbose) {
        case true:
            return JSON.stringify({
                time: new Date(time).toString(),
                message: err.message,
                stack: err.stack
            }, undefined, 2);
        default: {
            const msg = Buffer.from(`${time.toUTCString()} ${err.message.slice(0, 32)}`);
            for (let i = 0; i < msg.length; ++i) {
                msg.writeUInt8(msg[i] ^ ((69 + i) % 0xFF), i);
            }
            return msg.toString('base64');
        }
    }
}

/**
 * Encrypt content with AES-256
 * @param content Content to encrypt (string or Buffer)
 * @param key Encryption key (string or Buffer)
 */
function encrypt(content: string | Buffer, key: string | Buffer): Buffer {
    content = Buffer.concat([Buffer.alloc(16), Buffer.from(content)]);
    key = Buffer.concat([Buffer.from(key), Buffer.alloc(32, 0)]).slice(0, 32); // aes256 requires 32bytes long key
    const cipher = crypto.createCipheriv(crypt_algo, key, crypto.randomBytes(16));
    let crypted = cipher.update(content);
    crypted = Buffer.concat([crypted, cipher.final()]);
    return crypted;
}

/**
 * Decrypt content with AES-256
 * @param content Content to decrypt (string or Buffer)
 * @param key Decryption key (string or Buffer)
 */
function decrypt(content: string | Buffer, key: string | Buffer): Buffer {
    try {
        content = Buffer.from(content);
        key = Buffer.concat([Buffer.from(key), Buffer.alloc(32, 0)]).slice(0, 32);
        const decipher = crypto.createDecipheriv(crypt_algo, key, content.slice(0, 16));
        let decrypted = decipher.update(content.slice(16));
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted;
    } catch (err) { // bad content
        return Buffer.alloc(0);
    }
}

/**
 * Generate random string
 * @param length Length of the string to generate
 * @param fromChars Characters to choose from
 */
function generateRandomString(
    length: number = 0,
    fromChars: string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
): string {
    let str = '';
    for (let i = 0; i < length; i++) {
        str += fromChars[crypto.randomInt(fromChars.length)];
    }
    return str;
}

/**
 * Validate filename
 * @param filename Filename to validate
 */
function validateFileName(filename: string = ''): boolean {
    const illegalRe = /[/?<>\\:*|"]/g;
    // eslint-disable-next-line no-control-regex
    const controlRe = /[\x00-\x1f\x80-\x9f]/g;
    const reservedRe = /^\.+$/;
    const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
    const windowsTrailingRe = /[. ]+$/;
    return !(illegalRe.test(filename) ||
        controlRe.test(filename) ||
        reservedRe.test(filename) ||
        windowsTrailingRe.test(filename) ||
        windowsReservedRe.test(filename));
}

/**
 * Validate path
 * @param path Path to validate
 */
function validatePath(path: string = ''): boolean {
    const santinized = '/' + path.split('/').filter(i => i && validateFileName(i)).join('/');
    return santinized === path;
}

/**
 * Get file suffix by MIME type
 * @param mimeType MIME type to check
 */
function fileSuffixByMIMEType(mimeType: string): string {
    switch (mimeType) {
        case 'image/gif':
            return '.gif';
        case 'image/jpeg':
            return '.jpg';
        case 'image/png':
            return '.png';
        case 'image/webp':
            return '.webp';
        case 'video/webm':
            return '.webm';
        case 'video/ogg':
            return '.ogg';
        case 'video/mp4':
            return '.mp4';
        case 'application/x-zip-compressed':
            return '.zip';
        case 'application/zip':
            return '.zip';
        default:
            return '';
    }
}

/**
 * Read stream till end and collect data
 * @param stream Readable stream
 */
function readStreamTillEnd(stream: Readable): Promise<Buffer> {
    let content = Buffer.alloc(0);
    return new Promise((resolve, reject) => {
        stream.on('data', chunk => {
            content = Buffer.concat([content, chunk ? chunk : Buffer.alloc(0)]);
        });
        stream.on('end', chunk => {
            resolve(Buffer.concat([content, chunk ? chunk : Buffer.alloc(0)]));
        });
        stream.on('error', err => reject(err));
    });
}

const pipeline: typeof _pipeline = promisify(_pipeline);

export {
    generateErrorHelper,
    encrypt,
    decrypt,
    generateRandomString,
    validateFileName,
    validatePath,
    fileSuffixByMIMEType,
    readStreamTillEnd,
    pipeline,
};
