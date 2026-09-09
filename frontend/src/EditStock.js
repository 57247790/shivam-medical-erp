import { useState } from "react";

function EditStock({
  stock,
  setStock,
  editIndex,
  goBack,
}) {
  const item = stock[editIndex];

  const [medicine, setMedicine] = useState(
    item?.medicine || ""
  );

  const [company, setCompany] = useState(
    item?.company || ""
  );

  const [batch, setBatch] = useState(
    item?.batch || ""
  );

  const [supplier, setSupplier] = useState(
    item?.supplier || ""
  );

  const [quantity, setQuantity] = useState(
    item?.quantity || ""
  );

  const [purchaseRate, setPurchaseRate] =
    useState(
      item?.purchaseRate ||
        item?.rate ||
        ""
    );

  const [saleRate, setSaleRate] =
    useState(
      item?.saleRate || ""
    );

  const [mrp, setMrp] = useState(
    item?.mrp || ""
  );

  const [expiry, setExpiry] = useState(
    item?.expiry || ""
  );

  // =========================
  // SAVE EDIT
  // =========================

  const saveEdit = () => {
    if (!medicine) {
      alert("Medicine Name भरें");
      return;
    }

    if (!quantity) {
      alert("Quantity भरें");
      return;
    }

    if (!purchaseRate) {
      alert("Purchase Rate भरें");
      return;
    }

    if (!saleRate) {
      alert("Sale Rate भरें");
      return;
    }

    if (!mrp) {
      alert("MRP भरें");
      return;
    }

    const newStock = [...stock];

    newStock[editIndex] = {
      ...newStock[editIndex],

      medicine,
      company,
      batch,
      supplier,

      quantity: Number(quantity),

      purchaseRate:
        Number(purchaseRate),

      rate:
        Number(purchaseRate),

      saleRate:
        Number(saleRate),

      mrp:
        Number(mrp),

      expiry,
    };

    setStock(newStock);

    alert(
      "Medicine Details Updated Successfully"
    );

    goBack();
  };

  // =========================
  // INVALID INDEX
  // =========================

  if (!item) {
    return (
      <div
        style={{
          padding: "20px",
        }}
      >
        <h2>
          ❌ Medicine नहीं मिली
        </h2>

        <button onClick={goBack}>
          ⬅️ Back
        </button>
      </div>
    );
  }

  // =========================
  // FORM
  // =========================

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "600px",
      }}
    >
      <h2>
        ✏️ Edit Medicine
      </h2>

      <hr />

      {/* MEDICINE */}

      <label>
        Medicine Name
      </label>

      <br />

      <input
        type="text"
        value={medicine}
        onChange={(e) =>
          setMedicine(e.target.value)
        }
        style={{
          width: "100%",
          padding: "8px",
        }}
      />

      <br />
      <br />

      {/* COMPANY */}

      <label>
        Company
      </label>

      <br />

      <input
        type="text"
        value={company}
        onChange={(e) =>
          setCompany(e.target.value)
        }
        style={{
          width: "100%",
          padding: "8px",
        }}
      />

      <br />
      <br />

      {/* BATCH */}

      <label>
        Batch No.
      </label>

      <br />

      <input
        type="text"
        value={batch}
        onChange={(e) =>
          setBatch(e.target.value)
        }
        style={{
          width: "100%",
          padding: "8px",
        }}
      />

      <br />
      <br />

      {/* SUPPLIER */}

      <label>
        Supplier
      </label>

      <br />

      <input
        type="text"
        value={supplier}
        onChange={(e) =>
          setSupplier(e.target.value)
        }
        style={{
          width: "100%",
          padding: "8px",
        }}
      />

      <br />
      <br />

      {/* QUANTITY */}

      <label>
        Quantity
      </label>

      <br />

      <input
        type="number"
        value={quantity}
        onChange={(e) =>
          setQuantity(e.target.value)
        }
        style={{
          width: "100%",
          padding: "8px",
        }}
      />

      <br />
      <br />

      {/* PURCHASE RATE */}

      <label>
        Purchase Rate
      </label>

      <br />

      <input
        type="number"
        value={purchaseRate}
        onChange={(e) =>
          setPurchaseRate(
            e.target.value
          )
        }
        style={{
          width: "100%",
          padding: "8px",
        }}
      />

      <br />
      <br />

      {/* SALE RATE */}

      <label>
        Sale Rate
      </label>

      <br />

      <input
        type="number"
        value={saleRate}
        onChange={(e) =>
          setSaleRate(
            e.target.value
          )
        }
        style={{
          width: "100%",
          padding: "8px",
        }}
      />

      <br />
      <br />

      {/* MRP */}

      <label>
        MRP
      </label>

      <br />

      <input
        type="number"
        value={mrp}
        onChange={(e) =>
          setMrp(e.target.value)
        }
        style={{
          width: "100%",
          padding: "8px",
        }}
      />

      <br />
      <br />

      {/* EXPIRY */}

      <label>
        Expiry
      </label>

      <br />

      <input
        type="date"
        value={expiry}
        onChange={(e) =>
          setExpiry(e.target.value)
        }
        style={{
          width: "100%",
          padding: "8px",
        }}
      />

      <br />
      <br />

      <hr />

      {/* BUTTONS */}

      <button
        onClick={saveEdit}
        style={{
          padding: "10px 20px",
          marginRight: "10px",
        }}
      >
        💾 Save Changes
      </button>

      <button
        onClick={goBack}
        style={{
          padding: "10px 20px",
        }}
      >
        ❌ Cancel
      </button>
    </div>
  );
}

export default EditStock;