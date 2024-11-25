export const deepFind = <T extends Record<PropertyKey, any>>(
  originArr: T[],
  callback: (item: T, parent?: T | null) => boolean,
  {
    childrenKey = "children",
    structure = false,
  }: { childrenKey?: keyof T; structure?: boolean } = {}
) => {
  if (!Array.isArray(originArr)) {
    throw new Error("请传入数组");
  }

  let result: T | undefined | null;
  const core = (arr: T[], parent?: T | undefined | null) => {
    for (const item of arr) {
      if (result) return;
      const condition = callback(item, parent);
      structure && ((item as any).parent = parent);
      if (condition) {
        result = item;
        return;
      }
      item[childrenKey] && core(item[childrenKey], item);
    }
  };
  core(originArr, null);

  return result;
};
