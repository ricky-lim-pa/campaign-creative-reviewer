import { withBasePath } from "@/lib/publicPath";

const HOME_HERO_SIZES = [
  { width: 1200, height: 394, src: "/placements/cards-uk/home-hero-1200x394.jpg" },
  { width: 2048, height: 518, src: "/placements/cards-uk/home-hero-2048x518.jpg" },
  { width: 1200, height: 606, src: "/placements/cards-uk/home-hero-1200x606.jpg" },
  { width: 2048, height: 614, src: "/placements/cards-uk/home-hero-2048x614.jpg" },
];

export function HomeHeroSizes() {
  return (
    <section className="hub-section--tight pb-0">
      <div className="hub-container">
        <h2 className="text-lg font-semibold tracking-humaan-tight text-hub-ink">Home Hero</h2>
        <p className="mt-1 text-sm text-hub-muted">Four sizes for FreePrints Cards.</p>
        <div className="mt-4 flex flex-col gap-4">
          {HOME_HERO_SIZES.map((size) => (
            <figure key={size.src} className="hub-card-bordered">
              <figcaption className="mb-3 text-sm font-medium text-hub-ink">
                {size.width} × {size.height}
              </figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={withBasePath(size.src)}
                alt={`FreePrints Cards Home Hero, ${size.width} by ${size.height}`}
                className="w-full rounded-lg"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
