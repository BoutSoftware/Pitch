import wav from 'wav';

export async function pcmToWav(pcmData: Buffer, channels = 1, rate = 24000, sampleWidth = 2) {
    return new Promise<Buffer>((resolve, reject) => {
        const writer = new wav.Writer({
            channels,
            sampleRate: rate,
            bitDepth: sampleWidth * 8,
        });

        const chunks: Buffer[] = [];
        writer.on('data', (chunk) => chunks.push(chunk));
        writer.on('finish', () => resolve(Buffer.concat(chunks)));
        writer.on('error', reject);

        writer.write(pcmData);
        writer.end();
    });
}