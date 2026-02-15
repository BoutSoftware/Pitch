import { gcpBucket } from "@/configs/googleCloud";

export async function getSignedUrl(fileId: string, expiresInSeconds: number = 3600) {
    return (await gcpBucket.file(fileId).getSignedUrl({
        action: "read",
        expires: Date.now() + 1000 * expiresInSeconds,
    }))[0];
}


// File Name Convention
// Replace non-alphanumeric characters with underscores
// Add a - and UUID to the end of the file name
// Add the file extension to the end of the file name
// Example: file name "my file.txt" becomes "my_file_12345678-1234-1234-1234-123456789012.txt"
// The file name is treated as the file's id for any purpose (the actual id is unusable since its urlencoded)
// The FileId is the file name with the UUID added to it
// The FileName is the original file name without the UUID

export function getFileIdFromFileName(fileName: string, path: string) {
    const fileNameParts = fileName.split('.');
    const fileExtension = fileNameParts.pop()!;
    const normalizedFileName = fileNameParts.join(' ').replace(/[^a-zA-Z0-9]/g, '_');
    const uuid = crypto.randomUUID();
    return `${path}/${normalizedFileName}-${uuid}.${fileExtension}`;
}

export function getFileNameFromFileId(fileId: string) {
    const fileWithoutPath = fileId.split('/').pop()!;
    const [fileNameWithUuid, fileExtension] = fileWithoutPath.split('.');

    const fileName = fileNameWithUuid.split('-')[0];

    return `${fileName}.${fileExtension}`;
}