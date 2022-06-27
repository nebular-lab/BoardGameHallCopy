import { canPutStoneOneSquare, FieldInfo, reverseStones } from './reversi';

const fieldInfo: FieldInfo = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, -1, 1, 0, 0, 0],
  [0, 0, 1, 1, -1, 1, 1, 0],
  [0, 0, -1, 1, -1, -1, 0, 0],
  [0, 0, 0, 0, 1, -1, -1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

describe('reversi', () => {
  test('canPutStone', () => {
    // 周囲に石がない場合は []
    expect(canPutStoneOneSquare(0, 0, 'black', fieldInfo)).toHaveLength(0);
    expect(canPutStoneOneSquare(6, 1, 'white', fieldInfo)).toHaveLength(0);
    // すでに石が置いてある場所は[]
    expect(canPutStoneOneSquare(3, 2, 'black', fieldInfo)).toHaveLength(0);
    expect(canPutStoneOneSquare(4, 5, 'white', fieldInfo)).toHaveLength(0);

    // fieldInfoの石に接している箇所を適当に確認(本当は黒の手版だけど複数用意するのが大変だから白も同じ盤面で確認)
    expect(canPutStoneOneSquare(2, 2, 'black', fieldInfo).length).toBeGreaterThan(0);
    expect(canPutStoneOneSquare(2, 2, 'white', fieldInfo).length).toBeGreaterThan(0);
    expect(canPutStoneOneSquare(1, 2, 'black', fieldInfo)).toHaveLength(0);
    expect(canPutStoneOneSquare(1, 2, 'white', fieldInfo)).toHaveLength(0);
    expect(canPutStoneOneSquare(6, 6, 'black', fieldInfo).length).toBeGreaterThan(0);
    expect(canPutStoneOneSquare(6, 6, 'white', fieldInfo)).toHaveLength(0);
    expect(canPutStoneOneSquare(3, 1, 'black', fieldInfo)).toHaveLength(0);
    expect(canPutStoneOneSquare(3, 1, 'white', fieldInfo).length).toBeGreaterThan(0);
  });

  // canPutStoneが [] ではないことが前提
  test('reverseStones', () => {
    let canPutDirs = canPutStoneOneSquare(2, 2, 'black', fieldInfo);
    expect(reverseStones(canPutDirs, fieldInfo, 2, 2, 'black')).toEqual([
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, -1, 1, 1, 0],
      [0, 0, -1, 1, -1, -1, 0, 0],
      [0, 0, 0, 0, 1, -1, -1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ]);
    canPutDirs = canPutStoneOneSquare(2, 2, 'white', fieldInfo);
    expect(reverseStones(canPutDirs, fieldInfo, 2, 2, 'white')).toEqual([
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, -1, -1, 1, 0, 0, 0],
      [0, 0, -1, -1, -1, 1, 1, 0],
      [0, 0, -1, 1, -1, -1, 0, 0],
      [0, 0, 0, 0, 1, -1, -1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ]);
    canPutDirs = canPutStoneOneSquare(6, 6, 'black', fieldInfo);
    expect(reverseStones(canPutDirs, fieldInfo, 6, 6, 'black')).toEqual([
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, -1, 1, 0, 0, 0],
      [0, 0, 1, 1, -1, 1, 1, 0],
      [0, 0, -1, 1, 1, -1, 0, 0],
      [0, 0, 0, 0, 1, 1, -1, 0],
      [0, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ]);
    canPutDirs = canPutStoneOneSquare(3, 1, 'white', fieldInfo);
    expect(reverseStones(canPutDirs, fieldInfo, 3, 1, 'white')).toEqual([
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, -1, 1, 0, 0, 0],
      [0, -1, -1, -1, -1, 1, 1, 0],
      [0, 0, -1, 1, -1, -1, 0, 0],
      [0, 0, 0, 0, 1, -1, -1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ]);
  });
});
