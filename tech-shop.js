import dataMartRows from './monster_data_mart_rows.json';
import { HARD_DAY_PERIOD } from './game-day.js';

// The online shop of the third day. Its goods are data mart rows of their own object type, so the
// food shop keeps its shelf and this one keeps its catalogue.
export const TECH_STORE_ITEM_TYPE = 'Item from the technique store';

// The data mart holds what the seller says: picture, ad copy, price, crossed-out old price. What a
// device actually does in the game has no column of its own, so it lives here, keyed by the id of
// its data mart row — the same way SUITABLE_FOOD_IDS keys the food rules by id.
//   device.cleanings — how many cleanings the box itself covers (Козилетт ships with one cartridge)
//   device.refillId  — the refill the device eats, when it lives on consumables
//   refill.cartridges — how many single cartridges the package holds
export const CLEANER_SPECS = {
  75: { kind: 'device', cleanings: 1, refillId: 78 },
  76: { kind: 'device', cleanings: 20 },
  77: { kind: 'device', cleanings: 20 },
  78: { kind: 'refill', deviceId: 75, cartridges: 1 },
  79: { kind: 'refill', deviceId: 75, cartridges: 3 },
};

// A single cartridge is the unit the stock is counted in, so a three-pack lands in the inventory as
// three of row 78 — just as food is stocked in grams rather than in packs.
export const CARTRIDGE_ITEM_ID = 78;

// The one purchase that survives the arithmetic: same resource as the iКовырялка for half the price,
// and nothing to buy on top of it.
export const RIGHT_CLEANER_ID = 76;

export function techStoreItems(rows = dataMartRows) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row?.object_type === TECH_STORE_ITEM_TYPE)
    .sort((left, right) => Number(left.id) - Number(right.id));
}

export function itemSpec(item) {
  return CLEANER_SPECS[item?.id] ?? null;
}

export function isCleanerDevice(item) {
  return itemSpec(item)?.kind === 'device';
}

export function isCleanerRefill(item) {
  return itemSpec(item)?.kind === 'refill';
}

export function cleanerDevices(items) {
  return items.filter(isCleanerDevice);
}

export function cleanerRefills(items) {
  return items.filter(isCleanerRefill);
}

const price = (item) => Number(item?.price) || 0;

// Cleanings happen on every hard day, so by the end of day N the monster has been dirty
// day/HARD_DAY_PERIOD times: 1 by day 3, 2 by day 6, 3 by day 9.
export function cleaningsByDay(day) {
  return Math.max(0, Math.floor(day / HARD_DAY_PERIOD));
}

// The cheapest way to buy `cartridges` single cartridges out of the packages on sale. Buying a
// three-pack for a single cartridge counts too, when the pack happens to be cheaper.
export function refillCost(refills, cartridges) {
  if (cartridges <= 0) return 0;
  const packages = refills
    .map((item) => ({ cartridges: Number(itemSpec(item)?.cartridges) || 0, price: price(item) }))
    .filter((option) => option.cartridges > 0);
  if (!packages.length) return Infinity;

  const best = new Array(cartridges + 1).fill(Infinity);
  best[0] = 0;
  for (let need = 1; need <= cartridges; need += 1) {
    for (const option of packages) {
      const rest = Math.max(0, need - option.cartridges);
      if (best[rest] !== Infinity) best[need] = Math.min(best[need], best[rest] + option.price);
    }
  }
  return best[cartridges];
}

// What the device costs in total by the time it has done `cleanings` cleanings: its own price plus
// every refill it will have eaten. null when the device cannot reach that many cleanings at all.
export function ownershipCost(device, refills, cleanings) {
  const spec = itemSpec(device);
  if (spec?.kind !== 'device') return null;
  if (cleanings <= spec.cleanings) return price(device);
  if (!spec.refillId) return null;
  const extra = refillCost(refills, cleanings - spec.cleanings);
  return Number.isFinite(extra) ? price(device) + extra : null;
}

// What one cleaning costs with this device, as a range: a device without consumables spreads its
// price over its resource, a device with consumables costs whatever its cheapest refill costs.
export function cleaningPriceRange(device, refills) {
  const spec = itemSpec(device);
  if (spec?.kind !== 'device') return null;
  if (!spec.refillId) {
    const each = price(device) / Math.max(1, spec.cleanings);
    return [each, each];
  }
  const each = refills
    .filter((item) => itemSpec(item)?.deviceId === device.id)
    .map((item) => price(item) / Math.max(1, Number(itemSpec(item)?.cartridges) || 1));
  return each.length ? [Math.min(...each), Math.max(...each)] : null;
}

// Everything the comparison table shows about one device, already counted.
export function deviceFacts(device, refills, horizons) {
  const spec = itemSpec(device);
  const refill = refills.find((item) => item.id === spec?.refillId) ?? null;
  return {
    item: device,
    price: price(device),
    oldPrice: Number(device?.old_price) || null,
    cleanings: spec?.cleanings ?? 0,
    refill,
    refillPrice: refill ? price(refill) : null,
    cleaningPrice: cleaningPriceRange(device, refills),
    totals: horizons.map((day) => {
      const cleanings = cleaningsByDay(day);
      return { day, cleanings, cost: ownershipCost(device, refills, cleanings) };
    }),
  };
}

// The device the player already owns, if any: the inventory counts it in pieces by its data mart id.
export function ownedDevice(inventory, items) {
  return cleanerDevices(items).find((item) => (inventory?.get(item.id) ?? 0) > 0) ?? null;
}

// What is left of a device's resource once it has done `used` cleanings. Several pieces of one
// device share the count, and a device on consumables goes on as long as cartridges are in stock.
export function cleaningsLeft(device, used, { pieces = 1, cartridges = 0 } = {}) {
  const spec = itemSpec(device);
  if (spec?.kind !== 'device') return 0;
  const own = Math.max(0, spec.cleanings * Math.max(1, pieces) - used);
  return spec.refillId ? own + Math.max(0, cartridges) : own;
}

// Whether the next cleaning with this device eats a cartridge: its own ones are used up.
export function cleaningUsesCartridge(device, used, pieces = 1) {
  const spec = itemSpec(device);
  return Boolean(spec?.refillId) && used >= spec.cleanings * Math.max(1, pieces);
}

// The device the next cleaning is done with. Pieces at the service centre are left out; a device
// that needs nothing more to work goes before one on cartridges, so a spare Козилетт waits for
// the day the main device breaks. `usedOf(device)` counts the cleanings a device has done.
// Returns { device, left, pieces } for the pick, or { device: null, repairUntil } when every
// owned device is away, or null when the player owns none.
export function cleaningDevice(state, items, usedOf) {
  const owned = cleanerDevices(items).filter((item) => (state.inventory?.get(item.id) ?? 0) > 0);
  if (!owned.length) return null;
  const cartridges = ownedCartridges(state.inventory);
  const candidates = owned
    .map((device) => {
      const pieces = (state.inventory.get(device.id) ?? 0) - (state.devicesInRepair?.get(device.id)?.count ?? 0);
      return { device, pieces, left: cleaningsLeft(device, usedOf(device), { pieces: state.inventory.get(device.id), cartridges }) };
    })
    .filter((option) => option.pieces > 0);
  if (!candidates.length) {
    const until = Math.min(...owned.map((device) => state.devicesInRepair?.get(device.id)?.until ?? Infinity));
    return { device: null, left: 0, pieces: 0, repairUntil: Number.isFinite(until) ? until : null };
  }
  const order = (option) => (option.left > 0 ? 0 : 2) + (itemSpec(option.device)?.refillId ? 1 : 0);
  return candidates.sort((left, right) => order(left) - order(right))[0];
}

export function ownedCartridges(inventory) {
  return Math.max(0, inventory?.get(CARTRIDGE_ITEM_ID) ?? 0);
}

// What a purchase adds to the stock: a device is counted by its own row, any refill package is
// counted in single cartridges, so one three-pack becomes three.
export function inventoryChange(item, quantity) {
  const spec = itemSpec(item);
  if (spec?.kind === 'refill') {
    return { id: CARTRIDGE_ITEM_ID, amount: (Number(spec.cartridges) || 1) * quantity };
  }
  return { id: item.id, amount: quantity };
}
