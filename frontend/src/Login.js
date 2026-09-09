import { useState } from "react";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const login = () => {
    const user = username.trim();
    const pass = password.trim();

    if (user === "admin" && pass === "1234") {
      localStorage.setItem("loggedIn", "true");
      onLogin();
    } else {
      alert("❌ Wrong Username or Password");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f2f5f9",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "320px",
          padding: "30px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
          textAlign: "center",
        }}
      >
        <h2>🏥 Shivam Medical ERP</h2>

        <p>Login करें</p>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: "90%",
            padding: "12px",
            marginBottom: "15px",
            fontSize: "16px",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "90%",
            padding: "12px",
            marginBottom: "20px",
            fontSize: "16px",
          }}
        />

        <button
          onClick={login}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "17px",
            cursor: "pointer",
          }}
        >
          🔐 Login
        </button>
      </div>
    </div>
  );
}

export default Login;