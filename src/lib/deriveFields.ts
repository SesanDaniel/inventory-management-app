export interface DerivedFields {
  itemCode: string;
  itemType: string;
  size: string;
  colourCode: string;
  colourName: string;
}

export function deriveFieldsFromPartNumber(
  partNumber: string,
  colorMap: Record<string, string>
): DerivedFields | null {
  const p = partNumber.trim();
  if (p.length < 12) return null;

  const itemCode = p.substring(0, 5);     // LEFT(partNumber,5)
  const itemType = p.substring(5, 6);     // MID(partNumber,6,1)
  const size = p.substring(6, 9);         // MID(partNumber,7,3)
  const colourCode = p.substring(9, 12);  // MID(partNumber,10,3)
  const colourName = colorMap[colourCode.trim().toUpperCase()] || '';

  return { itemCode, itemType, size, colourCode, colourName };
}
