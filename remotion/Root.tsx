import { Composition, Folder } from "remotion";
import { Demo, DEMO_DURATION } from "./Demo";
import { Promo, PROMO_DURATION } from "./Promo";
import { FPS, HEIGHT, WIDTH } from "./theme";

export function RemotionRoot() {
  return (
    <Folder name="Declare">
      <Composition id="Promo" component={Promo} durationInFrames={PROMO_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="Demo" component={Demo} durationInFrames={DEMO_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    </Folder>
  );
}
