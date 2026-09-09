function Profit({ stock, goBack }) {
  const sales =
    JSON.parse(
      localStorage.getItem("sales")
    ) || [];

  // =========================
  // ACTUAL SALE PROFIT
  // =========================

  const totalProfit = sales.reduce(
    (sum, sale) =>
      sum + Number(sale.profit || 0),
    0
  );

  // =========================
  // TOTAL SALE
  // =========================

  const totalSale = sales.reduce(
    (sum, sale) =>
      sum +
      Number(sale.saleAmount || 0),
    0
  );

  // =========================
  // TOTAL PURCHASE COST OF SOLD ITEMS
  // =========================

  const totalPurchaseCost =
    sales.reduce(
      (sum, sale) =>
        sum +
        Number(
          sale.purchaseAmount || 0
        ),
      0
    );

  // =========================
  // CURRENT STOCK ESTIMATED PROFIT
  // =========================

  const estimatedStockProfit =
    stock.reduce(
      (sum, item) => {
        const purchaseRate =
          Number(item.rate || 0);

        const saleRate =
          Number(
            item.saleRate ||
              item.mrp ||
              0
          );

        const quantity =
          Number(item.quantity || 0);

        return (
          sum +
          (saleRate - purchaseRate) *
            quantity
        );
      },
      0
    );

  return (
    <div
      style={{
        padding: "20px",
      }}
    >
      <h2>
        💰 Profit Report
      </h2>

      <button onClick={goBack}>
        ⬅️ Back
      </button>

      <hr />

      <h3>
        💵 Total Sale
      </h3>

      <h2>
        ₹{totalSale.toFixed(2)}
      </h2>

      <h3>
        🛒 Sold Items Purchase Cost
      </h3>

      <h2>
        ₹
        {totalPurchaseCost.toFixed(
          2
        )}
      </h2>

      <h3>
        📈 Actual Profit
      </h3>

      <h1
        style={{
          color: "green",
        }}
      >
        ₹{totalProfit.toFixed(2)}
      </h1>

      <hr />

      <h3>
        📦 Current Stock Estimated Profit
      </h3>

      <h2
        style={{
          color: "blue",
        }}
      >
        ₹
        {estimatedStockProfit.toFixed(
          2
        )}
      </h2>

      <hr />

      <h3>
        📌 समझें
      </h3>

      <p>
        <b>Actual Profit</b> = अब तक
        बिके हुए सामान का वास्तविक
        profit
      </p>

      <p>
        <b>Stock Estimated Profit</b> =
        अभी stock में बचे सामान को
        Sale Rate पर बेचने पर संभावित
        profit
      </p>
    </div>
  );
}

export default Profit;