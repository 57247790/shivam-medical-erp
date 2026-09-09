import Barcode from "react-barcode";

function BarcodeView({ code, goBack }) {
  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Medicine Barcode</h2>

      <Barcode value={code} />

      <br /><br />

      <button onClick={() => window.print()}>
        🖨️ Print Barcode
      </button>

      <button
        onClick={goBack}
        style={{ marginLeft: "10px" }}
      >
        ⬅️ Back
      </button>
    </div>
  );
}

export default BarcodeView;