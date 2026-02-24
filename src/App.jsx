import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

// ─── ADMIN EMAIL ─────────────────────────────────────────────────────────────
const ADMIN_EMAIL = "admin@rapidoya.com"; // Cambiá esto por tu email

// ─── ESTILOS COMPARTIDOS ──────────────────────────────────────────────────────
const S = {
  input: {
    padding: "10px 14px", background: "#0f172a", border: "1px solid #334155",
    borderRadius: 10, color: "#f1f5f9", fontSize: 14,
    fontFamily: "'Nunito', sans-serif", outline: "none",
    width: "100%", boxSizing: "border-box",
  },
  btnSmall: (bg) => ({
    background: bg, border: "none", borderRadius: 8, width: 30, height: 30,
    color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 16,
    display: "flex", alignItems: "center", justifyContent: "center",
  }),
  btn: (bg) => ({
    background: bg, border: "none", borderRadius: 10, padding: "8px 16px",
    color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13,
    fontFamily: "'Nunito', sans-serif",
  }),
  card: {
    background: "#1e293b", borderRadius: 16, padding: 18,
    marginBottom: 14, border: "1px solid #334155",
  },
};

const fp = (n) => `$${Number(n).toLocaleString("es-AR")}`;

const STATUS_CONFIG = {
  pending:    { label: "Esperando confirmación", color: "#f59e0b", icon: "⏳" },
  accepted:   { label: "Pedido confirmado",       color: "#3b82f6", icon: "✅" },
  preparing:  { label: "En preparación",          color: "#8b5cf6", icon: "👨‍🍳" },
  ready:      { label: "Listo para retirar",      color: "#06b6d4", icon: "📦" },
  picked:     { label: "Repartidor en camino",    color: "#f97316", icon: "🛵" },
  delivering: { label: "En camino a tu casa",     color: "#f97316", icon: "📍" },
  delivered:  { label: "¡Entregado!",             color: "#10b981", icon: "🎉" },
  rejected:   { label: "Rechazado",               color: "#ef4444", icon: "❌" },
};

function Badge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{ background: c.color + "22", color: c.color, border: `1px solid ${c.color}44`, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
      {c.icon} {c.label}
    </span>
  );
}

function ProgressBar({ status }) {
  const steps = ["accepted", "preparing", "ready", "picked", "delivered"];
  const idx = steps.indexOf(status);
  const pct = status === "pending" ? 0 : Math.round(((idx + 1) / steps.length) * 100);
  return (
    <div style={{ margin: "12px 0" }}>
      <div style={{ height: 8, background: "#0f172a", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#f97316,#fb923c)", borderRadius: 4, transition: "width 0.6s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        {["✅","👨‍🍳","📦","🛵","🎉"].map((icon, i) => (
          <span key={i} style={{ fontSize: 18, opacity: i <= idx ? 1 : 0.25 }}>{icon}</span>
        ))}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ width: 36, height: 36, border: "3px solid #334155", borderTop: "3px solid #f97316", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  AUTH SCREEN
// ──────────────────────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | register
  const [role, setRole] = useState("client");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { name: form.name, phone: form.phone, role } }
        });
        if (signUpError) throw signUpError;
        setError("✅ Revisá tu email para confirmar tu cuenta, luego iniciá sesión.");
        setMode("login");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (signInError) throw signInError;
      }
    } catch (e) {
      setError(e.message || "Error al procesar");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ fontSize: 60, marginBottom: 12, animation: "float 3s ease-in-out infinite" }}>🍽️</div>
      <div style={{ fontSize: 36, fontWeight: 900, color: "#f1f5f9", letterSpacing: -1 }}>RapidoYa</div>
      <div style={{ color: "#64748b", fontSize: 14, marginTop: 4, marginBottom: 32 }}>Tu comida favorita, en tu puerta</div>

      <div style={{ width: "100%", maxWidth: 380, background: "#1e293b", borderRadius: 24, padding: 28, border: "1px solid #334155" }}>
        {/* Tabs login/register */}
        <div style={{ display: "flex", marginBottom: 24, background: "#0f172a", borderRadius: 12, padding: 4 }}>
          {[["login","Iniciar sesión"],["register","Registrarse"]].map(([key, label]) => (
            <button key={key} onClick={() => { setMode(key); setError(""); }} style={{
              flex: 1, padding: "10px", borderRadius: 10, border: "none",
              background: mode === key ? "#f97316" : "transparent",
              color: mode === key ? "#fff" : "#64748b",
              fontWeight: 800, cursor: "pointer", fontSize: 14, fontFamily: "'Nunito', sans-serif",
            }}>{label}</button>
          ))}
        </div>

        {mode === "register" && (
          <>
            <label style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Nombre completo</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Juan García" style={{ ...S.input, marginTop: 6, marginBottom: 14 }} />

            <label style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Teléfono</label>
            <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="+54 11 1234-5678" style={{ ...S.input, marginTop: 6, marginBottom: 14 }} />

            <label style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Soy...</label>
            <div style={{ display: "flex", gap: 8, marginTop: 6, marginBottom: 14 }}>
              {[["client","👤 Cliente"],["restaurant","🍽️ Restaurante"],["delivery","🛵 Repartidor"]].map(([key, label]) => (
                <button key={key} onClick={() => setRole(key)} style={{
                  flex: 1, padding: "10px 4px", borderRadius: 10, border: "none",
                  background: role === key ? "#f9731622" : "#0f172a",
                  color: role === key ? "#f97316" : "#64748b",
                  border: role === key ? "2px solid #f97316" : "1px solid #334155",
                  fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: "'Nunito', sans-serif",
                }}>{label}</button>
              ))}
            </div>
          </>
        )}

        <label style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Email</label>
        <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          placeholder="tu@email.com" type="email" style={{ ...S.input, marginTop: 6, marginBottom: 14 }} />

        <label style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Contraseña</label>
        <input value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
          placeholder="••••••••" type="password" style={{ ...S.input, marginTop: 6, marginBottom: 20 }}
          onKeyDown={e => e.key === "Enter" && handleSubmit()} />

        {error && (
          <div style={{ background: error.startsWith("✅") ? "#10b98122" : "#ef444422", border: `1px solid ${error.startsWith("✅") ? "#10b981" : "#ef4444"}`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: error.startsWith("✅") ? "#10b981" : "#ef4444" }}>
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: "100%", background: loading ? "#334155" : "linear-gradient(135deg,#f97316,#ea580c)",
          border: "none", borderRadius: 14, padding: 16, color: "#fff",
          fontWeight: 900, fontSize: 16, cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "'Nunito', sans-serif",
        }}>
          {loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  VISTA CLIENTE
// ──────────────────────────────────────────────────────────────────────────────
function ClientView({ user, profile, onLogout }) {
  const [screen, setScreen] = useState("home");
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedRest, setSelectedRest] = useState(null);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [trackOrder, setTrackOrder] = useState(null);
  const [address, setAddress] = useState("");
  const [payMethod, setPayMethod] = useState("Efectivo");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Cargar restaurantes
  useEffect(() => {
    supabase.from("restaurants").select("*").eq("active", true)
      .then(({ data }) => { setRestaurants(data || []); setLoading(false); });
  }, []);

  // Cargar pedidos del cliente con realtime
  useEffect(() => {
    supabase.from("orders").select("*").eq("client_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data || []));

    const channel = supabase.channel("client-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `client_id=eq.${user.id}` },
        (payload) => {
          setOrders(prev => {
            const exists = prev.find(o => o.id === payload.new.id);
            if (exists) return prev.map(o => o.id === payload.new.id ? payload.new : o);
            return [payload.new, ...prev];
          });
          if (trackOrder?.id === payload.new.id) setTrackOrder(payload.new);
        }
      ).subscribe();
    return () => supabase.removeChannel(channel);
  }, [user.id]);

  const loadMenu = async (rest) => {
    const { data } = await supabase.from("menu_items").select("*").eq("restaurant_id", rest.id).eq("available", true);
    setMenuItems(data || []);
    setSelectedRest(rest);
    setScreen("menu");
  };

  const addToCart = (item) => setCart(prev => {
    const ex = prev.find(c => c.id === item.id);
    if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
    return [...prev, { ...item, qty: 1 }];
  });

  const removeFromCart = (id) => setCart(prev => {
    const ex = prev.find(c => c.id === id);
    if (ex?.qty === 1) return prev.filter(c => c.id !== id);
    return prev.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c);
  });

  const placeOrder = async () => {
    if (!address.trim()) { alert("Ingresá tu dirección"); return; }
    const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const { data, error } = await supabase.from("orders").insert({
      client_id: user.id,
      restaurant_id: selectedRest.id,
      items: cart.map(c => ({ id: c.id, name: c.name, qty: c.qty, price: c.price })),
      total: cartTotal,
      delivery_fee: 500,
      address,
      pay_method: payMethod,
      status: "pending",
    }).select().single();
    if (error) { alert("Error al crear pedido: " + error.message); return; }
    setTrackOrder(data);
    setCart([]);
    setScreen("tracking");
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const activeOrders = orders.filter(o => !["delivered","rejected"].includes(o.status));
  const filtered = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", color: "#f1f5f9", minHeight: "100%", background: "#0f172a" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", padding: "16px 20px", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 4px 20px rgba(249,115,22,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {screen !== "home" && (
              <button onClick={() => screen === "cart" ? setScreen("menu") : setScreen("home")}
                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", fontSize: 18 }}>←</button>
            )}
            <div>
              <div style={{ fontWeight: 900, fontSize: 20 }}>🍽️ RapidoYa</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>👤 {profile?.name}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {cart.length > 0 && (
              <button onClick={() => setScreen("cart")} style={{ background: "#fff", color: "#f97316", border: "none", borderRadius: 20, padding: "6px 14px", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>
                🛒 {cart.reduce((s, c) => s + c.qty, 0)}
              </button>
            )}
            <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 20, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontFamily: "'Nunito', sans-serif" }}>Salir</button>
          </div>
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 600, margin: "0 auto", paddingBottom: 90 }}>

        {/* HOME */}
        {screen === "home" && (
          <>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍  Buscar restaurante o categoría..."
              style={{ ...S.input, margin: "16px 0", padding: "12px 16px", borderRadius: 14, fontSize: 15 }} />

            {activeOrders.map(o => (
              <div key={o.id} onClick={() => { setTrackOrder(o); setScreen("tracking"); }} style={{ background: "linear-gradient(135deg,#1e293b,#0f172a)", border: "1px solid #f97316", borderRadius: 16, padding: 14, marginBottom: 16, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 800, color: "#f97316" }}>Pedido activo</div>
                    <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{o.id}</div>
                  </div>
                  <Badge status={o.status} />
                </div>
                <ProgressBar status={o.status} />
              </div>
            ))}

            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 16 }}>
              {["🍕 Pizzas","🥩 Parrilla","🍣 Japonesa","🍔 Burgers","🥗 Saludable"].map(cat => (
                <button key={cat} onClick={() => setSearch(cat.split(" ")[1])} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 20, padding: "8px 16px", color: "#94a3b8", cursor: "pointer", whiteSpace: "nowrap", fontSize: 13, fontFamily: "'Nunito', sans-serif" }}>{cat}</button>
              ))}
            </div>

            {loading ? <Spinner /> : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>
                <div style={{ fontSize: 48 }}>🍽️</div>
                <div style={{ marginTop: 12 }}>No hay restaurantes disponibles aún</div>
              </div>
            ) : filtered.map(rest => (
              <div key={rest.id} onClick={() => loadMenu(rest)} style={{ background: "#1e293b", borderRadius: 18, marginBottom: 14, cursor: "pointer", overflow: "hidden", border: "1px solid #334155" }}>
                <div style={{ background: "linear-gradient(135deg,#1e3a5f,#1e293b)", height: 80, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>{rest.image}</div>
                <div style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 17 }}>{rest.name}</div>
                      <div style={{ fontSize: 13, color: "#94a3b8" }}>{rest.category}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#fbbf24", fontWeight: 700 }}>⭐ {rest.rating}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{rest.delivery_time}</div>
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
            <div style={{ background: "linear-gradient(135deg,#1e3a5f,#0f172a)", borderRadius: 18, padding: 20, marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: 60 }}>{selectedRest.image}</div>
              <div style={{ fontWeight: 900, fontSize: 22, marginTop: 8 }}>{selectedRest.name}</div>
              <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>⭐ {selectedRest.rating} · {selectedRest.delivery_time} · Envío $500</div>
            </div>
            {menuItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>
                <div style={{ fontSize: 40 }}>🍽️</div>
                <div style={{ marginTop: 12 }}>Este restaurante aún no cargó su menú</div>
              </div>
            ) : menuItems.map(item => {
              const inCart = cart.find(c => c.id === item.id);
              return (
                <div key={item.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center", border: inCart ? "1px solid #f97316" : "1px solid #334155" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ fontSize: 32 }}>{item.image}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{item.description}</div>
                      <div style={{ color: "#f97316", fontWeight: 800, marginTop: 4 }}>{fp(item.price)}</div>
                    </div>
                  </div>
                  <div>
                    {inCart ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button onClick={() => removeFromCart(item.id)} style={S.btnSmall("#334155")}>−</button>
                        <span style={{ fontWeight: 800, minWidth: 20, textAlign: "center" }}>{inCart.qty}</span>
                        <button onClick={() => addToCart(item)} style={S.btnSmall("#f97316")}>+</button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(item)} style={{ background: "#f97316", border: "none", borderRadius: 10, padding: "8px 16px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "'Nunito', sans-serif" }}>Agregar</button>
                    )}
                  </div>
                </div>
              );
            })}
            {cart.length > 0 && (
              <div style={{ position: "sticky", bottom: 16, marginTop: 16 }}>
                <button onClick={() => setScreen("cart")} style={{ width: "100%", background: "linear-gradient(135deg,#f97316,#ea580c)", border: "none", borderRadius: 16, padding: 16, color: "#fff", fontWeight: 900, fontSize: 17, cursor: "pointer", fontFamily: "'Nunito', sans-serif", boxShadow: "0 4px 20px rgba(249,115,22,0.5)" }}>
                  Ver carrito ({cart.reduce((s, c) => s + c.qty, 0)}) → {fp(cartTotal)}
                </button>
              </div>
            )}
          </>
        )}

        {/* CARRITO */}
        {screen === "cart" && (
          <>
            <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 16, marginTop: 4 }}>Tu pedido 🛒</div>
            {cart.map(item => (
              <div key={item.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>x{item.qty}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#f97316", fontWeight: 700 }}>{fp(item.price * item.qty)}</span>
                  <button onClick={() => removeFromCart(item.id)} style={S.btnSmall("#ef4444")}>−</button>
                  <button onClick={() => addToCart(item)} style={S.btnSmall("#f97316")}>+</button>
                </div>
              </div>
            ))}
            <div style={{ ...S.card }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ color: "#94a3b8" }}>Subtotal</span><span>{fp(cartTotal)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}><span style={{ color: "#94a3b8" }}>Envío</span><span>$500</span></div>
              <div style={{ borderTop: "1px solid #334155", paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 800, fontSize: 18 }}>Total</span>
                <span style={{ fontWeight: 900, fontSize: 18, color: "#f97316" }}>{fp(cartTotal + 500)}</span>
              </div>
            </div>
            <label style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>📍 Dirección de entrega</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Ej: San Martín 456, entre Rivadavia y Belgrano" style={{ ...S.input, marginBottom: 16 }} />
            <label style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>💳 Método de pago</label>
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {["Efectivo","Débito"].map(m => (
                <button key={m} onClick={() => setPayMethod(m)} style={{ flex: 1, padding: 12, borderRadius: 12, border: payMethod === m ? "2px solid #f97316" : "1px solid #334155", background: payMethod === m ? "#f9731622" : "#1e293b", color: payMethod === m ? "#f97316" : "#94a3b8", cursor: "pointer", fontWeight: 700, fontFamily: "'Nunito', sans-serif", fontSize: 14 }}>
                  {m === "Efectivo" ? "💵" : "💳"} {m}
                </button>
              ))}
            </div>
            <button onClick={placeOrder} style={{ width: "100%", background: "linear-gradient(135deg,#f97316,#ea580c)", border: "none", borderRadius: 16, padding: 18, color: "#fff", fontWeight: 900, fontSize: 17, cursor: "pointer", fontFamily: "'Nunito', sans-serif", boxShadow: "0 4px 20px rgba(249,115,22,0.5)" }}>
              🚀 Confirmar pedido — {fp(cartTotal + 500)}
            </button>
          </>
        )}

        {/* TRACKING */}
        {screen === "tracking" && trackOrder && (
          <>
            <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 16, marginTop: 4 }}>📍 Seguimiento en vivo</div>
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17 }}>{trackOrder.id}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>📍 {trackOrder.address}</div>
                </div>
                <Badge status={trackOrder.status} />
              </div>
              <ProgressBar status={trackOrder.status} />
              {!["delivered","rejected"].includes(trackOrder.status) && (
                <div style={{ background: "#0f172a", borderRadius: 12, padding: 14, textAlign: "center", marginTop: 8 }}>
                  <div style={{ fontSize: 13, color: "#64748b" }}>Tiempo estimado</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: "#f97316" }}>{trackOrder.prep_time} min</div>
                </div>
              )}
            </div>
            <div style={S.card}>
              {trackOrder.items?.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#94a3b8" }}>x{item.qty} {item.name}</span>
                  <span>{fp(item.price * item.qty)}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #334155", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Envío</span><span>{fp(trackOrder.delivery_fee)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontWeight: 800 }}>Total</span>
                <span style={{ fontWeight: 900, color: "#f97316" }}>{fp(trackOrder.total + trackOrder.delivery_fee)}</span>
              </div>
              <div style={{ marginTop: 8, padding: "8px 12px", background: "#0f172a", borderRadius: 10, fontSize: 13, color: "#64748b" }}>
                💳 Pago: {trackOrder.pay_method}
              </div>
            </div>
            <button onClick={() => setScreen("home")} style={{ ...S.btn("#334155"), width: "100%", padding: 14, fontSize: 15 }}>← Volver al inicio</button>
          </>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  VISTA RESTAURANTE
// ──────────────────────────────────────────────────────────────────────────────
function RestaurantView({ user, profile, onLogout }) {
  const [tab, setTab] = useState("orders");
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", description: "", price: "", image: "🍽️" });
  const [restForm, setRestForm] = useState({ name: "", category: "General", image: "🍽️", delivery_time: "25-35 min" });
  const [loading, setLoading] = useState(true);
  const [editingPrepTime, setEditingPrepTime] = useState(null);
  const [newPrepTime, setNewPrepTime] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: rest } = await supabase.from("restaurants").select("*").eq("owner_id", user.id).single();
      if (rest) {
        setRestaurant(rest);
        const { data: items } = await supabase.from("menu_items").select("*").eq("restaurant_id", rest.id);
        setMenuItems(items || []);
        const { data: ords } = await supabase.from("orders").select("*").eq("restaurant_id", rest.id).order("created_at", { ascending: false });
        setOrders(ords || []);

        // Realtime pedidos
        const channel = supabase.channel("restaurant-orders")
          .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${rest.id}` },
            (payload) => {
              setOrders(prev => {
                const exists = prev.find(o => o.id === payload.new.id);
                if (exists) return prev.map(o => o.id === payload.new.id ? payload.new : o);
                return [payload.new, ...prev];
              });
            }
          ).subscribe();
        return () => supabase.removeChannel(channel);
      }
      setLoading(false);
    };
    load();
  }, [user.id]);

  useEffect(() => { if (restaurant) setLoading(false); }, [restaurant]);

  const createRestaurant = async () => {
    if (!restForm.name) return;
    const { data } = await supabase.from("restaurants").insert({ ...restForm, owner_id: user.id }).select().single();
    if (data) setRestaurant(data);
  };

  const updateStatus = async (id, status) => {
    await supabase.from("orders").update({ status }).eq("id", id);
  };

  const updatePrepTime = async (id) => {
    const val = parseInt(newPrepTime);
    if (!isNaN(val) && val > 0) await supabase.from("orders").update({ prep_time: val }).eq("id", id);
    setEditingPrepTime(null);
  };

  const addMenuItem = async () => {
    if (!newItem.name || !newItem.price) return;
    const { data } = await supabase.from("menu_items").insert({ ...newItem, price: parseFloat(newItem.price), restaurant_id: restaurant.id }).select().single();
    if (data) setMenuItems(prev => [...prev, data]);
    setNewItem({ name: "", description: "", price: "", image: "🍽️" });
  };

  const deleteMenuItem = async (id) => {
    await supabase.from("menu_items").delete().eq("id", id);
    setMenuItems(prev => prev.filter(i => i.id !== id));
  };

  if (loading) return <div style={{ background: "#0f172a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;

  // Setup restaurante si no existe
  if (!restaurant) return (
    <div style={{ fontFamily: "'Nunito', sans-serif", color: "#f1f5f9", minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 52 }}>🍽️</div>
          <div style={{ fontWeight: 900, fontSize: 24, marginTop: 8 }}>Configurá tu restaurante</div>
          <div style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Solo la primera vez</div>
        </div>
        <div style={{ background: "#1e293b", borderRadius: 20, padding: 24 }}>
          <input value={restForm.name} onChange={e => setRestForm(p => ({ ...p, name: e.target.value }))} placeholder="Nombre del restaurante" style={{ ...S.input, marginBottom: 12 }} />
          <input value={restForm.category} onChange={e => setRestForm(p => ({ ...p, category: e.target.value }))} placeholder="Categoría (Pizzas, Parrilla...)" style={{ ...S.input, marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <input value={restForm.image} onChange={e => setRestForm(p => ({ ...p, image: e.target.value }))} placeholder="Emoji" style={{ ...S.input, width: 80, textAlign: "center", fontSize: 24 }} />
            <input value={restForm.delivery_time} onChange={e => setRestForm(p => ({ ...p, delivery_time: e.target.value }))} placeholder="Tiempo estimado" style={{ ...S.input, flex: 1 }} />
          </div>
          <button onClick={createRestaurant} style={{ width: "100%", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: 14, padding: 16, color: "#fff", fontWeight: 900, fontSize: 16, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
            Crear restaurante
          </button>
        </div>
      </div>
    </div>
  );

  const pendingOrders = orders.filter(o => o.status === "pending");
  const cookingOrders = orders.filter(o => ["accepted","preparing"].includes(o.status));
  const readyOrders = orders.filter(o => o.status === "ready");

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", color: "#f1f5f9", minHeight: "100%", background: "#0f172a" }}>
      <div style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", padding: "16px 20px", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 4px 20px rgba(124,58,237,0.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{restaurant.image} {restaurant.name}</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>Panel de cocina · {profile?.name}</div>
          </div>
          <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 20, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontFamily: "'Nunito', sans-serif" }}>Salir</button>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: 16, paddingBottom: 90 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["orders","📋 Pedidos"],["menu","📝 Menú"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: tab === key ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "#1e293b", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 14, fontFamily: "'Nunito', sans-serif" }}>{label}</button>
          ))}
        </div>

        {tab === "orders" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Pendientes", count: pendingOrders.length, color: "#f59e0b" },
                { label: "En cocina", count: cookingOrders.length, color: "#7c3aed" },
                { label: "Listos", count: readyOrders.length, color: "#10b981" },
              ].map(s => (
                <div key={s.label} style={{ background: "#1e293b", borderRadius: 14, padding: 14, textAlign: "center", border: `1px solid ${s.color}33` }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {orders.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>
                <div style={{ fontSize: 48 }}>🍽️</div>
                <div style={{ marginTop: 12, fontSize: 16 }}>No hay pedidos aún</div>
              </div>
            )}

            {orders.filter(o => !["delivered","rejected"].includes(o.status)).map(order => (
              <div key={order.id} style={{ ...S.card, border: `1px solid ${(STATUS_CONFIG[order.status] || STATUS_CONFIG.pending).color}44` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 17 }}>{order.id}</div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>📍 {order.address}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>💳 {order.pay_method}</div>
                  </div>
                  <Badge status={order.status} />
                </div>
                <div style={{ background: "#0f172a", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  {order.items?.map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                      <span>x{item.qty} {item.name}</span>
                      <span style={{ color: "#7c3aed", fontWeight: 700 }}>{fp(item.price * item.qty)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid #1e293b", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
                    <span>Total</span><span>{fp(order.total)}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: "#64748b" }}>⏱</span>
                  {editingPrepTime === order.id ? (
                    <>
                      <input value={newPrepTime} onChange={e => setNewPrepTime(e.target.value)} type="number"
                        style={{ width: 60, padding: "4px 8px", background: "#0f172a", border: "1px solid #7c3aed", borderRadius: 8, color: "#f1f5f9", fontFamily: "'Nunito', sans-serif", fontSize: 14 }} />
                      <span style={{ fontSize: 13, color: "#64748b" }}>min</span>
                      <button onClick={() => updatePrepTime(order.id)} style={S.btn("#10b981")}>✓</button>
                      <button onClick={() => setEditingPrepTime(null)} style={S.btn("#ef4444")}>✕</button>
                    </>
                  ) : (
                    <>
                      <span style={{ color: "#7c3aed", fontWeight: 800 }}>{order.prep_time} min</span>
                      <button onClick={() => { setEditingPrepTime(order.id); setNewPrepTime(order.prep_time); }} style={S.btn("#334155")}>Ajustar</button>
                    </>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {order.status === "pending" && (<><button onClick={() => updateStatus(order.id, "accepted")} style={S.btn("#7c3aed")}>✅ Aceptar</button><button onClick={() => updateStatus(order.id, "rejected")} style={S.btn("#ef4444")}>✕ Rechazar</button></>)}
                  {order.status === "accepted" && <button onClick={() => updateStatus(order.id, "preparing")} style={S.btn("#7c3aed")}>👨‍🍳 Iniciar preparación</button>}
                  {order.status === "preparing" && <button onClick={() => updateStatus(order.id, "ready")} style={S.btn("#10b981")}>📦 Marcar listo</button>}
                  {order.status === "ready" && <div style={{ fontSize: 13, color: "#10b981", padding: "8px 0" }}>✅ Esperando repartidor...</div>}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === "menu" && (
          <>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 14 }}>Menú de {restaurant.name}</div>
            {menuItems.map(item => (
              <div key={item.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 28 }}>{item.image}</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{item.description}</div>
                    <div style={{ color: "#7c3aed", fontWeight: 700, marginTop: 2 }}>{fp(item.price)}</div>
                  </div>
                </div>
                <button onClick={() => deleteMenuItem(item.id)} style={S.btn("#ef4444")}>Eliminar</button>
              </div>
            ))}
            <div style={{ ...S.card, border: "1px dashed #334155", marginTop: 8 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: "#94a3b8" }}>+ Agregar nuevo plato</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <input value={newItem.image} onChange={e => setNewItem(p => ({ ...p, image: e.target.value }))} placeholder="🍽️" style={{ ...S.input, width: 70, textAlign: "center", fontSize: 22 }} />
                <input value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} placeholder="Nombre del plato" style={{ ...S.input, flex: 1 }} />
              </div>
              <input value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} placeholder="Descripción" style={{ ...S.input, marginBottom: 10 }} />
              <div style={{ display: "flex", gap: 10 }}>
                <input value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} type="number" placeholder="Precio $" style={{ ...S.input, flex: 1 }} />
                <button onClick={addMenuItem} style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 14, fontFamily: "'Nunito', sans-serif" }}>Agregar</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  VISTA REPARTIDOR
// ──────────────────────────────────────────────────────────────────────────────
function DeliveryView({ user, profile, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [feeInput, setFeeInput] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('orders');
  const [mpLink, setMpLink] = useState(profile?.mp_link || '');
  const [savingMp, setSavingMp] = useState(false);

  useEffect(() => {
    const load = async () => {
      // Pedidos listos disponibles
      const { data: ready } = await supabase.from("orders").select("*").eq("status", "ready").is("delivery_id", null);
      // Mis entregas
      const { data: mine } = await supabase.from("orders").select("*").eq("delivery_id", user.id).order("created_at", { ascending: false });
      setOrders(ready || []);
      setMyDeliveries(mine || []);
      setLoading(false);
    };
    load();

    const channel = supabase.channel("delivery-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" },
        (payload) => {
          const o = payload.new;
          if (o.status === "ready" && !o.delivery_id) {
            setOrders(prev => prev.find(x => x.id === o.id) ? prev.map(x => x.id === o.id ? o : x) : [o, ...prev]);
          } else {
            setOrders(prev => prev.filter(x => x.id !== o.id));
          }
          if (o.delivery_id === user.id) {
            setMyDeliveries(prev => prev.find(x => x.id === o.id) ? prev.map(x => x.id === o.id ? o : x) : [o, ...prev]);
          }
        }
      ).subscribe();
    return () => supabase.removeChannel(channel);
  }, [user.id]);

  const saveMpLink = async () => {
    setSavingMp(true);
    await supabase.from("profiles").update({ mp_link: mpLink }).eq("id", user.id);
    setSavingMp(false);
    alert("✅ Link guardado correctamente");
  };

  const acceptDelivery = async (order) => {
    const fee = parseInt(feeInput[order.id]) || 500;
    await supabase.from("orders").update({ status: "picked", delivery_id: user.id, delivery_fee: fee }).eq("id", order.id);
  };

  const updateStatus = async (id, status) => {
    await supabase.from("orders").update({ status }).eq("id", id);
  };

  if (loading) return <div style={{ background: "#0f172a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;

  const active = myDeliveries.filter(o => !["delivered","rejected"].includes(o.status));
  const delivered = myDeliveries.filter(o => o.status === "delivered");
  const todayEarnings = delivered.reduce((s, o) => s + (o.delivery_fee || 0), 0);

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", color: "#f1f5f9", minHeight: "100%", background: "#0f172a" }}>
      <div style={{ background: "linear-gradient(135deg,#0891b2,#0e7490)", padding: "16px 20px", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 4px 20px rgba(8,145,178,0.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>🛵 Panel Repartidor</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>{profile?.name} · En línea</div>
          </div>
          <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 20, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontFamily: "'Nunito', sans-serif" }}>Salir</button>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: 16, paddingBottom: 90 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Disponibles", count: orders.length, color: "#0891b2" },
            { label: "En curso", count: active.length, color: "#f97316" },
            { label: "Ganado hoy", count: fp(todayEarnings), color: "#10b981" },
          ].map(s => (
            <div key={s.label} style={{ background: "#1e293b", borderRadius: 14, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: s.label === "Ganado hoy" ? 18 : 28, fontWeight: 900, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {orders.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: "#0891b2", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>📦 Listos para retirar</div>
            {orders.map(order => (
              <div key={order.id} style={{ ...S.card, border: "1px solid #0891b244" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{order.id}</div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>📍 {order.address}</div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>💳 {order.pay_method} · {fp(order.total)}</div>
                  </div>
                  <Badge status={order.status} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  {order.items?.map((item, i) => <div key={i} style={{ fontSize: 13, color: "#64748b" }}>x{item.qty} {item.name}</div>)}
                </div>
                <div style={{ background: "#0f172a", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>💰 Tu precio de envío:</div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input type="number" value={feeInput[order.id] || ""} onChange={e => setFeeInput(p => ({ ...p, [order.id]: e.target.value }))}
                      placeholder="500" style={{ ...S.input, width: 100, textAlign: "center" }} />
                    <span style={{ fontSize: 13, color: "#64748b" }}>→ Total cliente: {fp(order.total + (parseInt(feeInput[order.id]) || 500))}</span>
                  </div>
                </div>
                <button onClick={() => acceptDelivery(order)} style={{ width: "100%", background: "linear-gradient(135deg,#0891b2,#0e7490)", border: "none", borderRadius: 12, padding: 14, color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                  🛵 Aceptar y retirar
                </button>
              </div>
            ))}
          </>
        )}

        {active.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: "#f97316", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, marginTop: 8 }}>🛵 En curso</div>
            {active.map(order => (
              <div key={order.id} style={{ ...S.card, border: "1px solid #f9731644" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{order.id}</div>
                    <div style={{ fontSize: 14, color: "#f97316", fontWeight: 700 }}>📍 {order.address}</div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>💰 Cobrar: <strong style={{ color: "#f1f5f9" }}>{fp(order.total + order.delivery_fee)}</strong> ({order.pay_method})</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>Tu fee: {fp(order.delivery_fee)}</div>
                  </div>
                  <Badge status={order.status} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {order.status === "picked" && <button onClick={() => updateStatus(order.id, "delivering")} style={{ ...S.btn("#f97316"), flex: 1 }}>📍 Saliendo hacia cliente</button>}
                  {order.status === "delivering" && <button onClick={() => updateStatus(order.id, "delivered")} style={{ ...S.btn("#10b981"), flex: 1 }}>✅ Confirmar entrega</button>}
                </div>
              </div>
            ))}
          </>
        )}

        {orders.length === 0 && active.length === 0 && (
          <div style={{ textAlign: "center", padding: 50, color: "#475569" }}>
            <div style={{ fontSize: 52 }}>🛵</div>
            <div style={{ marginTop: 12, fontSize: 16 }}>Sin pedidos disponibles</div>
            <div style={{ fontSize: 13, marginTop: 6, color: "#334155" }}>Los pedidos aparecerán acá cuando estén listos</div>
          </div>
        )}

        {delivered.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: "#10b981", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, marginTop: 8 }}>✅ Entregas de hoy</div>
            {delivered.map(order => (
              <div key={order.id} style={{ background: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 8, opacity: 0.7 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700 }}>{order.id}</span>
                  <span style={{ color: "#10b981", fontWeight: 800 }}>+{fp(order.delivery_fee)}</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{order.address}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}


// ──────────────────────────────────────────────────────────────────────────────
//  PANEL ADMIN
// ──────────────────────────────────────────────────────────────────────────────
function AdminView({ onLogout }) {
  const [tab, setTab] = useState("restaurants");
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: rests } = await supabase.from("restaurants").select("*, profiles(name, phone)").order("created_at", { ascending: false });
      const { data: profs } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      setRestaurants(rests || []);
      setUsers(profs || []);
      setLoading(false);
    };
    load();
  }, []);

  const approveRestaurant = async (id, approved) => {
    await supabase.from("restaurants").update({ approved }).eq("id", id);
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, approved } : r));
  };

  const pending = restaurants.filter(r => !r.approved);
  const approved = restaurants.filter(r => r.approved);

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", color: "#f1f5f9", minHeight: "100%", background: "#0f172a" }}>
      <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", borderBottom: "2px solid #f97316", padding: "16px 20px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: "#f97316" }}>⚙️ Panel Admin · RapidoYa</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Control total de la plataforma</div>
          </div>
          <button onClick={onLogout} style={S.btn("#334155")}>Salir</button>
        </div>
      </div>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Usuarios", count: users.length, color: "#f97316" },
            { label: "Pendientes", count: pending.length, color: "#f59e0b" },
            { label: "Aprobados", count: approved.length, color: "#10b981" },
            { label: "Repartidores", count: users.filter(u => u.role === "delivery").length, color: "#0891b2" },
          ].map(s => (
            <div key={s.label} style={{ background: "#1e293b", borderRadius: 14, padding: 14, textAlign: "center", border: `1px solid ${s.color}33` }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["restaurants","🍽️ Restaurantes"],["users","👥 Usuarios"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: tab === key ? "linear-gradient(135deg,#f97316,#ea580c)" : "#1e293b", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 14, fontFamily: "'Nunito', sans-serif" }}>{label}</button>
          ))}
        </div>
        {loading ? <Spinner /> : (
          <>
            {tab === "restaurants" && (
              <>
                {pending.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>⏳ Esperando aprobación</div>
                    {pending.map(r => (
                      <div key={r.id} style={{ ...S.card, border: "1px solid #f59e0b55" }}>
                        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
                          <div style={{ fontSize: 40 }}>{r.image}</div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 17 }}>{r.name}</div>
                            <div style={{ fontSize: 13, color: "#94a3b8" }}>{r.category} · {r.delivery_time}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>Dueño: {r.profiles?.name} · {r.profiles?.phone}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => approveRestaurant(r.id, true)} style={{ ...S.btn("#10b981"), flex: 1, padding: 12, fontSize: 14 }}>✅ Aprobar</button>
                          <button onClick={() => approveRestaurant(r.id, false)} style={{ ...S.btn("#ef4444"), padding: 12, fontSize: 14 }}>Rechazar</button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {approved.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, color: "#10b981", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 8 }}>✅ Aprobados</div>
                    {approved.map(r => (
                      <div key={r.id} style={{ ...S.card, opacity: 0.85 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <div style={{ fontSize: 32 }}>{r.image}</div>
                            <div>
                              <div style={{ fontWeight: 700 }}>{r.name}</div>
                              <div style={{ fontSize: 12, color: "#64748b" }}>{r.category} · {r.profiles?.name}</div>
                            </div>
                          </div>
                          <button onClick={() => approveRestaurant(r.id, false)} style={S.btn("#334155")}>Suspender</button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {restaurants.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#475569" }}><div style={{ fontSize: 48 }}>🍽️</div><div style={{ marginTop: 12 }}>No hay restaurantes aún</div></div>}
              </>
            )}
            {tab === "users" && (
              <>
                {[["client","👤 Clientes"],["restaurant","🍽️ Restaurantes"],["delivery","🛵 Repartidores"]].map(([role, label]) => {
                  const filtered = users.filter(u => u.role === role);
                  if (!filtered.length) return null;
                  return (
                    <div key={role}>
                      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 12 }}>{label} ({filtered.length})</div>
                      {filtered.map(u => (
                        <div key={u.id} style={{ background: "#1e293b", borderRadius: 12, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{u.name}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{u.phone || "Sin teléfono"}</div>
                            {u.mp_link && <div style={{ fontSize: 12, color: "#06b6d4", marginTop: 2 }}>💳 {u.mp_link}</div>}
                          </div>
                          <div style={{ fontSize: 11, color: "#475569" }}>{new Date(u.created_at).toLocaleDateString("es-AR")}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  ROOT APP
// ──────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.hideSplash) setTimeout(window.hideSplash, 500);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    // Reintentar hasta que el trigger cree el perfil
    let attempts = 0;
    while (attempts < 5) {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (data) { setProfile(data); setLoading(false); return; }
      await new Promise(r => setTimeout(r, 800));
      attempts++;
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  return (
    <>
      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        *{box-sizing:border-box}
        body{margin:0;background:#0f172a}
        input::placeholder{color:#475569}
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {loading ? (
        <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
          <div style={{ fontSize: 60, animation: "float 1.5s ease-in-out infinite" }}>🍽️</div>
          <div style={{ color: "#f97316", fontSize: 28, fontWeight: 900, marginTop: 12 }}>RapidoYa</div>
          <div style={{ marginTop: 20 }}><Spinner /></div>
        </div>
      ) : !session ? (
        <AuthScreen onAuth={setSession} />
      ) : profile?.role === "restaurant" ? (
        <RestaurantView user={session.user} profile={profile} onLogout={handleLogout} />
      ) : profile?.role === "delivery" ? (
        <DeliveryView user={session.user} profile={profile} onLogout={handleLogout} />
      ) : (
        <ClientView user={session.user} profile={profile} onLogout={handleLogout} />
      )}
    </>
  );
}
