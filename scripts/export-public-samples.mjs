import fs from 'fs';
import {
  createPhotoshopJpegFixture,
  createStableDiffusionPngFixture,
  createComfyUiPngFixture,
} from './dist-fixtures.mjs';

const jpeg = createPhotoshopJpegFixture();
fs.writeFileSync('public/samples/photoshop-leica-gps.jpg', Buffer.from(jpeg));
console.log('Saved public/samples/photoshop-leica-gps.jpg');

const sd = createStableDiffusionPngFixture();
fs.writeFileSync('public/samples/stablediffusion-prompt.png', Buffer.from(sd));
console.log('Saved public/samples/stablediffusion-prompt.png');

const comfy = createComfyUiPngFixture();
fs.writeFileSync('public/samples/comfyui-graph.png', Buffer.from(comfy));
console.log('Saved public/samples/comfyui-graph.png');
