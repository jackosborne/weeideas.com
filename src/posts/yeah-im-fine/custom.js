const canvas = document.getElementById('art');
const context = canvas.getContext('2d');
canvas.width = canvas.height = 1600;

function render(values) {
  const radius = 292;
  const font = `600 ${values.typeSize}px "Helvetica Neue", Arial, sans-serif`;
  context.setTransform(2, 0, 0, 2, 0, 0);
  context.fillStyle = '#fff';
  context.fillRect(0, 0, 800, 800);
  context.fillStyle = '#111';
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  context.font = font;
  context.fontKerning = 'normal';
  const capMetrics = context.measureText('H');
  const baselineOffset =
    (capMetrics.actualBoundingBoxAscent - capMetrics.actualBoundingBoxDescent) / 2;
  const tracking = values.typeSize * -0.012;
  let width = 0;
  let prefix = '';
  let measuredPrefix = 0;
  const letters = [...'YEAH, I’M FINE.'].map((character) => {
    prefix += character;
    const measured = context.measureText(prefix).width;
    const glyphWidth = context.measureText(character).width;
    const advance = measured - measuredPrefix;
    const letter = { character, position: width + advance - glyphWidth / 2 };
    width += advance + tracking;
    measuredPrefix = measured;
    return letter;
  });
  const phraseWidth = width - tracking;
  const repeatLength = phraseWidth + values.spacing;
  const extent = Math.PI * 2 * values.turns;
  const openingAngle = -phraseWidth / (2 * radius) - Math.atan(values.compression / extent);
  const rotation = (values.rotation * Math.PI) / 180;

  // One uninterrupted spiral: r(t) = R(1 - t)^compression. Its radial pitch
  // decreases smoothly on every turn. The type stays substantial, so adjacent
  // turns eventually collide and produce the inner crosshatching themselves.
  const points = [];
  let length = 0;
  for (let index = 0; index < 8192; index++) {
    const progress = index / 8192;
    const remaining = 1 - progress;
    const localRadius = radius * Math.pow(remaining, values.compression);
    const angle = extent * progress - Math.PI / 2 + openingAngle + rotation;
    const scale = 0.74 + (0.26 * localRadius) / radius;
    const point = {
      x: 400 + Math.cos(angle) * localRadius,
      y: 400 + Math.sin(angle) * localRadius,
      scale,
      // The same compression also contracts phrase advances near the centre.
      spacingScale: scale / (1 + 15 * (values.compression - 1) * Math.pow(progress, 4)),
      tangent:
        angle +
        Math.atan2(
          localRadius,
          (-radius * values.compression * Math.pow(remaining, values.compression - 1)) / extent,
        ),
    };
    if (points.length) {
      const previous = points.at(-1);
      length +=
        Math.hypot(point.x - previous.x, point.y - previous.y) /
        ((point.spacingScale + previous.spacingScale) / 2);
    }
    points.push({ ...point, distance: length });
  }
  let pointIndex = 1;
  for (let start = 0; start < length; start += repeatLength) {
    for (const letter of letters) {
      const distance = start + letter.position;
      if (distance >= length) break;
      while (pointIndex < points.length - 1 && points[pointIndex].distance < distance) pointIndex++;
      const previous = points[pointIndex - 1];
      const next = points[pointIndex];
      const blend = (distance - previous.distance) / (next.distance - previous.distance);
      const interpolate = (key) => previous[key] + (next[key] - previous[key]) * blend;
      const scale = interpolate('scale');
      context.save();
      context.translate(interpolate('x'), interpolate('y'));
      context.rotate(interpolate('tangent'));
      context.scale(scale, scale);
      context.fillText(letter.character, 0, baselineOffset);
      context.restore();
    }
  }
}
// Definitive composition; edit these authoring values to refine the piece.
render({
  turns: 16,
  compression: 2.2,
  typeSize: 32,
  spacing: 12,
  rotation: 0,
});

// Reveal the canvas only after a successful render; retain the image if scripting fails.
document.getElementById('art').hidden = false;
document.querySelector('.artwork-fallback').hidden = true;
