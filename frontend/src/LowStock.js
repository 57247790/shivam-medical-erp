function LowStock({ stock, goBack }) {
  const lowStock = stock.filter(
    (item) => Number(item.quantity) <= 10
  );

  return (
    <div style={{ padding: "20px" }}>
      <h2>⚠️ Low Stock Alert</h2>

      <button onClick={goBack}>
        ⬅️ Back
      </button>

      <br /><br />

      {lowStock.length === 0 ? (
        <h3>✅ All Medicines have sufficient stock.</h3>
      ) : (
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Company</th>
              <th>Stock</th>
            </tr>
          </thead>

          <tbody>
            {lowStock.map((item, index) => (
              <tr key={index}>
                <td>{item.medicine}</td>
                <td>{item.company}</td>
                <td>{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default LowStock;