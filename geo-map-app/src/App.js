import React from 'react';
import MapComponent from "./components/MapComponent";

function App() {
    return (
        <div style={{ padding: "0", margin: "0", fontFamily: "sans-serif" }}>
            <div style={{ position: "absolute", top: "10px", left: "20px", zIndex: 999, color: "#fff", backgroundColor: "rgba(0,0,0,0.3)", padding: "5px 10px", borderRadius: "5px" }}>
                <h3 style={{ margin: 0, fontSize: "1rem" }}>Map Application</h3>
            </div>
            <MapComponent />
        </div>
    );
}

export default App;
