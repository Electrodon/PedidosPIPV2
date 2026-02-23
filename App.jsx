import { useState, useEffect, useRef } from "react";

// ─── FAKE DATA ────────────────────────────────────────────────────────────────
const RESTAURANTS = [
  {
    id: 1,
    name: "La Parrilla del Sur",
    category: "Parrilla",
    rating: 4.8,
    deliveryTime: "25-35 min",
    image: "🥩",
    menu: [
      { id: 101, name: "Asado de Tira", desc: "800g a la parrilla", price: 3200, img: "🥩" },
      { id: 102, name: "Vacío al carbón", desc: "Con chimichurri casero", price: 2800, img: "🔥" },
      { id: 103, name: "Empanadas x6", desc: "Carne cortada a cuchillo", price: 1400, img: "🥟" },
      { id: 104, name: "Choripán", desc: "Con salsa criolla", price: 900, img: "🌭" },
      { id: 105, name: "Ensalada mixta", desc: "Tomate, lechuga, zanahoria", price: 700, img: "🥗" },
    ],
  },
  {
    id: 2,
    name: "Pizzería Nápoles",
    category: "Pizzas",
    rating: 4.6,
    deliveryTime: "20-30 min",
    image: "🍕",
    menu: [
      { id: 201, name: "Muzzarella grande", desc: "32cm, doble queso", price: 1800, img: "🍕" },
      { id: 202, name: "Fugazza con queso", desc: "Clásica porteña", price: 1600, img: "🧅" },
      { id: 203, name: "Napolitana", desc: "Tomate, muzzarella, albahaca", price: 1900, img: "🍅" },
      { id: 204, name: "Calabresa", desc: "Con morrones y aceitunas", price: 2000, img: "🌶️" },
      { id: 205, name: "Medialunas x6", desc: "De manteca, artesanales", price: 800, img: "🥐" },
    ],
  },
  {
    id: 3,
    name: "Sushi Osaka",
    category: "Japonesa",
    rating: 4.9,
    deliveryTime: "35-45 min",
    image: "🍣",
    menu: [
      { id: 301, name: "Combo Salmon 30pzs", desc: "Variedad de rolls y nigiris", price: 4500, img: "🍣" },
      { id: 302, name: "Gyozas x8", desc: "Rellenas de cerdo y verdura", price: 1200, img: "🥟" },
      { id: 303, name: "Ramen de miso", desc: "Con cerdo, huevo y alga nori", price: 1800, img: "🍜" },
      { id: 304, name: "Edamame", desc: "Sal y limón", price: 600, img: "🫘" },
    ],
  },
];

const ORDERS_INITIAL = [
  {
    id: "PED-001",
    client: "María González",
    address: "Av. Corrientes 1234, CABA",
    restaurant: "La Parrilla del Sur",
    items: [{ name: "Asado de Tira", qty: 1, price: 3200 }, { name: "Empanadas x6", qty: 2, price: 1400 }],
    total: 6000,
    deliveryFee: 500,
    status: "pending", // pending | accepted | preparing | ready | picked | delivering | delivered
    prepTime: 25,
    elapsed: 0,
    payMethod: "Efectivo",
    phone: "+54 11 2345-6789",
    createdAt: new Date(),
  },
  {
    id: "PED-002",
    client: "Carlos Ramos",
    address: "Callao 567, Dto 3B",
    restaurant: "Pizzería Nápoles",
    items: [{ name: "Muzzarella grande", qty: 2, price: 1800 }, { name: "Fugazza con queso", qty: 1, price: 1600 }],
    total: 5200,
    deliveryFee: 400,
    status: "preparing",
    prepTime: 20,
    elapsed: 8,
    payMethod: "Débito",
    phone: "+54 11 9876-5432",
    createdAt: new Date(Date.now() - 8 * 60000),
  },
];

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:    { label: "Esperando confirmación", color: "#f59e0b", icon: "⏳" },
  accepted:   { label: "Pedido confirmado",       color: "#3b82f6", icon: "✅" },
  preparing:  { label: "En preparación",          color: "#8b5cf6", icon: "👨‍🍳" },
  ready:      { label: "Listo para retirar",      color: "#06b6d4", icon: "📦" },
  picked:     { label: "Repartidor en camino",    color: "#f97316", icon: "🛵" },
  delivering: { label: "En camino a tu casa",     color: "#f97316", icon: "📍" },
  delivered:  { label: "¡Entregado!",             color: "#10b981", icon: "🎉" },
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
const formatPrice = (n) => `$${n.toLocaleString("es-AR")}`;
const timeSince = (date) => {
  const mins = Math.floor((Date.now() - date) / 60000);
  return mins < 1 ? "ahora" : `hace ${mins} min`;
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function Badge({ status }) {
  const c = STATUS_CONFIG[status];
  return (
    <span style={{
      background: c.color + "22",
      color: c.color,
      border: `1px solid ${c.color}44`,
      borderRadius: 20,
      padding: "3px 10px",
      fontSize: 12,
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
    }}>
      {c.icon} {c.label}
    </span>
  );
}

function ProgressBar({ order }) {
  const steps = ["accepted", "preparing", "ready", "picked", "delivered"];
  const idx = steps.indexOf(order.status);
  const pct = order.status === "pending" ? 0 : Math.round(((idx + 1) / steps.length) * 100);
  return (
    <div style={{ margin: "12px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>
        <span>Progreso del pedido</span>
        <span>{pct}%</span>
      </div>
      <div style={{ height: 8, background: "#1e293b", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`,
          height: "100%",
          background: "linear-gradient(90deg, #f97316, #fb923c)",
          borderRadius: 4,
          transition: "width 0.6s ease",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        {["✅", "👨‍🍳", "📦", "🛵", "🎉"].map((icon, i) => (
          <span key={i} style={{
            fontSize: 18,
            opacity: i <= idx ? 1 : 0.25,
            transition: "opacity 0.4s",
          }}>{icon}</span>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  VIEW: CLIENTE
// ──────────────────────────────────────────────────────────────────────────────
function ClientView({ orders, setOrders }) {
  const [screen, setScreen] = useState("home"); // home | menu | cart | tracking
  const [selectedRest, setSelectedRest] = useState(null);
  const [cart, setCart] = useState([]);
  const [payMethod, setPayMethod] = useState("Efectivo");
  const [address, setAddress] = useState("");
  const [trackId, setTrackId] = useState(null);
  const [search, setSearch] = useState("");

  const myOrders = orders.filter(o => o.client === "María González");
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === id);
      if (ex.qty === 1) return prev.filter(c => c.id !== id);
      return prev.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c);
    });
  };

  const placeOrder = () => {
    if (!address.trim()) { alert("Ingresá tu dirección"); return; }
    const newOrder = {
      id: `PED-${String(orders.length + 1).padStart(3, "0")}`,
      client: "María González",
      address,
      restaurant: selectedRest.name,
      items: cart.map(c => ({ name: c.name, qty: c.qty, price: c.price })),
      total: cartTotal,
      deliveryFee: 500,
      status: "pending",
      prepTime: 25,
      elapsed: 0,
      payMethod,
      phone: "+54 11 2345-6789",
      createdAt: new Date(),
    };
    setOrders(prev => [newOrder, ...prev]);
    setTrackId(newOrder.id);
    setCart([]);
    setScreen("tracking");
  };

  const trackOrder = orders.find(o => o.id === trackId);
  const filtered = RESTAURANTS.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", color: "#f1f5f9", minHeight: "100%", background: "#0f172a" }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{
        background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
        padding: "16px 20px",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 4px 20px rgba(249,115,22,0.4)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {screen !== "home" && (
              <button onClick={() => {
                if (screen === "menu") setScreen("home");
                else if (screen === "cart") setScreen("menu");
                else if (screen === "tracking") setScreen("home");
              }} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", fontSize: 18 }}>←</button>
            )}
            <div>
              <div style={{ fontWeight: 900, fontSize: 20 }}>🍽️ RapidoYa</div>
              {screen === "home" && <div style={{ fontSize: 12, opacity: 0.85 }}>📍 Buenos Aires</div>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {cart.length > 0 && (
              <button onClick={() => setScreen("cart")} style={{
                background: "#fff",
                color: "#f97316",
                border: "none",
                borderRadius: 20,
                padding: "6px 14px",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}>🛒 {cart.reduce((s, c) => s + c.qty, 0)}</button>
            )}
            {myOrders.length > 0 && screen === "home" && (
              <button onClick={() => { setTrackId(myOrders[0].id); setScreen("tracking"); }} style={{
                background: "rgba(255,255,255,0.2)",
                color: "#fff",
                border: "none",
                borderRadius: 20,
                padding: "6px 14px",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 13,
              }}>📍 Mis pedidos</button>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 600, margin: "0 auto" }}>

        {/* HOME */}
        {screen === "home" && (
          <>
            {/* Search */}
            <div style={{ margin: "16px 0", position: "relative" }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="🔍  Buscar restaurante o categoría..."
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: 14,
                  color: "#f1f5f9",
                  fontSize: 15,
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            {/* Active orders banner */}
            {myOrders.filter(o => o.status !== "delivered").map(o => (
              <div key={o.id} onClick={() => { setTrackId(o.id); setScreen("tracking"); }} style={{
                background: "linear-gradient(135deg, #1e293b, #0f172a)",
                border: "1px solid #f97316",
                borderRadius: 16,
                padding: 14,
                marginBottom: 16,
                cursor: "pointer",
                animation: "pulse 2s infinite",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 800, color: "#f97316" }}>Pedido activo — {o.id}</div>
                    <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{o.restaurant}</div>
                  </div>
                  <Badge status={o.status} />
                </div>
                <ProgressBar order={o} />
              </div>
            ))}

            {/* Categories */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 16 }}>
              {["🍕 Pizzas", "🥩 Parrilla", "🍣 Japonesa", "🍔 Burgers", "🥗 Saludable"].map(cat => (
                <button key={cat} onClick={() => setSearch(cat.split(" ")[1])} style={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: 20,
                  padding: "8px 16px",
                  color: "#94a3b8",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontSize: 13,
                  fontFamily: "'Nunito', sans-serif",
                }}>{cat}</button>
              ))}
            </div>

            {/* Restaurants */}
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
              {filtered.length} restaurantes disponibles
            </div>
            {filtered.map(rest => (
              <div key={rest.id} onClick={() => { setSelectedRest(rest); setScreen("menu"); }} style={{
                background: "#1e293b",
                borderRadius: 18,
                marginBottom: 14,
                cursor: "pointer",
                overflow: "hidden",
                border: "1px solid #334155",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
              >
                <div style={{ background: "linear-gradient(135deg, #1e3a5f, #1e293b)", height: 80, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>
                  {rest.image}
                </div>
                <div style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 17 }}>{rest.name}</div>
                      <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{rest.category}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#fbbf24", fontWeight: 700 }}>⭐ {rest.rating}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{rest.deliveryTime}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* MENU */}
        {screen === "menu" && selectedRest && (
          <>
            <div style={{ background: "linear-gradient(135deg, #1e3a5f, #0f172a)", borderRadius: 18, padding: 20, marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: 60 }}>{selectedRest.image}</div>
              <div style={{ fontWeight: 900, fontSize: 22, marginTop: 8 }}>{selectedRest.name}</div>
              <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>⭐ {selectedRest.rating} · {selectedRest.deliveryTime} · Envío $500</div>
            </div>

            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Menú disponible</div>

            {selectedRest.menu.map(item => {
              const inCart = cart.find(c => c.id === item.id);
              return (
                <div key={item.id} style={{
                  background: "#1e293b",
                  borderRadius: 14,
                  marginBottom: 10,
                  padding: "14px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: inCart ? "1px solid #f97316" : "1px solid #334155",
                }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ fontSize: 32 }}>{item.img}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{item.desc}</div>
                      <div style={{ color: "#f97316", fontWeight: 800, marginTop: 4 }}>{formatPrice(item.price)}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    {inCart ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button onClick={() => removeFromCart(item.id)} style={btnSmall("#334155")}>−</button>
                        <span style={{ fontWeight: 800, minWidth: 20, textAlign: "center" }}>{inCart.qty}</span>
                        <button onClick={() => addToCart(item)} style={btnSmall("#f97316")}>+</button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(item)} style={{
                        background: "#f97316",
                        border: "none",
                        borderRadius: 10,
                        padding: "8px 16px",
                        color: "#fff",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: 13,
                        fontFamily: "'Nunito', sans-serif",
                      }}>Agregar</button>
                    )}
                  </div>
                </div>
              );
            })}

            {cart.length > 0 && (
              <div style={{ position: "sticky", bottom: 16, marginTop: 16 }}>
                <button onClick={() => setScreen("cart")} style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  border: "none",
                  borderRadius: 16,
                  padding: "16px",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 17,
                  cursor: "pointer",
                  fontFamily: "'Nunito', sans-serif",
                  boxShadow: "0 4px 20px rgba(249,115,22,0.5)",
                }}>
                  Ver carrito ({cart.reduce((s, c) => s + c.qty, 0)} items) → {formatPrice(cartTotal)}
                </button>
              </div>
            )}
          </>
        )}

        {/* CART */}
        {screen === "cart" && (
          <>
            <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 16, marginTop: 4 }}>Tu pedido 🛒</div>

            {cart.map(item => (
              <div key={item.id} style={{ background: "#1e293b", borderRadius: 12, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>x{item.qty}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#f97316", fontWeight: 700 }}>{formatPrice(item.price * item.qty)}</span>
                  <button onClick={() => removeFromCart(item.id)} style={btnSmall("#ef4444")}>−</button>
                  <button onClick={() => addToCart(item)} style={btnSmall("#f97316")}>+</button>
                </div>
              </div>
            ))}

            <div style={{ background: "#1e293b", borderRadius: 14, padding: 16, marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#94a3b8" }}>Subtotal</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: "#94a3b8" }}>Envío</span>
                <span>$500</span>
              </div>
              <div style={{ borderTop: "1px solid #334155", paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 800, fontSize: 18 }}>Total</span>
                <span style={{ fontWeight: 900, fontSize: 18, color: "#f97316" }}>{formatPrice(cartTotal + 500)}</span>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 13, color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: 6 }}>📍 DIRECCIÓN DE ENTREGA</label>
              <input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Ej: Av. Corrientes 1234, Piso 2"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: 12,
                  color: "#f1f5f9",
                  fontSize: 15,
                  boxSizing: "border-box",
                  outline: "none",
                  fontFamily: "'Nunito', sans-serif",
                }}
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 13, color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: 8 }}>💳 MÉTODO DE PAGO</label>
              <div style={{ display: "flex", gap: 10 }}>
                {["Efectivo", "Débito"].map(m => (
                  <button key={m} onClick={() => setPayMethod(m)} style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 12,
                    border: payMethod === m ? "2px solid #f97316" : "1px solid #334155",
                    background: payMethod === m ? "#f9731622" : "#1e293b",
                    color: payMethod === m ? "#f97316" : "#94a3b8",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: 14,
                  }}>
                    {m === "Efectivo" ? "💵" : "💳"} {m}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={placeOrder} style={{
              width: "100%",
              marginTop: 20,
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              border: "none",
              borderRadius: 16,
              padding: 18,
              color: "#fff",
              fontWeight: 900,
              fontSize: 17,
              cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
              boxShadow: "0 4px 20px rgba(249,115,22,0.5)",
            }}>
              🚀 Confirmar pedido — {formatPrice(cartTotal + 500)}
            </button>
          </>
        )}

        {/* TRACKING */}
        {screen === "tracking" && trackOrder && (
          <>
            <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 16, marginTop: 4 }}>📍 Seguimiento en vivo</div>

            <div style={{ background: "#1e293b", borderRadius: 18, padding: 20, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17 }}>{trackOrder.id}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>{trackOrder.restaurant}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Pedido {timeSince(trackOrder.createdAt)}</div>
                </div>
                <Badge status={trackOrder.status} />
              </div>

              <ProgressBar order={trackOrder} />

              {/* Estimated time */}
              {trackOrder.status !== "delivered" && (
                <div style={{ background: "#0f172a", borderRadius: 12, padding: 14, textAlign: "center", marginTop: 8 }}>
                  <div style={{ fontSize: 13, color: "#64748b" }}>Tiempo estimado</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: "#f97316" }}>
                    {Math.max(0, trackOrder.prepTime - trackOrder.elapsed)} min
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>aprox. de espera</div>
                </div>
              )}
            </div>

            <div style={{ background: "#1e293b", borderRadius: 14, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Detalle del pedido</div>
              {trackOrder.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#94a3b8" }}>{item.name} x{item.qty}</span>
                  <span>{formatPrice(item.price * item.qty)}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #334155", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Envío</span>
                <span>{formatPrice(trackOrder.deliveryFee)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontWeight: 800 }}>Total a pagar</span>
                <span style={{ fontWeight: 900, color: "#f97316" }}>{formatPrice(trackOrder.total + trackOrder.deliveryFee)}</span>
              </div>
              <div style={{ marginTop: 8, padding: "8px 12px", background: "#0f172a", borderRadius: 10, fontSize: 13, color: "#64748b" }}>
                💳 Pago: {trackOrder.payMethod} (directo al local/repartidor)
              </div>
            </div>

            <div style={{ background: "#1e293b", borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Dirección de entrega</div>
              <div style={{ color: "#f1f5f9" }}>📍 {trackOrder.address}</div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  VIEW: RESTAURANTE
// ──────────────────────────────────────────────────────────────────────────────
function RestaurantView({ orders, setOrders }) {
  const [tab, setTab] = useState("orders"); // orders | menu
  const [restaurant] = useState(RESTAURANTS[0]);
  const [menuEdit, setMenuEdit] = useState(restaurant.menu);
  const [newItem, setNewItem] = useState({ name: "", desc: "", price: "", img: "🍽️" });
  const [editingPrepTime, setEditingPrepTime] = useState(null);
  const [newPrepTime, setNewPrepTime] = useState("");

  const myOrders = orders.filter(o => o.restaurant === restaurant.name);

  const updateStatus = (id, status) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const updatePrepTime = (id) => {
    const val = parseInt(newPrepTime);
    if (!isNaN(val) && val > 0) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, prepTime: val } : o));
    }
    setEditingPrepTime(null);
  };

  const addMenuItem = () => {
    if (!newItem.name || !newItem.price) return;
    setMenuEdit(prev => [...prev, { ...newItem, id: Date.now(), price: parseInt(newItem.price) }]);
    setNewItem({ name: "", desc: "", price: "", img: "🍽️" });
  };

  const ordersByStatus = (statuses) => myOrders.filter(o => statuses.includes(o.status));

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", color: "#f1f5f9", minHeight: "100%", background: "#0f172a" }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      <div style={{
        background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
        padding: "16px 20px",
        position: "sticky", top: 0, zIndex: 50,
        boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
      }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>🍽️ {restaurant.name}</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>Panel de cocina</div>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["orders", "📋 Pedidos"], ["menu", "📝 Menú"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1,
              padding: "12px",
              borderRadius: 12,
              border: "none",
              background: tab === key ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : "#1e293b",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: 14,
              fontFamily: "'Nunito', sans-serif",
              boxShadow: tab === key ? "0 4px 12px rgba(124,58,237,0.4)" : "none",
            }}>{label}</button>
          ))}
        </div>

        {tab === "orders" && (
          <>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Pendientes", count: ordersByStatus(["pending"]).length, color: "#f59e0b" },
                { label: "En cocina", count: ordersByStatus(["accepted", "preparing"]).length, color: "#7c3aed" },
                { label: "Listos", count: ordersByStatus(["ready"]).length, color: "#10b981" },
              ].map(s => (
                <div key={s.label} style={{ background: "#1e293b", borderRadius: 14, padding: 14, textAlign: "center", border: `1px solid ${s.color}33` }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {myOrders.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>
                <div style={{ fontSize: 48 }}>🍽️</div>
                <div style={{ marginTop: 12, fontSize: 16 }}>No hay pedidos aún</div>
              </div>
            )}

            {myOrders.map(order => (
              <div key={order.id} style={{
                background: "#1e293b",
                borderRadius: 16,
                padding: 18,
                marginBottom: 14,
                border: `1px solid ${STATUS_CONFIG[order.status].color}44`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 17 }}>{order.id}</div>
                    <div style={{ fontSize: 13, color: "#94a3b8" }}>{order.client} · {timeSince(order.createdAt)}</div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>📍 {order.address}</div>
                  </div>
                  <Badge status={order.status} />
                </div>

                {/* Items */}
                <div style={{ background: "#0f172a", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                      <span>x{item.qty} {item.name}</span>
                      <span style={{ color: "#7c3aed", fontWeight: 700 }}>{formatPrice(item.price * item.qty)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid #1e293b", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
                    <span>Total</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>

                {/* Prep time */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: "#64748b" }}>⏱ Tiempo estimado:</span>
                  {editingPrepTime === order.id ? (
                    <>
                      <input
                        value={newPrepTime}
                        onChange={e => setNewPrepTime(e.target.value)}
                        type="number"
                        style={{ width: 60, padding: "4px 8px", background: "#0f172a", border: "1px solid #7c3aed", borderRadius: 8, color: "#f1f5f9", fontFamily: "'Nunito', sans-serif", fontSize: 14 }}
                      />
                      <span style={{ color: "#64748b", fontSize: 13 }}>min</span>
                      <button onClick={() => updatePrepTime(order.id)} style={actionBtn("#10b981")}>✓</button>
                      <button onClick={() => setEditingPrepTime(null)} style={actionBtn("#ef4444")}>✕</button>
                    </>
                  ) : (
                    <>
                      <span style={{ color: "#7c3aed", fontWeight: 800 }}>{order.prepTime} min</span>
                      <button onClick={() => { setEditingPrepTime(order.id); setNewPrepTime(order.prepTime); }} style={actionBtn("#334155")}>Ajustar</button>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {order.status === "pending" && (
                    <>
                      <button onClick={() => updateStatus(order.id, "accepted")} style={actionBtn("#7c3aed")}>✅ Aceptar</button>
                      <button onClick={() => updateStatus(order.id, "rejected")} style={actionBtn("#ef4444")}>✕ Rechazar</button>
                    </>
                  )}
                  {order.status === "accepted" && (
                    <button onClick={() => updateStatus(order.id, "preparing")} style={actionBtn("#7c3aed")}>👨‍🍳 Iniciar preparación</button>
                  )}
                  {order.status === "preparing" && (
                    <button onClick={() => updateStatus(order.id, "ready")} style={actionBtn("#10b981")}>📦 Marcar listo</button>
                  )}
                  {order.status === "ready" && (
                    <div style={{ fontSize: 13, color: "#10b981", padding: "8px 0" }}>✅ Esperando repartidor...</div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === "menu" && (
          <>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 14 }}>Administrar menú</div>

            {menuEdit.map((item, i) => (
              <div key={item.id} style={{ background: "#1e293b", borderRadius: 12, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 28 }}>{item.img}</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{item.desc}</div>
                    <div style={{ color: "#7c3aed", fontWeight: 700, marginTop: 2 }}>{formatPrice(item.price)}</div>
                  </div>
                </div>
                <button onClick={() => setMenuEdit(prev => prev.filter((_, j) => j !== i))} style={actionBtn("#ef4444")}>Eliminar</button>
              </div>
            ))}

            {/* Add item */}
            <div style={{ background: "#1e293b", borderRadius: 16, padding: 18, marginTop: 16, border: "1px dashed #334155" }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: "#94a3b8" }}>+ Agregar nuevo item</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    value={newItem.img}
                    onChange={e => setNewItem(p => ({ ...p, img: e.target.value }))}
                    placeholder="Emoji"
                    style={{ ...inputStyle, width: 70, textAlign: "center", fontSize: 22 }}
                  />
                  <input
                    value={newItem.name}
                    onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                    placeholder="Nombre del plato"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
                <input
                  value={newItem.desc}
                  onChange={e => setNewItem(p => ({ ...p, desc: e.target.value }))}
                  placeholder="Descripción"
                  style={inputStyle}
                />
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    value={newItem.price}
                    onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))}
                    type="number"
                    placeholder="Precio ($)"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button onClick={addMenuItem} style={{
                    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 20px",
                    color: "#fff",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontSize: 14,
                    fontFamily: "'Nunito', sans-serif",
                  }}>Agregar</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  VIEW: REPARTIDOR
// ──────────────────────────────────────────────────────────────────────────────
function DeliveryView({ orders, setOrders }) {
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [feeInput, setFeeInput] = useState({});
  const [editingFee, setEditingFee] = useState(null);

  const available = orders.filter(o => o.status === "ready" && !myDeliveries.includes(o.id));
  const active = orders.filter(o => myDeliveries.includes(o.id) && o.status !== "delivered");
  const delivered = orders.filter(o => myDeliveries.includes(o.id) && o.status === "delivered");

  const acceptDelivery = (order) => {
    const fee = parseInt(feeInput[order.id]) || 500;
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: "picked", deliveryFee: fee } : o));
    setMyDeliveries(prev => [...prev, order.id]);
    setEditingFee(null);
  };

  const updateStatus = (id, status) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", color: "#f1f5f9", minHeight: "100%", background: "#0f172a" }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      <div style={{
        background: "linear-gradient(135deg, #0891b2, #0e7490)",
        padding: "16px 20px",
        position: "sticky", top: 0, zIndex: 50,
        boxShadow: "0 4px 20px rgba(8,145,178,0.4)",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>🛵 Panel Repartidor</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>Hola, Juan · En línea</div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: 16 }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Disponibles", count: available.length, color: "#0891b2" },
            { label: "En curso", count: active.length, color: "#f97316" },
            { label: "Entregados", count: delivered.length, color: "#10b981" },
          ].map(s => (
            <div key={s.label} style={{ background: "#1e293b", borderRadius: 14, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Available pickups */}
        {available.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: "#0891b2", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
              📦 Pedidos listos para retirar
            </div>
            {available.map(order => (
              <div key={order.id} style={{
                background: "#1e293b",
                borderRadius: 16,
                padding: 18,
                marginBottom: 14,
                border: "1px solid #0891b244",
                animation: "glow 2s ease-in-out infinite",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{order.id}</div>
                    <div style={{ fontSize: 13, color: "#0891b2", fontWeight: 700 }}>{order.restaurant}</div>
                  </div>
                  <Badge status={order.status} />
                </div>

                <div style={{ background: "#0f172a", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>📍</span>
                    <span style={{ fontSize: 14, color: "#94a3b8" }}>{order.address}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>👤</span>
                    <span style={{ fontSize: 14, color: "#94a3b8" }}>{order.client} · {order.phone}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span style={{ fontSize: 16 }}>💳</span>
                    <span style={{ fontSize: 14, color: "#94a3b8" }}>Pago: {order.payMethod} · Valor pedido: {formatPrice(order.total)}</span>
                  </div>
                </div>

                {/* Items */}
                <div style={{ marginBottom: 12 }}>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ fontSize: 13, color: "#64748b", marginBottom: 3 }}>x{item.qty} {item.name}</div>
                  ))}
                </div>

                {/* Fee negotiation */}
                <div style={{ background: "#0f172a", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>💰 Acordar precio de envío:</div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input
                      type="number"
                      value={feeInput[order.id] || ""}
                      onChange={e => setFeeInput(p => ({ ...p, [order.id]: e.target.value }))}
                      placeholder="500"
                      style={{ ...inputStyle, width: 100, textAlign: "center" }}
                    />
                    <span style={{ fontSize: 13, color: "#64748b" }}>$ → Total cliente: {formatPrice(order.total + (parseInt(feeInput[order.id]) || 500))}</span>
                  </div>
                </div>

                <button onClick={() => acceptDelivery(order)} style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #0891b2, #0e7490)",
                  border: "none",
                  borderRadius: 12,
                  padding: 14,
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 15,
                  cursor: "pointer",
                  fontFamily: "'Nunito', sans-serif",
                  boxShadow: "0 4px 12px rgba(8,145,178,0.4)",
                }}>🛵 Aceptar y retirar</button>
              </div>
            ))}
          </>
        )}

        {/* Active deliveries */}
        {active.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: "#f97316", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, marginTop: 8 }}>
              🛵 En curso
            </div>
            {active.map(order => (
              <div key={order.id} style={{ background: "#1e293b", borderRadius: 16, padding: 18, marginBottom: 14, border: "1px solid #f9731644" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{order.id}</div>
                    <div style={{ fontSize: 13, color: "#94a3b8" }}>{order.client}</div>
                  </div>
                  <Badge status={order.status} />
                </div>

                <div style={{ background: "#0f172a", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 14, color: "#f97316", fontWeight: 700 }}>📍 {order.address}</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>📞 {order.phone}</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                    💰 Cobrar: <strong style={{ color: "#f1f5f9" }}>{formatPrice(order.total + order.deliveryFee)}</strong>
                    <span style={{ color: "#64748b" }}> ({order.payMethod})</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    Tu fee de envío: {formatPrice(order.deliveryFee)}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  {order.status === "picked" && (
                    <button onClick={() => updateStatus(order.id, "delivering")} style={{ ...actionBtn("#f97316"), flex: 1 }}>
                      📍 Saliendo hacia cliente
                    </button>
                  )}
                  {order.status === "delivering" && (
                    <button onClick={() => updateStatus(order.id, "delivered")} style={{ ...actionBtn("#10b981"), flex: 1 }}>
                      ✅ Confirmar entrega
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Delivered history */}
        {delivered.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: "#10b981", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, marginTop: 8 }}>
              ✅ Historial de hoy
            </div>
            {delivered.map(order => (
              <div key={order.id} style={{ background: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 8, opacity: 0.7 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700 }}>{order.id} — {order.client}</span>
                  <span style={{ color: "#10b981", fontWeight: 800 }}>+{formatPrice(order.deliveryFee)}</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{order.address}</div>
              </div>
            ))}
            <div style={{ background: "#1e293b", borderRadius: 12, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#64748b" }}>Ganado hoy en envíos</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#10b981" }}>
                {formatPrice(delivered.reduce((s, o) => s + o.deliveryFee, 0))}
              </div>
            </div>
          </>
        )}

        {available.length === 0 && active.length === 0 && (
          <div style={{ textAlign: "center", padding: 50, color: "#475569" }}>
            <div style={{ fontSize: 52 }}>🛵</div>
            <div style={{ marginTop: 12, fontSize: 16 }}>Sin pedidos disponibles</div>
            <div style={{ fontSize: 13, marginTop: 6, color: "#334155" }}>Los pedidos aparecerán aquí cuando estén listos</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const inputStyle = {
  padding: "10px 14px",
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 10,
  color: "#f1f5f9",
  fontSize: 14,
  fontFamily: "'Nunito', sans-serif",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const btnSmall = (bg) => ({
  background: bg,
  border: "none",
  borderRadius: 8,
  width: 30,
  height: 30,
  color: "#fff",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const actionBtn = (bg) => ({
  background: bg,
  border: "none",
  borderRadius: 10,
  padding: "8px 16px",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "'Nunito', sans-serif",
});

// ──────────────────────────────────────────────────────────────────────────────
//  ROOT APP
// ──────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [role, setRole] = useState(null); // null | client | restaurant | delivery
  const [orders, setOrders] = useState(ORDERS_INITIAL);

  // Auto-update elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setOrders(prev => prev.map(o =>
        ["preparing"].includes(o.status)
          ? { ...o, elapsed: o.elapsed + 1 }
          : o
      ));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  if (!role) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0f172a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Nunito', sans-serif",
        padding: 24,
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

        <style>{`
          @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
          @keyframes glow { 0%,100% { box-shadow:0 0 10px rgba(8,145,178,0.3); } 50% { box-shadow:0 0 25px rgba(8,145,178,0.6); } }
          @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.7; } }
        `}</style>

        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 72, animation: "float 3s ease-in-out infinite" }}>🍽️</div>
          <div style={{
            fontSize: 42,
            fontWeight: 900,
            color: "#f1f5f9",
            marginTop: 8,
            letterSpacing: -1,
          }}>RapidoYa</div>
          <div style={{ color: "#64748b", fontSize: 16, marginTop: 6 }}>
            Tu comida favorita, en tu puerta
          </div>
        </div>

        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ color: "#475569", fontSize: 13, fontWeight: 700, textAlign: "center", marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" }}>
            ¿Quién sos?
          </div>

          {[
            { key: "client", icon: "👤", label: "Soy Cliente", sub: "Hacer pedidos y seguirlos en tiempo real", color: "#f97316", glow: "rgba(249,115,22,0.4)" },
            { key: "restaurant", icon: "🍽️", label: "Soy Restaurante", sub: "Gestionar pedidos y menú", color: "#7c3aed", glow: "rgba(124,58,237,0.4)" },
            { key: "delivery", icon: "🛵", label: "Soy Repartidor", sub: "Ver y aceptar pedidos disponibles", color: "#0891b2", glow: "rgba(8,145,178,0.4)" },
          ].map(opt => (
            <button key={opt.key} onClick={() => setRole(opt.key)} style={{
              width: "100%",
              background: "#1e293b",
              border: `1px solid ${opt.color}44`,
              borderRadius: 20,
              padding: "20px 24px",
              marginBottom: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 18,
              textAlign: "left",
              transition: "transform 0.15s, box-shadow 0.15s",
              fontFamily: "'Nunito', sans-serif",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 30px ${opt.glow}`; e.currentTarget.style.borderColor = opt.color; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.borderColor = `${opt.color}44`; }}
            >
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: opt.color + "22",
                border: `2px solid ${opt.color}44`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                flexShrink: 0,
              }}>{opt.icon}</div>
              <div>
                <div style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 17 }}>{opt.label}</div>
                <div style={{ color: "#64748b", fontSize: 13, marginTop: 3 }}>{opt.sub}</div>
              </div>
              <div style={{ marginLeft: "auto", color: opt.color, fontSize: 20 }}>→</div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 32, fontSize: 12, color: "#334155", textAlign: "center" }}>
          Demo interactiva · Datos simulados
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a" }}>
      <style>{`
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
        @keyframes glow { 0%,100% { box-shadow:0 0 10px rgba(8,145,178,0.3); } 50% { box-shadow:0 0 25px rgba(8,145,178,0.6); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.7; } }
        * { box-sizing: border-box; }
        input::placeholder { color: #475569; }
      `}</style>

      {/* Role switcher */}
      <div style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 100,
      }}>
        <button onClick={() => setRole(null)} style={{
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 12,
          padding: "10px 16px",
          color: "#94a3b8",
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 13,
          fontFamily: "'Nunito', sans-serif",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        }}>🔄 Cambiar rol</button>
      </div>

      {role === "client" && <ClientView orders={orders} setOrders={setOrders} />}
      {role === "restaurant" && <RestaurantView orders={orders} setOrders={setOrders} />}
      {role === "delivery" && <DeliveryView orders={orders} setOrders={setOrders} />}
    </div>
  );
}
