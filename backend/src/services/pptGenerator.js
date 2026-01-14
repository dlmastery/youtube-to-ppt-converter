import pptxgen from 'pptxgenjs';
import path from 'path';

/**
 * Generate PowerPoint presentation from slides
 */
export async function generatePowerPoint(slides, outputPath) {
  console.log(`Generating PowerPoint with ${slides.length} slides`);

  const pptx = new pptxgen();

  // Set presentation properties
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'YouTube to PPT Converter';
  pptx.title = 'Extracted Presentation';

  if (slides.length === 0) {
    // Create a slide with a warning message
    const slide = pptx.addSlide();
    slide.addText('No slides detected in the video', {
      x: 1,
      y: 2,
      w: 8,
      h: 1,
      fontSize: 32,
      color: '363636',
      align: 'center'
    });
    slide.addText('The AI analysis did not identify any presentation slides in this video.', {
      x: 1,
      y: 3.5,
      w: 8,
      h: 0.5,
      fontSize: 18,
      color: '666666',
      align: 'center'
    });
  } else {
    // Add each slide with image and speaker notes
    for (const slideData of slides) {
      const slide = pptx.addSlide();

      // Add image
      slide.addImage({
        path: slideData.path,
        x: 0,
        y: 0,
        w: '100%',
        h: '100%',
        sizing: { type: 'contain', w: '100%', h: '100%' }
      });

      // Add speaker notes
      if (slideData.speakerNotes) {
        slide.addNotes(slideData.speakerNotes);
      }
    }
  }

  // Save presentation
  await pptx.writeFile({ fileName: outputPath });
  console.log(`PowerPoint saved to ${outputPath}`);

  return outputPath;
}
