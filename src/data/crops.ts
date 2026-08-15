/**
 * Crop table.
 *
 * `raidValue` is the raid pressure a single *planted* crop adds to the farm.
 * `harvestAmount` is how many items one plant yields when harvested — it does
 * not affect raid pressure and is shown for reference only.
 *
 * Source: Official Scrap Mechanic Wiki — https://scrapmechanic.fandom.com/wiki/Farming
 */

export interface Crop {
  /** Stable id, also the asset filename under public/assets/crops. */
  readonly id: string;
  readonly name: string;
  readonly raidValue: number;
  readonly harvestAmount: number;
}

export const CROPS: readonly Crop[] = [
  { id: 'cotton', name: 'Cotton', raidValue: 0, harvestAmount: 1 },
  { id: 'pigmentflower', name: 'Pigment Flower', raidValue: 0, harvestAmount: 1 },
  { id: 'potato', name: 'Potato', raidValue: 1, harvestAmount: 10 },
  { id: 'tomato', name: 'Tomato', raidValue: 1, harvestAmount: 1 },
  { id: 'carrot', name: 'Carrot', raidValue: 2, harvestAmount: 1 },
  { id: 'redbeet', name: 'Redbeet', raidValue: 5, harvestAmount: 1 },
  { id: 'banana', name: 'Banana', raidValue: 15, harvestAmount: 1 },
  { id: 'chili', name: 'Chili', raidValue: 15, harvestAmount: 1 },
  { id: 'blueberry', name: 'Blueberry', raidValue: 50, harvestAmount: 1 },
  { id: 'orange', name: 'Orange', raidValue: 100, harvestAmount: 1 },
  { id: 'broccoli', name: 'Broccoli', raidValue: 500, harvestAmount: 1 },
  { id: 'pineapple', name: 'Pineapple', raidValue: 1000, harvestAmount: 1 },
] as const;

export const cropAssetUrl = (id: string): string =>
  `${import.meta.env.BASE_URL}assets/crops/${id}.webp`;

/** Largest quantity accepted per crop — keeps totals far inside safe integer range. */
export const MAX_CROP_QUANTITY = 999_999;

export type FarmQuantities = Readonly<Record<string, number>>;

export const EMPTY_FARM: FarmQuantities = Object.freeze(
  Object.fromEntries(CROPS.map((crop) => [crop.id, 0])),
);
