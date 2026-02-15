export function hasMissingFields(obj: { [key: string]: unknown }): boolean {
    return Object.values(obj).some(value => !value);
}

export function getIncompleteFields(obj: { [key: string]: unknown }): string[] {
    return Object.entries(obj).filter(([, value]) => !value).map(([key]) => key);
}

/**
 * Converts a given UTC Date to a local date-time by adjusting for the timezone offset.
 *
 * @param date - The `Date` object to be converted to local date-time.
 * @returns A new `Date` object representing the local date-time.
 */
export function utcToLocalDateTime(date: Date): Date {
    const timeOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - timeOffset);
}

/**
 * Converts a given local Date to UTC date-time by adjusting for the timezone offset.
 *
 * @param date - The `Date` object to be converted to UTC date-time.
 * @returns A new `Date` object representing the UTC date-time.
 */
export function localToUtcDatetime(date: Date): Date {
    const timeOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + timeOffset);
}

export function getDateString(date: Date): string {
    return date.toISOString().split('T')[0].split('-').join('-');
}

export function getTimeString(date: Date, options: { seconds?: boolean } = { seconds: false }): string {
    const timeString = date.toISOString().split('T')[1].split('.')[0];
    const [hours, minutes, seconds] = timeString.split(':');

    const formattedTime = `${hours}:${minutes}`;

    if (options.seconds) {
        return `${formattedTime}:${seconds}`;
    }

    return formattedTime;
}

export function getDateTimeString(date: Date): string {
    return `${getDateString(date)} ${getTimeString(date)}`;
}

export async function compressImage(file: File, targetSizeMB = 1) {
    // check for "document" to avoid SSR error
    if (typeof document === "undefined") return file;

    if (file.size <= targetSizeMB * 1024 * 1024) return file;

    // Compress image
    const compressed = await new Promise<File>((resolve, reject) => {
        const quality = 0.7;
        const canvas = document.createElement("canvas");
        const img = document.createElement("img");
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
        img.onload = () => {
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            canvas.width = img.width * ((quality + 1) / 2);
            canvas.height = img.height * ((quality + 1) / 2);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                if (!blob) return reject("Error al comprimir la imagen");
                const compressed = new File([blob], file.name, { type: file.type });
                resolve(compressed);
            }, file.type, quality);
        };
    });

    console.log(`Image compressed from ${file.size / 1024 / 1024}MB to ${compressed.size / 1024 / 1024}MB`);

    if (compressed.size <= targetSizeMB * 1024 * 1024) return compressed;

    return await compressImage(compressed, targetSizeMB);
}

export function stringToHex(str: string): string {
    return Buffer.from(str, 'utf8').toString('hex');
}
export function hexToString(hex: string): string {
    return Buffer.from(hex, 'hex').toString('utf8');
}