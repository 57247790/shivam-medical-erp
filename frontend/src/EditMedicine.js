import { useState } from "react";

function EditMedicine({ stock, setStock, editIndex, goBack }) {
  const item = stock[editIndex];

  const [medicine, setMedicine] = useState(item.medicine);
  const [company, setCompany] = useState(item.company);
  const [quantity, setQuantity] = useState(item.quantity);
  const [rate, setRate] = useState(item.rate);
  const [mrp, setMrp] = useState(item.mrp);
  const [expiry, setExpiry] = useState(item.expiry);

  const updateMedicine = () => {
    const newStock = [...stock];

    newStock[editIndex] = {
      medicine,
      company,
      quantity,
      rate,
      mrp,
      expiry,
    };

    setStock(newStock);

    alert("Medicine Updated Successfully");

    goBack();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>✏️ Edit Medicine</h2>

      <input
        value={medicine}
        onChange={(e) => setMedicine(e.target.value)}
        placeholder="Medicine"
      />
      <br /><br />

      <input
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="Company"
      />
      <br /><br />

      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="Quantity"
      />
      <br /><br />

      <input
        type="number"
        value={rate}
        onChange={(e) => setRate(e.target.value)}
        placeholder="Purchase Rate"
      />
      <br /><br />

      <input
        type="number"
        value={mrp}
        onChange={(e) => setMrp(e.target.value)}
        placeholder="MRP"
      />
      <br /><br />

      <input
        type="date"
        value={expiry}
        onChange={(e) => setExpiry(e.target.value)}
      />
      <br /><br />

      <button onClick={updateMedicine}>
        💾 Update
      </button>

      <button
        onClick={goBack}
        style={{ marginLeft: 10 }}
      >
        ⬅️ Cancel
      </button>
    </div>
  );
}

export default EditMedicine;