const supplierUdhari = useMemo(() => {
  const purchases =
    getArray("purchases");

  const supplierMap = {};

  purchases.forEach((purchase) => {
    const supplier = String(
      purchase.supplier ||
        purchase.supplierName ||
        purchase.company ||
        ""
    ).trim();

    if (!supplier) {
      return;
    }

    const key =
      supplier.toLowerCase();

    if (!supplierMap[key]) {
      supplierMap[key] = supplier;
    }
  });

  return Object.values(
    supplierMap
  ).reduce(
    (total, supplier) =>
      total +
      getSupplierBalance(
        supplier
      ).pending,
    0
  );
}, [
  purchases,
  supplierPayments,
]);