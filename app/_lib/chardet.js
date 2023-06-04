import { detect } from "./bemuse-chardet/bemuse-chardet";

export const detectEncoding = async (file) => {
    let arr = await file.arrayBuffer();
    return detect(Buffer.from(arr))
};