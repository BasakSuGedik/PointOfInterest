import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import Draw from "ol/interaction/Draw";
import Select from "ol/interaction/Select";
import Modify from "ol/interaction/Modify";
import Translate from "ol/interaction/Translate";
import { click } from "ol/events/condition";
import { WKT } from "ol/format";
import { fromLonLat } from "ol/proj";
import Style from "ol/style/Style";
import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Overlay from "ol/Overlay";



const PAGE_SIZE = 10;

const MapComponent = () => {
    const mapRef = useRef();
    const vectorSourceRef = useRef(new VectorSource());
    const vectorLayerRef = useRef(null);
    const popupRef = useRef();
    const popupContentRef = useRef();
    const overlayRef = useRef();

    const drawRef = useRef();
    const selectRef = useRef();
    const modifyRef = useRef();
    const translateRef = useRef();


    const [map, setMap] = useState(null);
    const [drawType, setDrawType] = useState("Point");
    const [wkt, setWkt] = useState("");
    const [name, setName] = useState("");
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [dbData, setDbData] = useState([]);
    const [activeTab, setActiveTab] = useState("point");
    const [currentPage, setCurrentPage] = useState(1);
    const [showFeatures, setShowFeatures] = useState(true);
    const [popupData, setPopupData] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState([]);





    // Zoom kontrol flag'i, sadece kullanıcı seçtiğinde zoom yapacak
    const [userTriggeredSelect, setUserTriggeredSelect] = useState(false);

    useEffect(() => {
        const vectorLayer = new VectorLayer({
            source: vectorSourceRef.current,
            visible: showFeatures,
        });
        vectorLayerRef.current = vectorLayer;

        const initialMap = new Map({
            target: mapRef.current,
            layers: [new TileLayer({ source: new OSM() }), vectorLayer],
            view: new View({
                center: fromLonLat([35.5, 39.0]),
                zoom: 6,
            }),
        });

        setMap(initialMap);


        const overlay = new Overlay({
            element: popupRef.current,
            autoPan: {
                animation: {
                    duration: 250,
                },
            },
        });
        overlayRef.current = overlay;
        initialMap.addOverlay(overlay);
        // Select interaction
        const select = new Select({ condition: click });
        selectRef.current = select;
        initialMap.addInteraction(select);

        select.on("select", (e) => {
            const selected = e.selected[0];
            if (selected && selected.get("id")) {
                setSelectedFeature(selected);
                setName(selected.get("name") || "");
                setUserTriggeredSelect(true); // Kullanıcı tıklaması, zoom yap

                const geometry = selected.getGeometry();
                const coord =
                    geometry.getType() === "Point"
                        ? geometry.getCoordinates()
                        : geometry.getInteriorPoint
                            ? geometry.getInteriorPoint().getCoordinates()
                            : geometry.getClosestPoint(initialMap.getView().getCenter());

                if (coord) {
                    overlay.setPosition(coord);
                    setPopupData({
                        id: selected.get("id"),
                        name: selected.get("name") || "Bilinmiyor",
                        type: selected.get("type") || "Bilinmiyor",
                        coordinate: coord,
                    });
                    popupRef.current.style.display = "block";
                }
            } else {
                setSelectedFeature(null);
                setName("");
                setUserTriggeredSelect(false);
                overlay.setPosition(undefined);
                popupRef.current.style.display = "none";
                setPopupData(null);
            }
        });
    

        // Modify interaction
        const modify = new Modify({ source: vectorSourceRef.current, features: select.getFeatures() });
        modifyRef.current = modify;
        initialMap.addInteraction(modify);

        modify.on("modifyend", (e) => {
            e.features.forEach((feature) => {
                const featureId = feature.getId();
                let originalFeature = null;

                if (featureId !== undefined && featureId !== null) {
                    originalFeature = vectorSourceRef.current.getFeatureById(featureId.toString());
                }

                if (originalFeature) {
                    feature.setProperties({
                        id: originalFeature.get("id"),
                        type: originalFeature.get("type"),
                        name: originalFeature.get("name"),
                    });
                    feature.setId(originalFeature.getId());
                }

                updateFeatureOnServer(feature);
            });
        });

        // Translate interaction (tüm seçili feature'ları taşımak için)
        const translate = new Translate({ features: select.getFeatures() });
        translateRef.current = translate;
        initialMap.addInteraction(translate);

        translate.on("translateend", (e) => {
            const feature = e.features.item(0);
            if (feature) {
                const featureId = feature.getId();
                let originalFeature = null;

                if (featureId !== undefined && featureId !== null) {
                    originalFeature = vectorSourceRef.current.getFeatureById(featureId.toString());
                }

                if (originalFeature) {
                    feature.setProperties({
                        id: originalFeature.get("id"),
                        type: originalFeature.get("type"),
                        name: originalFeature.get("name"),
                    });
                    feature.setId(originalFeature.getId());
                }

                updateFeatureOnServer(feature);
            }
        });

        return () => initialMap.setTarget(null);
    }, []);

    useEffect(() => {
        if (map) {
            loadAllGeometries();
        }
    }, [map]);

    // Seçilen feature değiştiğinde, kullanıcı seçtiyse zoom yap
    useEffect(() => {
        if (map && selectedFeature && userTriggeredSelect) {
            const geometry = selectedFeature.getGeometry();
            if (geometry) {
                let coord = null;
                if (geometry.getType() === "Point") {
                    coord = geometry.getCoordinates();
                } else {
                    coord = geometry.getInteriorPoint
                        ? geometry.getInteriorPoint().getCoordinates()
                        : geometry.getClosestPoint(map.getView().getCenter());
                }
                if (coord) {
                    map.getView().animate({ center: coord, duration: 500, zoom: 10 });
                }
            }
        }
    }, [selectedFeature, map, userTriggeredSelect]);

    const loadAllGeometries = async () => {
        const format = new WKT();
        const types = ["point", "linestring", "polygon"];
        vectorSourceRef.current.clear();

        for (const type of types) {
            try {
                const response = await fetch(`https://localhost:7224/api/${type}`);
                const data = await response.json();

                data.data.forEach((item) => {
                    const feature = format.readFeature(item.wkt, {
                        dataProjection: "EPSG:4326",
                        featureProjection: "EPSG:3857",
                    });
                    feature.setId(item.id);

                    feature.setProperties({
                        id: item.id,
                        name: item.name,
                        type: type,
                    });

                    let style;

                    if (type === "point") {
                        style = new Style({
                            image: new CircleStyle({
                                radius: 7,
                                fill: new Fill({ color: "#FF5722" }),  // Turuncu iç
                                stroke: new Stroke({ color: "#ffffff", width: 2 }), // Beyaz kenarlık
                            }),
                        });
                    } else if (type === "linestring") {
                        style = new Style({
                            stroke: new Stroke({
                                color: "#2196FF", // Mavi
                                width: 3,
                            }),
                        });
                    } else if (type === "polygon") {
                        style = new Style({
                            fill: new Fill({
                                color: "rgba(76, 175, 80, 0.3)", // Yeşil iç yarı saydam
                            }),
                            stroke: new Stroke({
                                color: "#4CAF50", // Yeşil kenar
                                width: 2,
                            }),
                        });
                    }

                    feature.setStyle(style);
                    vectorSourceRef.current.addFeature(feature);
                });
            } catch (err) {
                console.error(`Failed to load ${type}`, err);
            }
        }
    };

    const startDrawing = () => {
        if (!map) return;

        if (drawRef.current) {
            map.removeInteraction(drawRef.current);
        }

        const draw = new Draw({
            source: vectorSourceRef.current,
            type: drawType,
        });

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                map.removeInteraction(draw);
                drawRef.current = null;
                window.removeEventListener("keydown", handleKeyDown); // Temizle
            }
        };

        draw.on("drawend", (e) => {
            const format = new WKT();
            const feature = e.feature;


            const wktString = format.writeFeature(feature, {
                dataProjection: "EPSG:4326",
                featureProjection: "EPSG:3857",
            });

            feature.setProperties({
                name: name,
                type: drawType.toLowerCase(),
            });

            setWkt(wktString);

            map.removeInteraction(draw);
            drawRef.current = null;
            window.removeEventListener("keydown", handleKeyDown); // Temizle
        });
        window.addEventListener("keydown", handleKeyDown); // ✅ ESC tuşunu dinle
        map.addInteraction(draw);
        drawRef.current = draw;
    };

    const saveToServer = async () => {
        if (!wkt || !name) return alert("İsim ve geometri girilmeli.");

        try {
            const response = await fetch(`https://localhost:7224/api/${drawType.toLowerCase()}`, {
                method: "POST",
                headers: { "Content-Type": "application/json; charset=UTF-8" },
                body: JSON.stringify({ name, wkt }),
            });

            const result = await response.json();

            if (result && result.data && result.data.id) {
                // Son eklenen feature
                const features = vectorSourceRef.current.getFeatures();
                const lastFeature = features[features.length - 1];

                if (lastFeature) {
                    lastFeature.setId(result.data.id);
                    lastFeature.setProperties({
                        id: result.data.id,
                        name: name,
                        type: drawType.toLowerCase(),
                    });
                }
            }

            alert("Kaydedildi");
            setWkt("");
            setName("");
            await loadAllGeometries();

        } catch (err) {
            console.error("API Error", err);
            alert("Kaydedilemedi");
        }
    };


    const updateFeatureOnServer = async (feature) => {
        const id = feature.get("id") ?? feature.getId();
        const type = feature.get("type");
        const name = feature.get("name");

        if (!id || !type) {
            console.warn("Feature id or type missing, update aborted.");
            console.log("Feature props:", feature.getProperties());
            return;
        }

        const format = new WKT();
        const wktString = format.writeFeature(feature, {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
        });

        try {
            await fetch(`https://localhost:7224/api/${type}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json; charset=UTF-8" },
                body: JSON.stringify({ name, wkt: wktString }),
            });
            alert("Güncellendi");
        } catch (err) {
            console.error("Güncelleme hatalı", err);
            alert("Güncelleme yapılamadı");
        }
    };

    const deleteFeatureFromServer = async (feature) => {
        const id = feature.get("id");
        const type = feature.get("type");

        if (!id || !type) {
            alert("Feature id or type missing, delete aborted.");
            return;
        }

        try {
            await fetch(`https://localhost:7224/api/${type}/${id}`, {
                method: "DELETE",
            });
            vectorSourceRef.current.removeFeature(feature);
            alert("Silindi");
        } catch (err) {
            console.error("Silme hatalı", err);
            alert("Silinemedi");
        }
    };

    const handleUpdate = () => {
        if (selectedFeature) {
            selectedFeature.set("name", name);
            updateFeatureOnServer(selectedFeature);
            setSelectedFeature(null);
            setName("");
        }
    };

    const handleDelete = () => {
        if (!selectedFeature) return;
        if (window.confirm(`"${selectedFeature.get("name")}" delete?`)) {
            deleteFeatureFromServer(selectedFeature);
            setSelectedFeature(null);
            setName("");
        }
    };

    const fetchDataForType = async (type) => {
        try {
            const response = await fetch(`https://localhost:7224/api/${type}`);
            const data = await response.json();
            setDbData(data.data);
            setCurrentPage(1);
            setActiveTab(type);
        } catch (err) {
            console.error("Fetch failed", err);
        }
    };

    const totalPages = Math.ceil(dbData.length / PAGE_SIZE);
    const paginatedData = dbData.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

   

    const filterByType = (type) => {
        if (!vectorSourceRef.current) return;

        vectorSourceRef.current.getFeatures().forEach((feature) => {
            const fType = feature.get("type")?.toLowerCase();

            // Hepsi gösterilecekse
            if (type === "all") {
                feature.setStyle(getStyleByType(fType)); // varsayılan stili geri ver
            } else {
                // Tür eşleşiyorsa görünür, değilse görünmez yap
                if (fType === type.toLowerCase()) {
                    feature.setStyle(getStyleByType(fType));
                } else {
                    feature.setStyle(
                        new Style({
                            fill: new Fill({ color: "rgba(0,0,0,0)" }),
                            stroke: new Stroke({ color: "rgba(0,0,0,0)", width: 0 }),
                            image: new CircleStyle({ radius: 0 }),
                        })
                    );
                }
            }
        });
    };

    const hideAllFeatures = () => {
        if (!vectorSourceRef.current) return;

        vectorSourceRef.current.getFeatures().forEach((feature) => {
            feature.setStyle(
                new Style({
                    fill: new Fill({ color: "rgba(0,0,0,0)" }),
                    stroke: new Stroke({ color: "rgba(0,0,0,0)", width: 0 }),
                    image: new CircleStyle({ radius: 0 }),
                })
            );
        });
    };


    const getStyleByType = (type) => {
        if (type === "point") {
            return new Style({
                image: new CircleStyle({
                    radius: 7,
                    fill: new Fill({ color: "#FF5722" }),
                    stroke: new Stroke({ color: "#ffffff", width: 2 }),
                }),
            });
        } else if (type === "linestring") {
            return new Style({
                stroke: new Stroke({
                    color: "#2196FF",
                    width: 3,
                }),
            });
        } else if (type === "polygon") {
            return new Style({
                fill: new Fill({
                    color: "rgba(76, 175, 80, 0.3)",
                }),
                stroke: new Stroke({
                    color: "#4CAF50",
                    width: 2,
                }),
            });
        } else {
            return null;
        }
    };




    const handleSearch = (term) => {
        if (!term.trim() || !vectorSourceRef.current) return;

        const features = vectorSourceRef.current.getFeatures();
        const match = features.find((f) =>
            f.get("name")?.toLowerCase() === term.toLowerCase()
        );

        if (match && map && overlayRef.current) {
            const geometry = match.getGeometry();
            const coordinates = geometry.getType() === "Point"
                ? geometry.getCoordinates()
                : geometry.getClosestPoint(fromLonLat([35.5, 39.0]));

            map.getView().animate({ center: coordinates, zoom: 10, duration: 600 });

            overlayRef.current.setPosition(coordinates);
            setPopupData({
                id: match.get("id"),
                name: match.get("name"),
                type: match.get("type"),
            });
            setSelectedFeature(match);
            setUserTriggeredSelect(true);
            setName(match.get("name"));
            setSuggestions([]);
            setSearchTerm("");
        } else {
            alert("Eşleşen geometri bulunamadı.");
        }
    };


    const handleInputChange = (value) => {
        setSearchTerm(value);

        if (!value.trim() || !vectorSourceRef.current) {
            setSuggestions([]);
            return;
        }

        const features = vectorSourceRef.current.getFeatures();
        const matches = features
            .filter((f) =>
                f.get("name")?.toLowerCase().includes(value.toLowerCase())
            )
            .map((f) => ({
                id: f.get("id"),
                name: f.get("name"),
                feature: f,
            }));

        setSuggestions(matches);
    };





    return (
        <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
            <div
                ref={popupRef}
                id="popup"
                style={{
                    position: "absolute",
                    backgroundColor: "white",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                    padding: "10px 10px 10px 10px",
                    borderRadius: "8px",
                    border: "1px solid #cccccc",
                    minWidth: "200px",
                    zIndex: 1001,
                    display: popupData ? "block" : "none", // İlk başta gizli
                }}
            >
                {popupData && (
                    <div style={{ position: "relative" }}>
                        <button
                            onClick={() => {
                                overlayRef.current.setPosition(undefined);
                                setPopupData(null);
                                setSelectedFeature(null);
                                setUserTriggeredSelect(false); 
                                if (map) {
                                    map.getView().animate({
                                        center: fromLonLat([35.5, 39.0]),
                                        zoom: 6,
                                        duration: 500,
                                    });
                                }
                            }}
                            style={{
                                position: "absolute",
                                top: "0px",
                                right: "0px",
                                background: "transparent",
                                border: "none",
                                fontSize: "18px",
                                fontWeight: "bold",
                                cursor: "pointer",
                                color: "#999",
                            }}
                            title="Kapat"
                        >
                            ×
                        </button>

                        <p><strong>{popupData.name}</strong></p>
                        <p>Tür: {popupData.type}</p>
                        <p>ID: {popupData.id}</p>

                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Yeni isim girin"
                            style={{ width: "100%", marginBottom: "0.5rem" }}
                        />

                        <button
                            onClick={handleUpdate}
                            style={{
                                backgroundColor: "green",
                                color: "white",
                                width: "100%",
                                marginBottom: "0.5rem",
                            }}
                        >
                            Güncelle
                        </button>

                        <button
                            onClick={handleDelete}
                            style={{
                                backgroundColor: "red",
                                color: "white",
                                width: "100%",
                                marginBottom: "0.5rem",
                            }}
                        >
                            Sil
                        </button>
                    </div>
                )}
            </div>

            <div
                style={{
                    position: "absolute",
                    top: "20px",
                    left: "40%",
                    transform:"translaeX(-50%)",
                    backgroundColor: "white",
                    padding: "8px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                    zIndex: 1100,
                    display: "flex",
                    gap: "5px",
                    alignItems: "center",
                    flexDirection: "column", 
                    width: "250px", 
                }}
            >
                <input
                    type="text"
                    placeholder="🔍İsim ara..."
                    value={searchTerm}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleSearch(searchTerm);
                        }
                    }}
                    style={{
                        padding: "6px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        minWidth: "200px",
                    }}
                />
                <button
                    onClick={() => handleSearch(searchTerm)}
                    style={{
                        padding: "6px 12px",
                        borderRadius: "4px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        width: "100%"
                    }}
                >
                    Ara
                </button>
                {suggestions.length > 0 && (
                    <ul
                        style={{
                            position: "relative",
                            width: "100%",
                            background: "#fff",
                            listStyle: "none",
                            margin: 0,
                            padding: "4px 0",
                            border: "1px solid #ccc",
                            maxHeight: "150px",
                            overflowY: "auto",
                            zIndex: 1101,
                        }}
                    >
                        {suggestions.map((item, index) => (
                            <li
                                key={item.id || index}
                                onClick={() => {
                                    setSearchTerm(item.name);
                                    handleSearch(item.name);
                                }}
                                style={{
                                    padding: "6px 10px",
                                    cursor: "pointer",
                                    borderBottom: "1px solid #eee",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                            >
                                {item.name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div
                style={{
                    position: "absolute",
                    top: "20px",
                    right: "20px",
                    width: "350px",
                    backgroundColor: "rgba(255,255,255,0.95)",
                    padding: "1rem",
                    borderRadius: "8px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    zIndex: 1000,
                }}
            >
               

                <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                    <button onClick={() => filterByType("all")} style={{ backgroundColor: "#D891EF", color: "white" }}>Tümünü Göster</button>
                    <button onClick={() => filterByType("point")} style={{ backgroundColor: "#FF5722", color: "white" }}>Sadece Nokta</button>
                    <button onClick={() => filterByType("linestring")} style={{ backgroundColor: "#2196FF", color: "white" }}>Sadece Çizgi</button>
                    <button onClick={() => filterByType("polygon")} style={{ backgroundColor: "#4CAF50", color: "white" }}>Sadece Poligon</button>
                    <button onClick={hideAllFeatures} style={{ backgroundColor: "#FF9800", color: "white" }}>Tümünü Gizle</button>
                    
                    
                </div>



                <h3>Çiz & Kaydet</h3>

                <label>Çizim Türü:</label>
                <select
                    value={drawType}
                    onChange={(e) => setDrawType(e.target.value)}
                    style={{ width: "100%", marginBottom: "1rem" }}
                >
                    <option value="Point">Point</option>
                    <option value="LineString">Line</option>
                    <option value="Polygon">Polygon</option>
                </select>

                <button
                    onClick={startDrawing}
                    style={{ width: "100%", marginBottom: "1rem" }}
                >
                    Çizmeye Başla
                </button>
                <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "1rem" }}>
                    Çizim modundan çıkmak için ESC tuşuna basabilirsiniz.
                </p>

                {wkt && (
                    <>
                        <label>WKT:</label>
                        <textarea
                            value={wkt}
                            readOnly
                            style={{ width: "100%", height: "80px", marginBottom: "1rem" }}
                        />

                        <label>İsim:</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Name required"
                            style={{ width: "100%", marginBottom: "1rem" }}
                        />

                        <button
                            onClick={saveToServer}
                            style={{ width: "100%", marginBottom: "1rem" }}
                        >
                            Kaydet
                        </button>
                    </>
                )}

                {selectedFeature && (
                    <>
                        <h4>Seçilen Geometri</h4>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{ width: "100%", marginBottom: "0.5rem" }}
                        />

                        <button
                            onClick={handleUpdate}
                            style={{
                                width: "100%",
                                backgroundColor: "green",
                                color: "white",
                                marginBottom: "0.5rem",
                            }}
                        >
                            Güncelle
                        </button>

                        <button
                            onClick={handleDelete}
                            style={{ width: "100%", backgroundColor: "red", color: "white" }}
                        >
                            Sil
                        </button>
                    </>
                )}

                <hr />

                <h3>Veritabanı Kayıtları</h3>
                <div>
                    <button
                        onClick={() => fetchDataForType("point")}
                        style={{ marginRight: "0.5rem" }}
                    >
                        Point Verisi
                    </button>
                    <button
                        onClick={() => fetchDataForType("linestring")}
                        style={{ marginRight: "0.5rem" }}
                    >
                        Line Verisi
                    </button>
                    <button
                        onClick={() => fetchDataForType("polygon")}
                        style={{ marginRight: "0.5rem" }}
                    >
                        Polygon Verisi
                    </button>
                </div>

                {dbData.length > 0 && (
                    <>
                        <h4>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Data</h4>
                        <ul>
                            {paginatedData.map((item) => (
                                <li key={item.id} style={{ marginBottom: "0.5rem" }}>
                                    <strong>{item.name}</strong>: {item.wkt.slice(0, 50)}...

                                    <button
                                        style={{
                                            marginLeft: "10px",
                                            backgroundColor: "transparent",
                                            border: "none",
                                            cursor: "pointer",
                                            fontSize: "16px",
                                        }}
                                        title="Update"
                                        onClick={() => {
                                            const features = vectorSourceRef.current.getFeatures();
                                            const feat = features.find((f) => f.get("id") === item.id);
                                            if (feat) {
                                                setSelectedFeature(feat);
                                                setName(feat.get("name"));
                                                setUserTriggeredSelect(false); // Liste seçiminde zoom yapma
                                            }
                                        }}
                                    >
                                        ✏️
                                    </button>

                                    <button
                                        style={{
                                            marginLeft: "5px",
                                            backgroundColor: "transparent",
                                            border: "none",
                                            cursor: "pointer",
                                            fontSize: "16px",
                                        }}
                                        title="Delete"
                                        onClick={async () => {
                                            if (window.confirm(`"${item.name}" delete?`)) {
                                                try {
                                                    await fetch(
                                                        `https://localhost:7224/api/${activeTab}/${item.id}`,
                                                        {
                                                            method: "DELETE",
                                                        }
                                                    );
                                                    alert("Deleted");
                                                    const feat = vectorSourceRef.current
                                                        .getFeatures()
                                                        .find((f) => f.get("id") === item.id);
                                                    if (feat) vectorSourceRef.current.removeFeature(feat);
                                                    fetchDataForType(activeTab);
                                                    setSelectedFeature(null);
                                                    setName("");
                                                } catch (err) {
                                                    alert("Delete failed");
                                                }
                                            }
                                        }}
                                    >
                                        🗑️
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <div>
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Önceki
                            </button>
                            <span style={{ margin: "0 1rem" }}>
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Sonraki
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MapComponent;
