import { mkdir } from "node:fs/promises";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const svgPath = resolve("../logos/svg/mtumods.svg");
const outputDir = resolve("../logos/generated");
const faviconDir = resolve("../favicons/generated");

const svg = await readFile(svgPath);

const background = "#faf5fa";

const padding = 0.1; // 10% padding on each side

type LogoSize = {
    name: string;
    width: number;
    height: number;
};

function resizeWithPadding(
    width: number,
    height: number,
    paddingBackground?: string,
) {
    const innerWidth = Math.round(width * (1 - padding * 2));
    const innerHeight = Math.round(height * (1 - padding * 2));

    const paddingX = Math.floor((width - innerWidth) / 2);
    const paddingY = Math.floor((height - innerHeight) / 2);

    return sharp(svg)
        .resize(innerWidth, innerHeight, {
            fit: "contain",
        })
        .extend({
            top: paddingY,
            bottom: height - innerHeight - paddingY,
            left: paddingX,
            right: width - innerWidth - paddingX,
            background: paddingBackground
                ? paddingBackground
                : { r: 0, g: 0, b: 0, alpha: 0 },
        });
}

// Common/general-purpose sizes and popular social platforms
const sizes: LogoSize[] = [
    // General
    { name: "master", width: 1024, height: 1024 },
    { name: "large", width: 512, height: 512 },
    { name: "medium", width: 256, height: 256 },
    { name: "small", width: 128, height: 128 },
    { name: "tiny", width: 64, height: 64 },

    // Social platforms
    { name: "facebook", width: 320, height: 320 },
    { name: "instagram", width: 320, height: 320 },
    { name: "linkedin", width: 400, height: 400 },
    { name: "x", width: 400, height: 400 },
    { name: "github", width: 500, height: 500 },
    { name: "youtube", width: 800, height: 800 },
    { name: "tiktok", width: 400, height: 400 },
    { name: "threads", width: 320, height: 320 },
];

// Make sure output directory exists
await mkdir(outputDir, { recursive: true });
await mkdir(faviconDir, { recursive: true });

// ============================================================
// LOGO ASSETS
// ============================================================

for (const { name, width, height } of sizes) {

    //  Transparent PNG without padding
    await sharp(svg)
    .resize(width, height, {
        fit: "contain",
    })
    .png()
    .toFile(
        resolve(
            outputDir,
            `${name}-${width}x${height}-transparent.png`,
        ),
    );

    // Transparent PNG with padding
    await resizeWithPadding(width, height)
        .png()
        .toFile(
            resolve(
                outputDir,
                `${name}-${width}x${height}-transparent-padded.png`,
            ),
        );

    // Solid PNG
    await resizeWithPadding(width, height, background)
        .flatten({ background })
        .png()
        .toFile(
            resolve(
                outputDir,
                `${name}-${width}x${height}-solid.png`,
            ),
        );

    // Solid JPG
    await resizeWithPadding(width, height, background)
        .flatten({ background })
        .jpeg({
            quality: 92,
        })
        .toFile(
            resolve(
                outputDir,
                `${name}-${width}x${height}.jpg`,
            ),
        );

    console.log(`✓ ${name} (${width}x${height})`);
}

// ============================================================
// FAVICONS
// ============================================================

const faviconSizes = [16, 32, 48, 64, 96, 180, 192, 512];

// Generate PNG favicons
for (const size of faviconSizes) {
    await resizeWithPadding(size, size)
        .png()
        .toFile(
            resolve(faviconDir, `favicon-${size}x${size}.png`),
        );

    console.log(`✓ favicon-${size}x${size}.png`);
}

// Generate Apple Touch Icon
await resizeWithPadding(180, 180, background)
    .flatten({ background })
    .png()
    .toFile(
        resolve(faviconDir, "apple-touch-icon.png"),
    );

// Generate favicon.ico from 16, 32 and 48px PNGs
const ico = await pngToIco([
    resolve(faviconDir, "favicon-16x16.png"),
    resolve(faviconDir, "favicon-32x32.png"),
    resolve(faviconDir, "favicon-48x48.png"),
]);

await writeFile(
    resolve(faviconDir, "favicon.ico"),
    ico,
);

// Generate favicon.svg
await writeFile(
    resolve(faviconDir, "favicon.svg"),
    svg,
);

console.log("\nDone! Generated logo assets.");
