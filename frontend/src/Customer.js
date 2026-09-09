import React, { useEffect, useState } from "react";

function Customer({ goBack }) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [customers, setCustomers] = useState([]);

  // =====================================================
  // LOAD CUSTOMERS
  // =====================================================

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = () => {
    try {
      const data = JSON.parse(
        localStorage.getItem("customers") || "[]"
      );

      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Customer Load Error:", error);
      setCustomers([]);
    }
  };

  // =====================================================
  // SAVE CUSTOMER
  // =====================================================

  const saveCustomer = () => {
    const cleanName = name.trim();

    const cleanMobile = mobile
      .replace(/\D/g, "")
      .trim();

    if (!cleanName) {
      alert("⚠️ Customer Name डालें");
      return;
    }

    if (!cleanMobile) {
      alert("⚠️ Mobile Number डालें");
      return;
    }

    if (
      cleanMobile.length !== 10
    ) {
      alert(
        "⚠️ Mobile Number 10 digit का होना चाहिए"
      );
      return;
    }

    // =================================================
    // CHECK DUPLICATE MOBILE
    // =================================================

    const duplicate = customers.find(
      (customer) =>
        String(customer.mobile || "")
          .replace(/\D/g, "") === cleanMobile
    );

    if (duplicate) {
      alert(
        `⚠️ यह Mobile Number पहले से मौजूद है।\n\nCustomer: ${duplicate.name}`
      );
      return;
    }

    // =================================================
    // CUSTOMER OBJECT
    // =================================================

    const newCustomer = {
      id:
        "CUS-" +
        Date.now(),

      name: cleanName,

      mobile: cleanMobile,

      createdAt:
        new Date().toISOString(),

      createdDate:
        new Date().toLocaleDateString(
          "en-IN"
        ),

      createdTime:
        new Date().toLocaleTimeString(
          "en-IN"
        ),
    };

    // =================================================
    // SAVE
    // =================================================

    const updatedCustomers = [
      newCustomer,
      ...customers,
    ];

    localStorage.setItem(
      "customers",
      JSON.stringify(
        updatedCustomers
      )
    );

    setCustomers(
      updatedCustomers
    );

    alert(
      "✅ Customer Saved Successfully"
    );

    setName("");
    setMobile("");
  };

  // =====================================================
  // DELETE CUSTOMER
  // =====================================================

  const deleteCustomer = (id) => {
    const customer =
      customers.find(
        (item) =>
          item.id === id
      );

    if (!customer) {
      return;
    }

    const confirmDelete =
      window.confirm(
        `क्या आप "${customer.name}" को Customer Master से हटाना चाहते हैं?`
      );

    if (!confirmDelete) {
      return;
    }

    const updated =
      customers.filter(
        (item) =>
          item.id !== id
      );

    localStorage.setItem(
      "customers",
      JSON.stringify(updated)
    );

    setCustomers(updated);
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "15px",
        background:
          "#f2f5f9",
        fontFamily:
          "Arial, sans-serif",
        boxSizing:
          "border-box",
      }}
    >

      {/* HEADER */}

      <div
        style={{
          background:
            "linear-gradient(135deg,#0d47a1,#1976d2,#42a5f5)",
          color: "white",
          padding: "17px",
          borderRadius: "11px",
          marginBottom: "15px",
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          gap: "10px",
          flexWrap:
            "wrap",
        }}
      >

        <div>
          <h2
            style={{
              margin: 0,
            }}
          >
            👥 Customer Master
          </h2>

          <div
            style={{
              marginTop: "5px",
              fontSize: "13px",
            }}
          >
            Customer Name & Mobile
            Save करें
          </div>
        </div>

        <button
          type="button"
          onClick={goBack}
          style={{
            padding:
              "9px 14px",
            background:
              "rgba(255,255,255,0.18)",
            color: "white",
            border:
              "1px solid rgba(255,255,255,0.4)",
            borderRadius:
              "7px",
            cursor:
              "pointer",
            fontWeight:
              "bold",
          }}
        >
          ⬅️ Dashboard
        </button>

      </div>

      {/* ADD CUSTOMER */}

      <div
        style={{
          background:
            "white",
          padding: "18px",
          borderRadius:
            "10px",
          marginBottom:
            "15px",
          boxShadow:
            "0 2px 7px rgba(0,0,0,0.06)",
        }}
      >

        <h3
          style={{
            marginTop: 0,
          }}
        >
          ➕ Add Customer
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: "10px",
          }}
        >

          <input
            type="text"
            placeholder="Customer Name"
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
            style={inputStyle}
          />

          <input
            type="tel"
            placeholder="Mobile Number"
            value={mobile}
            maxLength={10}
            onChange={(e) =>
              setMobile(
                e.target.value.replace(
                  /\D/g,
                  ""
                )
              )
            }
            style={inputStyle}
          />

        </div>

        <button
          type="button"
          onClick={saveCustomer}
          style={saveButton}
        >
          💾 Save Customer
        </button>

      </div>

      {/* CUSTOMER LIST */}

      <div
        style={{
          background:
            "white",
          padding: "15px",
          borderRadius:
            "10px",
          boxShadow:
            "0 2px 7px rgba(0,0,0,0.06)",
        }}
      >

        <h3
          style={{
            marginTop: 0,
          }}
        >
          👥 Saved Customers
          {" "}
          ({customers.length})
        </h3>

        {customers.length ===
        0 ? (
          <div
            style={{
              padding:
                "20px",
              textAlign:
                "center",
              color:
                "#777",
              background:
                "#f7f8fa",
              borderRadius:
                "7px",
            }}
          >
            अभी कोई Customer
            Save नहीं है।
          </div>
        ) : (

          <div
            style={{
              overflowX:
                "auto",
            }}
          >

            <table
              style={{
                width:
                  "100%",
                borderCollapse:
                  "collapse",
                fontSize:
                  "13px",
              }}
            >

              <thead>
                <tr>

                  <th
                    style={
                      thStyle
                    }
                  >
                    #
                  </th>

                  <th
                    style={
                      thStyle
                    }
                  >
                    Customer Name
                  </th>

                  <th
                    style={
                      thStyle
                    }
                  >
                    Mobile
                  </th>

                  <th
                    style={
                      thStyle
                    }
                  >
                    Created
                  </th>

                  <th
                    style={
                      thStyle
                    }
                  >
                    Action
                  </th>

                </tr>
              </thead>

              <tbody>

                {customers.map(
                  (
                    customer,
                    index
                  ) => (
                    <tr
                      key={
                        customer.id ||
                        index
                      }
                    >

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {index + 1}
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          fontWeight:
                            "bold",
                          color:
                            "#1565c0",
                        }}
                      >
                        👤{" "}
                        {
                          customer.name
                        }
                      </td>

                      <td
                        style={
                          tdStyle
                        }
                      >
                        📱{" "}
                        {
                          customer.mobile
                        }
                      </td>

                      <td
                        style={
                          tdStyle
                        }
                      >
                        {
                          customer.createdDate ||
                          "-"
                        }
                        <br />
                        <span
                          style={{
                            fontSize:
                              "11px",
                            color:
                              "#777",
                          }}
                        >
                          {
                            customer.createdTime ||
                            ""
                          }
                        </span>
                      </td>

                      <td
                        style={
                          tdStyle
                        }
                      >

                        <button
                          type="button"
                          onClick={() =>
                            deleteCustomer(
                              customer.id
                            )
                          }
                          style={
                            deleteButton
                          }
                        >
                          🗑️ Delete
                        </button>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const inputStyle = {
  width: "100%",
  boxSizing:
    "border-box",
  padding: "11px",
  border:
    "1px solid #ccc",
  borderRadius:
    "7px",
  fontSize:
    "14px",
};

const saveButton = {
  marginTop:
    "12px",
  padding:
    "10px 18px",
  background:
    "#2e7d32",
  color:
    "white",
  border:
    "none",
  borderRadius:
    "7px",
  cursor:
    "pointer",
  fontWeight:
    "bold",
};

const deleteButton = {
  padding:
    "7px 10px",
  background:
    "#d32f2f",
  color:
    "white",
  border:
    "none",
  borderRadius:
    "6px",
  cursor:
    "pointer",
  fontWeight:
    "bold",
};

const thStyle = {
  border:
    "1px solid #ddd",
  padding:
    "9px",
  background:
    "#eaf2f8",
  textAlign:
    "left",
  whiteSpace:
    "nowrap",
};

const tdStyle = {
  border:
    "1px solid #ddd",
  padding:
    "9px",
  whiteSpace:
    "nowrap",
};

export default Customer;