import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import favicons from "favicons";

// Handle __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const source = path.join(__dirname, "src", "assets", "logo.png");
const outputPath = path.join(__dirname, "public", "icons");

const configuration = {
  path: "/icons/",
  appName: "Fastm8",
  appDescription:
    "FastM8 is a simple and easy to use fasting app that helps you track your fasting and eating windows.",
  developerName: "Matt",
  icons: {
    android: true,
    appleIcon: true,
    favicons: true,
    windows: true,
    yandex: false,
  },
};

favicons(source, configuration)
  .then((response) => {
    // Ensure the output directory exists
    fs.mkdir(outputPath, { recursive: true });

    // Write image files
    response.images.forEach((image) =>
      fs.writeFile(path.join(outputPath, image.name), image.contents)
    );
    // Write other files like manifest
    response.files.forEach((file) =>
      fs.writeFile(path.join(outputPath, file.name), file.contents)
    );

    // Print out the HTML tags
    console.log(response.html.join("\n"));
  })
  .catch(console.error);
