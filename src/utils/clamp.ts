/** Clamp number between min and max
 * @param min: the minimum value
 * @param value: the value to clamp
 * @param max: the maximum value
 */
export const clamp = (min: number, value: number, max: number): number => Math.min(max, Math.max(min, value));
