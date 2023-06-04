export const isAscii = (str) => {
    return /^[\x00-\x7F]*$/.test(str);
}