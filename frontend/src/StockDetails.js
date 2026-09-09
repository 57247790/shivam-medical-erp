function StockDetails({ stock, type, goBack }) {
  const today = new Date();

  const lowStock = stock.filter(
    (item) => Number(item.quantity || 0) <= 10
  );

  const expiryItems = stock.filter((item) => {
    if (!item.expiry) return false;

    const expiryDate = new Date(item.expiry);

    if (isNaN(expiryDate.getTime())) return false;

    const daysLeft = Math.ceil(
      (expiryDate.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return daysLeft <= 30;
  });

  const expiredItems = stock.filter((item) => {
    if (!item.expiry) return false;

    const expiryDate = new Date(item.expiry);

    if (isNaN(expiryDate.getTime())) return false;

    return expiryDate < today;
  });

  let data = stock;
  let title = "📦 Stock Details";

  if (type === "items") {
    title = "📦 Total Stock Items";
    data = stock;
  }

  if (type === "quantity") {
    title = "💊 Total Stock Quantity";
    data = stock;
  }

  if (type === "lowStock") {
    title = "⚠️ Low Stock";
    data = lowStock;
  }

  if (type === "expiry") {
    title = "📅 Expiry Stock";
    data = expiryItems;
  }

  if (type === "expired") {
    title = "🔴 Expired Medicines";
    data = expiredItems;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        background: "#f2f5f9",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <button
        onClick={goBack}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        ⬅️ Dashboard
      </button>

      <h2>{title}</h2>

      <p>
        Total Medicines: <b>{data.length}</b>
      </p>

      {data.length === 0 ? (
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "10px",
          }}
        >
          <h3>✅ कोई data नहीं मिला।</h3>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            border="1"
            cellPadding="10"
            style={{
              borderCollapse: "collapse",
              width: "100%",
              minWidth: "750px",
              background: "white",
            }}
          >
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Company</th>
                <th>Batch</th>
                <th>Quantity</th>
                <th>Purchase Rate</th>
                <th>Sale Rate</th>
                <th>Expiry</th>

                {(type === "expiry" ||
                  type === "expired") && (
                  <th>Status</th>
                )}
              </tr>
            </thead>

            <tbody>
              {data.map((item, index) => {
                let daysLeft = null;

                if (item.expiry) {
                  const expiryDate =
                    new Date(item.expiry);

                  if (
                    !isNaN(
                      expiryDate.getTime()
                    )
                  ) {
                    daysLeft = Math.ceil(
                      (expiryDate.getTime() -
                        today.getTime()) /
                        (1000 *
                          60 *
                          60 *
                          24)
                    );
                  }
                }

                return (
                  <tr key={index}>
                    <td>
                      {item.medicine || "-"}
                    </td>

                    <td>
                      {item.company || "-"}
                    </td>

                    <td>
                      {item.batch || "-"}
                    </td>

                    <td
                      style={{
                        fontWeight: "bold",
                        color:
                          Number(
                            item.quantity || 0
                          ) <= 5
                            ? "red"
                            : "#222",
                      }}
                    >
                      {item.quantity || 0}
                    </td>

                    <td>
                      ₹
                      {Number(
                        item.purchaseRate ||
                          item.rate ||
                          0
                      ).toFixed(2)}
                    </td>

                    <td>
                      ₹
                      {Number(
                        item.saleRate ||
                          item.mrp ||
                          0
                      ).toFixed(2)}
                    </td>

                    <td>
                      {item.expiry || "-"}
                    </td>

                    {(type === "expiry" ||
                      type === "expired") && (
                      <td
                        style={{
                          color:
                            daysLeft <= 0
                              ? "red"
                              : "#f57c00",
                          fontWeight: "bold",
                        }}
                      >
                        {daysLeft <= 0
                          ? "🔴 Expired"
                          : "⚠️ " +
                            daysLeft +
                            " दिन बाकी"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default StockDetails;